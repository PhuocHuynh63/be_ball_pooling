import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GameService } from '../services/game/game.service';

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection {
  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly gameService: GameService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers?.access_token ||
                  client.handshake.auth?.token ||
                  client.handshake.query?.token;

    if (token) {
      try {
        const user = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
        client.data.userId = user.sub;
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
      mode_game: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Determine the host: use authenticated uid if available.
    const accountUserId = client.data.userId;
    const effectiveHostUserId = accountUserId || payload.hostUserId;

    const { roomId, match } = await this.gameService.createRoom({
      matchId: payload.matchId,
      payloadHostUserId: payload.hostUserId,
      guestName: payload.guestName,
      pooltable: payload.pooltable,
      mode_game: payload.mode_game,
      effectiveHostUserId,
    });

    // For guest initiators, store guest info in Redis.
    if (!accountUserId) {
      await this.gameService.storeGuestInfo(match._id.toString(), client.id, payload.guestName);
    }
    client.join(roomId);
    this.logger.debug(`Socket ${client.id} joined room ${roomId}`);
    return { event: 'roomCreated', roomId, matchId: match._id };
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
    return { event: 'teamChanged', newTeamId };
  }
  //#endregion

  //#region leaveRoom
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() payload: { teamId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) throw new NotFoundException('Authenticated user id not found');

    const roomId = `match-${await this.gameService.leaveTeam({ teamId: payload.teamId, userId })}`;
    client.leave(roomId);
    this.logger.debug(`Socket ${client.id} left room ${roomId}`);
    return { event: 'leftRoom', roomId };
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
    return { event: 'teamCreated', roomId, teamId: newTeam._id };
  }
  //#endregion

  //#region joinTeam
  @SubscribeMessage('joinTeam')
  async handleJoinTeam(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.debug("joinTeam payload received:", payload);
    const teamId = Array.isArray(payload) ? payload[0].teamId : payload.teamId;
    const userId = client.data.userId;
    if (!teamId) throw new NotFoundException('teamId must be provided');
    if (!userId) throw new NotFoundException('Authenticated user id not found');

    const team = await this.gameService.joinTeam({ teamId, userId });
    const roomId = `match-${team.match.toString()}`;
    client.join(roomId);
    this.logger.debug(`Socket ${client.id} joined room ${roomId}`);
    return { event: 'matchJoined', roomId, teamId: team._id };
  }
  //#endregion

  //#region joinAsGuest
  @SubscribeMessage('joinAsGuest')
  async handleJoinAsGuest(
    @MessageBody() payload: { matchId: string; guestName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `match-${payload.matchId}`;
    client.join(roomId);
    this.logger.debug(`Guest ${payload.guestName} socket ${client.id} joined room ${roomId}`);

    await this.gameService.storeGuestInfo(payload.matchId, client.id, payload.guestName);
    return { event: 'guestJoined', roomId, guestName: payload.guestName };
  }
  //#endregion

  //#region getRoomGuests
  @SubscribeMessage('getRoomGuests')
  async handleGetRoomGuests(
    @MessageBody() payload: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const guests = await this.gameService.getRoomGuests(payload.matchId);
    return { event: 'roomGuests', matchId: payload.matchId, guests };
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
    this.logger.debug("endMatch payload:", payload);
    const response = await this.gameService.endMatch({ matchId: payload.matchId, teamResults: payload.teamResults });
    client.to(`match-${payload.matchId}`).emit('matchEnded', { matchId: payload.matchId, teamResults: response.teamResults });
    this.logger.debug(`Broadcasting matchEnded to room match-${payload.matchId}`);
    return { event: 'matchEnded', matchId: payload.matchId, teamResults: response.teamResults };
  }
  //#endregion
}