import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Match } from '@modules/match/entities/match.schema';
import { Team } from '@modules/team/entities/team.schemas';
import { NotFoundException, Logger } from '@nestjs/common';
import { PoolTableService } from '@modules/pooltable/pooltable.service';
import { UserService } from '@modules/user/user.service';
import { Types } from 'mongoose';
import { createClient } from 'redis';

interface GuestInfo {
    socketId: string;
    name: string;
}

@WebSocketGateway({ cors: true })
export class GameGateway {
  private readonly logger = new Logger(GameGateway.name);
  private redisClient;

  constructor(
    @InjectModel(Match.name) private matchModel: Model<Match>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
    private readonly poolTableService: PoolTableService,
    private readonly userService: UserService,
  ) {
    this.logger.debug('GameGateway initialized on port 8080');
    // Create and connect the official redis client
    this.redisClient = createClient({ 
        url: 'redis://default:DIn7T1JNCpdil4VdVJWiNIe3eAPYRWcN@redis-15218.crce178.ap-east-1-1.ec2.redns.redis-cloud.com:15218'
      });
    this.redisClient.connect().catch(console.error);
  }

    @SubscribeMessage('createRoom')
    async handleCreateRoom(
        @MessageBody() {
            matchId,
            hostUserId,
            guestName,
            pooltable,   // required: scanned QR code ID
            mode_game    // required: chosen game mode
        }: {
            matchId?: string;
            hostUserId?: string;
            guestName?: string;
            pooltable: string;
            mode_game: string;
        },
        @ConnectedSocket() client: Socket,
    ) {
        this.logger.debug(
            `createRoom payload: ${JSON.stringify({ matchId, hostUserId, guestName, pooltable, mode_game })}`
        );

        // Validate pooltable exists.
        let foundPoolTable;
        try {
            foundPoolTable = await this.poolTableService.findOne(pooltable);
        } catch (error) {
            this.logger.error(`Pool table not found: ${pooltable}`);
            throw new NotFoundException(`Pool table with id ${pooltable} not found`);
        }

        // If hostUserId is provided, ensure that the user exists.
        if (hostUserId) {
            try {
                await this.userService.findOne(hostUserId);
            } catch (error) {
                this.logger.error(`User not found: ${hostUserId}`);
                throw new NotFoundException(`User with id ${hostUserId} not found`);
            }
        }

        let roomId: string;
        let match;
        if (matchId) {
            match = await this.matchModel.findById(matchId);
            this.logger.debug("Found match with provided matchId:", match);
        }
        if (!match) {
            const hostType = hostUserId ? 'account' : 'guest';
            // Create a new match using provided pooltable and mode_game
            match = new this.matchModel({ status: 'pending', hostType, pooltable, mode_game });
            await match.save();
            this.logger.debug("New match created:", match);
            roomId = `match-${match._id}`;
            const team = new this.teamModel({
                teamName: "Team 1",
                members: hostUserId ? [hostUserId] : [],
                guestHost: hostUserId ? null : guestName,
                match: match._id,
                result: { score: 0, foulCount: 0, strokes: 0 },
            });
            await team.save();
            this.logger.debug("New team created:", team);
        } else {
            roomId = `match-${matchId}`;
            this.logger.debug("Using existing match, roomId:", roomId);
        }
        client.join(roomId);
        this.logger.debug(`Socket ${client.id} joined room ${roomId}`);
        return { event: 'roomCreated', roomId, matchId: match._id };
    }

