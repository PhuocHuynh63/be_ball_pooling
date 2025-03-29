import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GameService } from '../services/game/game.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly gameService: GameService,
  ) { }

  async handleConnection(client: Socket) {
    const token = client.handshake.headers?.access_token ||
      client.handshake.auth?.token ||
      client.handshake.query?.token;

    if (token) {
      try {
        const user = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
        client.data.userId = user.sub;
        client.data.userName = user.name;
        this.logger.debug(`Client connected: ${client.id}, user: ${user.sub}`);
      } catch (error) {
        this.logger.error(`Authentication error: ${error.message}`);
      }
    } else {
      this.logger.debug(`Client connected as guest: ${client.id} (no token)`);
    }
  }

  //#region createRoom
  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody() payload: {
      matchId?: string;
      hostUserId?: string;
      guestName?: string;
      pooltable: string;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const accountUserId = client.data.userId;
      const effectiveHostUserId = accountUserId || payload.hostUserId;
      const { roomId, match } = await this.gameService.createRoom({
        matchId: payload.matchId,
        payloadHostUserId: payload.hostUserId,
        guestName: payload.guestName,
        pooltable: payload.pooltable,
        effectiveHostUserId,
      });

      // Mark the client as host.
      client.data.isHost = true;

      // If a guest creates the room, store guest info.
      if (!accountUserId) {
        await this.gameService.storeGuestInfo(match._id.toString(), client.id, payload.guestName);
      }
      client.join(roomId);
      this.logger.debug(`Socket ${client.id} joined room ${roomId}`);
      client.emit('roomCreated', { roomId, matchId: match._id, isHost: true });
    } catch (error) {
      // Emit an error event that the client can listen to.
      client.emit('roomCreateError', { message: error.message });
    }
  }
  //#endregion

  //#region changeTeam
  @SubscribeMessage('changeTeam')
  async handleChangeTeam(
    @MessageBody() payload: { currentTeamId: string; newTeamId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) throw new NotFoundException('Authenticated user id not found');
    const newTeamId = await this.gameService.changeTeam({ currentTeamId: payload.currentTeamId, newTeamId: payload.newTeamId, userId });
    return client.emit('teamChanged', { newTeamId });
  }
  //#endregion

  //#region leaveTeam
  @SubscribeMessage('leaveTeam')
  async handleLeaveTeam(
    @MessageBody() payload: { teamId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) throw new NotFoundException('Authenticated user id not found');

    // Call leaveTeam to remove the user from the current team.
    // This method does not remove them from the room.
    const teamInfo = await this.gameService.leaveTeam({ teamId: payload.teamId, userId });
    this.logger.debug(`User ${userId} left team ${payload.teamId} but remains in the room`);
    return client.emit('teamLeft', { teamId: payload.teamId, info: teamInfo });
  }
  //#endregion

  //#region leaveRoom
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() payload: { matchId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userId = client.data.userId;
    const roomId = `match-${payload.matchId}`;

    if (userId) {
      await this.gameService.leaveMatch({ matchId: payload.matchId, userId });
    } else {
      const actualMatchId = payload.matchId.replace('match-', '');
      await this.gameService.removeGuestInfo(actualMatchId, client.id);
      this.logger.debug(`Guest socket ${client.id} removed from Redis for match ${actualMatchId}`);
    }

    // Prepare display name.
    let leavingName = '';
    if (userId) {
      // Use the stored name from the socket's data (set during authentication).
      leavingName = client.data.userName;
    } else {
      // For guests, assume you stored their name during room join (e.g., in client.data.guestName).
      leavingName = client.data.guestName || `Guest ${client.id}`;
    }

    // Broadcast to all clients in the room that this user has left BEFORE leaving the room.
    this.server.in(roomId).emit('userLeft', {
      roomId,
      userId: userId || client.id,
      message: `${leavingName} has left the room`
    });

    client.leave(roomId);
    this.logger.debug(`Socket ${client.id} left room ${roomId}`);

    client.emit('roomLeft', { roomId });
    return;
  }
  //#endregion

  //#region addTeam
  @SubscribeMessage('addTeam')
  async handleAddTeam(
    @MessageBody() payload: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `match-${payload.matchId}`;
    let effectiveUserId: string;

    // Check if the client is an authenticated user.
    if (client.data.userId) {
      effectiveUserId = client.data.userId;
    } else {
      // For guests, verify that they already joined the match (exists in Redis).
      const isGuest = await this.gameService.isGuestInRoom(payload.matchId, client.id);
      if (!isGuest) {
        throw new NotFoundException('Guest is not registered in the room. Cannot create team.');
      }
      effectiveUserId = client.id; // use the socket id as a temporary identifier for guests.
    }

    const newTeam = await this.gameService.addTeam({ matchId: payload.matchId, userId: effectiveUserId });
    client.join(roomId);
    this.logger.debug(`New team created: ${newTeam.teamName} (${newTeam._id}) in room ${roomId} by ${client.data.userId || 'guest'}`);
    return client.emit('teamAdded', { roomId, team: newTeam });
  }
  //#endregion

  //#region removeTeam
  @SubscribeMessage('removeTeam')
  async handleRemoveTeam(
    @MessageBody() payload: { teamId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const matchId = await this.gameService.removeTeam(payload);
    const roomId = `match-${matchId}`;
    // Optionally leave room if removal is needed.
    client.leave(roomId);
    this.logger.debug(`Team ${payload.teamId} removed and socket ${client.id} left room ${roomId}`);
    return client.emit('teamRemoved', { roomId, teamId: payload.teamId });
  }
  //#endregion

  //#region createTeam
  @SubscribeMessage('createTeam')
  async handleCreateTeam(
    @MessageBody() payload: { matchId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `match-${payload.matchId}`;
    const newTeam = await this.gameService.createTeam({ matchId: payload.matchId, userId: payload.userId });
    client.join(roomId);
    return client.emit('teamCreated', { roomId, teamId: newTeam._id });
  }
  //#endregion

  //#region joinTeam
  @SubscribeMessage('joinTeam')
  async handleJoinTeam(
    @MessageBody() payload: { teamId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.debug("joinTeam payload received:", payload);
    const { teamId } = payload;
    const userId = client.data.userId;

    if (!teamId) {
      return client.emit('joinTeamError', { message: 'teamId must be provided' });
    }
    if (!userId) {
      return client.emit('joinTeamError', { message: 'Authenticated user id not found' });
    }

    // First, get the team without modifying it, so we can know its match id.
    const team = await this.gameService.findTeamById(teamId);
    if (!team) {
      return client.emit('joinTeamError', { message: `Team with id ${teamId} not found` });
    }
    // Derive the roomId from the team match id.
    const roomId = `match-${team.match.toString()}`;

    console.log("joinTeam roomId:", roomId);
    console.log("joinTeam client.rooms:", client.rooms);

    // Check if socket is in the expected room.
    if (!client.rooms.has(roomId)) {
      client.emit('joinTeamError', 'Please join the room first before joining a team');
      return;
    }

    // At this point the user is in the right room, so add them to the team.
    const updatedTeam = await this.gameService.joinTeam({ teamId, userId });

    this.logger.debug(`Socket ${client.id} joined team ${teamId} in room ${roomId}`);
    client.emit('matchJoined', { roomId, teamId: updatedTeam._id });
    return;
  }
  //#endregion

  //#region joinRoom
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() payload: { matchId: string; guestName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `match-${payload.matchId}`;

    // Remove any other "match-" rooms (limits a user to one match at a time)
    client.rooms.forEach((r) => {
      if (r.startsWith('match-') && r !== roomId) {
        client.leave(r);
        this.logger.debug(`Socket ${client.id} left room ${r}`);
      }
    });

    if (client.rooms.has(roomId)) {
      return client.emit('roomJoined', { roomId, message: 'User already joined the room' });
    }

    // Now join the intended room.
    client.join(roomId);

    if (client.data.userId) {
      // Retrieve user info for authenticated users
      const user = await this.gameService.getUserInfo(client.data.userId);
      this.logger.debug(`Authenticated user ${client.data.userId} (${user.name}) joined room ${roomId}`);
      // Broadcast that the user joined with their name
      this.server.in(roomId).emit('userJoined', {
        roomId,
        userType: 'account',
        userName: user.name,
        message: `${user.name} joined the room`
      });
      return client.emit('roomJoined', { roomId, userType: 'account', userName: user.name });
    } else {
      // For guest users, using the provided guestName
      if (!payload.guestName) {
        throw new NotFoundException('Guest must provide a name to join the room');
      }
      const isGuest = await this.gameService.isGuestInRoom(payload.matchId, client.id);
      if (!isGuest) {
        await this.gameService.storeGuestInfo(payload.matchId, client.id, payload.guestName);
        this.logger.debug(`Guest ${payload.guestName} socket ${client.id} joined room ${roomId}`);
        this.server.in(roomId).emit('userJoined', {
          roomId,
          userType: 'guest',
          guestName: payload.guestName,
          message: `${payload.guestName} joined the room`,
          socketId: client.id
        });
        return client.emit('roomJoined', { roomId, userType: 'guest', guestName: payload.guestName });
      } else {
        this.logger.debug(`Guest ${payload.guestName} socket ${client.id} rejoined room ${roomId}`);
        return client.emit('roomJoined', { roomId, userType: 'guest', guestName: payload.guestName, message: 'Guest already joined' });
      }
    }
  }
  //#endregion

  //#region getPlayers
  @SubscribeMessage('getPlayers')
  async handleGetPlayers(
    @MessageBody() payload: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const players = await this.gameService.getPlayers(payload.matchId);
    this.logger.debug(`Fetching players for match ${payload.matchId}:`, players);
    return client.emit('matchPlayers', { matchId: payload.matchId, players });
  }
  //#endregion

  //#region getRoomPlayers
  @SubscribeMessage('getAllRoomPlayers')
  async handleGetAllRoomPlayers(
    @MessageBody() payload: { matchId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    // get account users (with their user info) and guests from Redis
    const { accounts, guests } = await this.gameService.getPlayers(payload.matchId);

    // (Assuming getPlayers returns an object like { accounts: [ { _id, name, ... } ], guests: [...] })

    // If your Redis guests have a different shape, adjust here.
    const combinedPlayers = [
      ...accounts.map(a => ({ userId: a._id, userName: a.name })),
      ...guests.map(g => ({ guestName: g.name }))
    ];

    // Broadcast the combined list to everyone in the match room.
    const roomId = `match-${payload.matchId}`;
    this.server.in(roomId).emit('allRoomPlayers', { matchId: payload.matchId, players: combinedPlayers });
  }
  //#endregion

  //#region getRoomGuests
  @SubscribeMessage('getRoomGuests')
  async handleGetRoomGuests(
    @MessageBody() payload: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const guests = await this.gameService.getRoomGuests(payload.matchId);
    return client.emit('roomGuests', { matchId: payload.matchId, guests });
  }
  //#endregion

  //#region getWaitingRoomPlayers
  @SubscribeMessage('getWaitingRoomPlayers')
  async handleGetWaitingRoomPlayers(
    @MessageBody() payload: { matchId: string; hostName?: string; hostImg?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const roomId = `match-${payload.matchId}`;

    // Get account users who are in the waiting room (have joined the room but not stored in a team)
    const accountPlayers = await Promise.all(
      (await this.server.in(roomId).fetchSockets())
        .filter(socket => socket.data.userId)
        .map(async socket => {
          try {
            const user = await this.gameService.getUserInfo(socket.data.userId);
            return { userId: socket.data.userId, userName: user.name, socketId: socket.id };
          } catch (error) {
            this.logger.error(`Error fetching info for user ${socket.data.userId} on socket ${socket.id}:`, error);
            return { userId: socket.data.userId, userName: 'Unknown', socketId: socket.id };
          }
        })
    );

    // Get guest players from Redis (as stored when they joined the room)
    const guestPlayers = await this.gameService.getRoomGuests(payload.matchId);
    // guestPlayers is expected to return an array of objects including at least { guestName, socketId }.

    // Combine both lists.
    const waitingPlayers = [...accountPlayers, ...guestPlayers];

    const hostName = payload.hostName;
    const hostImg = payload.hostImg;

    // Broadcast the combined list to everyone in the room.
    this.server.in(roomId).emit('waitingRoomPlayers', {
      matchId: payload.matchId,
      players: waitingPlayers,
      hostName,
      hostImg,
    });
  }
  //#endregion

  //#region startMatch
  @SubscribeMessage('startGame')
  async handleStartGame(
    @MessageBody() payload: { matchId: string; gameType: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const roomId = `match-${payload.matchId}`;
    // Optionally, update any game state in your GameService with the gameType.
    await this.gameService.startMatch(payload.matchId, payload.gameType);
    // Broadcast the game start event with the game type to all clients in the room.
    this.server.in(roomId).emit('startGame', { matchId: payload.matchId, gameType: payload.gameType });
    this.logger.debug(`Broadcasting startGame for match ${payload.matchId} with gameType ${payload.gameType} to room ${roomId}`);

    // Optionally, also send the event back to the sender.
    client.emit('startGame', { matchId: payload.matchId, gameType: payload.gameType });
  }
  //#endregion

  //#region endMatch
  @SubscribeMessage('endMatch')
  async handleEndMatch(
    @MessageBody() payload: {
      matchId: string;
      teamResults: Array<{ teamId: string; result: { score: number; foulCount: number; strokes: number } }>;
    },
    @ConnectedSocket() client: Socket,

  ) {
    const roomId = `match-${payload.matchId}`;
    this.logger.debug("endMatch payload:", payload);
    const response = await this.gameService.endMatch({ matchId: payload.matchId, teamResults: payload.teamResults });
    client.to(`match-${payload.matchId}`).emit('matchEnded', { matchId: payload.matchId, teamResults: response.teamResults });
    this.logger.debug(`Broadcasting matchEnded to room match-${payload.matchId}`);
    this.server.in(roomId).emit('matchEnded', { matchId: payload.matchId, teamResults: response.teamResults });
    return client.emit('matchEnded', { matchId: payload.matchId, teamResults: response.teamResults });
  }
  //#endregion

  //#region updateScore
  @SubscribeMessage('updateScore')
  async handleUpdateScore(
    @MessageBody() payload: { teamId: string; scoreDelta?: number; foulDelta?: number; strokesDelta?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { teamId, scoreDelta = 0, foulDelta = 0, strokesDelta = 0 } = payload;
    const updatedTeam = await this.gameService.updateScore({ teamId, scoreDelta, foulDelta, strokesDelta });
    // Determine the room based on the match id in the team object.
    const roomId = `match-${updatedTeam.match.toString()}`;
    // Broadcast updated score event to all clients in the room.
    client.to(roomId).emit('scoreUpdated', { teamId: updatedTeam._id, newResult: updatedTeam.result });
    return client.emit('scoreUpdated', { teamId: updatedTeam._id, newResult: updatedTeam.result });
  }
  //#endregion

  //#region pottedBall
  @SubscribeMessage('pottedBall')
  async handlePottedBall(
    @MessageBody() payload: { matchId: string; ballType: 'stripe' | 'smooth' | 'eight'; ballIndex?: number },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const roomId = `match-${payload.matchId}`;

    // Broadcast the potted ball value to all clients in the room.
    this.server.in(roomId).emit('ballPottedUpdate', payload);

    // Optionally, also send the event back to the emitter.
    client.emit('ballPottedUpdate', payload);
  }
  //#endregion

  //#region endTurn
  //#region endTurn
  @SubscribeMessage('endTurn')
  async handleEndTurn(
    @MessageBody() payload: { matchId: string; nextTurn?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const roomId = `match-${payload.matchId}`;
    // Broadcast the end turn event to all clients in the room.
    this.server.in(roomId).emit('turnEnded', {
      matchId: payload.matchId,
      nextTurn: payload.nextTurn, // Optionally indicate the next player's identifier.
      message: `Turn ended.`
    });
    // Also notify the sender.
    client.emit('turnEnded', {
      matchId: payload.matchId,
      nextTurn: payload.nextTurn,
      message: `Turn ended.`
    });
  }
  //#endregion

  //#region pauseGame
  @SubscribeMessage('pauseGame')
  async handlePauseGame(
    @MessageBody() payload: { matchId: string; pause: boolean },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const roomId = `match-${payload.matchId}`;
    // Broadcast the pause (or resume) state to all clients in the room.
    this.server.in(roomId).emit('gamePaused', {
      matchId: payload.matchId,
      pause: payload.pause,
      message: payload.pause ? 'Game has been paused.' : 'Game resumed.'
    });
    // Optionally, notify the sender as well.
    client.emit('gamePaused', {
      matchId: payload.matchId,
      pause: payload.pause,
      message: payload.pause ? 'Game has been paused.' : 'Game resumed.'
    });
  }
  //#endregion
}