    @SubscribeMessage('createTeam')
    async handleCreateTeam(
        @MessageBody() { matchId, userId }: { matchId: string; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = `match-${matchId}`;
        this.logger.debug(`User ${userId} requesting to create a new team for match ${matchId}`);

        // Check if match exists (optional, or assume createRoom already created a match)
        const match = await this.matchModel.findById(matchId);
        if (!match) {
            throw new NotFoundException(`Match with id ${matchId} not found`);
        }

        // Count existing teams.
        const teams = await this.teamModel.find({ match: matchId, isDeleted: false });
        const MAX_TEAMS = 2; // Example: allow maximum two teams.
        if (teams.length >= MAX_TEAMS) {
            throw new Error('Maximum number of teams reached');
        }

        // Create new team with the requesting user.
        const newTeam = new this.teamModel({
            teamName: `Team ${teams.length + 1}`,
            members: [userId],
            match: matchId,
            result: { score: 0, foulCount: 0, strokes: 0 },
        });
        await newTeam.save();
        this.logger.debug("New team created for match:", newTeam);

        client.join(roomId);
        return { event: 'teamCreated', roomId, teamId: newTeam._id };
    }

    @SubscribeMessage('joinTeam')
    async handleJoinMatch(
        @MessageBody() payload: any,
        @ConnectedSocket() client: Socket,
    ) {
        this.logger.debug("joinTeam payload received:", payload);
        // If payload is an array, extract first item.
        const { teamId, userId } = Array.isArray(payload) ? payload[0] : payload;

        if (!teamId || !userId) {
            throw new NotFoundException('teamId and userId must be provided');
        }

        // Find the team by teamId.
        const team = await this.teamModel.findById(teamId);
        if (!team) {
            throw new NotFoundException(`Team with id ${teamId} not found`);
        }

        // Add the user to the team if they are not already in it.
        if (!team.members.map((id) => id.toString()).includes(userId)) {
            team.members.push(new Types.ObjectId(userId));
            await team.save();
            this.logger.debug(`User ${userId} added to team:`, team);
        } else {
            this.logger.debug(`User ${userId} is already a member of team:`, team);
        }

        // Determine the room id from the team's match id.
        const roomId = `match-${team.match.toString()}`;
        client.join(roomId);
        this.logger.debug(`Socket ${client.id} joined room ${roomId}`);
        return { event: 'matchJoined', roomId, teamId: team._id };
    }

    // Guest joins the room (not saved to DB)
    @SubscribeMessage('joinAsGuest')
    async handleJoinAsGuest(
        @MessageBody() { matchId, guestName }: { matchId: string; guestName: string },
        @ConnectedSocket() client: Socket
    ) {
        const roomId = `match-${matchId}`;
        client.join(roomId);
        this.logger.debug(`Guest ${guestName} socket ${client.id} joined room ${roomId}`);

        // Create guest info and store it in redis
        const guestInfo = { socketId: client.id, name: guestName };
        // Use Redis list commands. Note: rPush is available in node-redis v4
        await this.redisClient.rPush(`room:${matchId}:guests`, JSON.stringify(guestInfo));
        this.logger.debug(`Stored guest info in Redis for match ${matchId}`);

        return { event: 'guestJoined', roomId, guestName };
    }

    @SubscribeMessage('getRoomGuests')
    async handleGetRoomGuests(
        @MessageBody() { matchId }: { matchId: string },
        @ConnectedSocket() client: Socket,
    ) {
        // Retrieve guest info from Redis
        const guestData = await this.redisClient.lRange(`room:${matchId}:guests`, 0, -1);
        const guests = guestData.map(data => JSON.parse(data));
        this.logger.debug(`Room guests for match ${matchId}:`, guests);
        return { event: 'roomGuests', matchId, guests };
    }

    // End the match and store final results in teams (and broadcast)
    @SubscribeMessage('endMatch')
    async handleEndMatch(
        @MessageBody() { matchId, teamResults }:
            { matchId: string; teamResults: Array<{ teamId: string; result: { score: number; foulCount: number; strokes: number } }> },
        @ConnectedSocket() client: Socket,
    ) {
        console.log("endMatch payload:", { matchId, teamResults });
        const match = await this.matchModel.findById(matchId);
        if (!match) {
            console.error("Match not found for id:", matchId);
            return { event: 'error', message: 'Match not found' };
        }
        match.status = 'finished';
        await match.save();
        console.log("Match updated to finished", match);

        for (const { teamId, result } of teamResults) {
            await this.teamModel.findByIdAndUpdate(teamId, { result });
            console.log(`Team ${teamId} updated with result`, result);
        }

        client.to(`match-${matchId}`).emit('matchEnded', { matchId, teamResults });
        console.log(`Broadcasting matchEnded to room match-${matchId}`);
        return { event: 'matchEnded', matchId, teamResults };
    }
}