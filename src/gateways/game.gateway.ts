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
import { OnGatewayConnection } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection {
    private readonly logger = new Logger(GameGateway.name);
    private redisClient;

    constructor(
        @InjectModel(Match.name) private matchModel: Model<Match>,
        @InjectModel(Team.name) private teamModel: Model<Team>,
        private readonly poolTableService: PoolTableService,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,  // Inject JwtService
    ) {
        this.logger.debug('GameGateway initialized on port 8080');
        this.redisClient = createClient({
            url: 'redis://default:DIn7T1JNCpdil4VdVJWiNIe3eAPYRWcN@redis-15218.crce178.ap-east-1-1.ec2.redns.redis-cloud.com:15218'
        });
        this.redisClient.connect().catch(console.error);
    }

    async handleConnection(client: Socket) {
        // Try to get the token from header, auth object or query string
        const token =
            client.handshake.headers?.access_token ||
            client.handshake.auth?.token ||
            client.handshake.query?.token;

        if (token) {
            try {
                const user = await this.jwtService.verifyAsync(token, {
                    secret: process.env.JWT_SECRET,
                });
                client.data.userId = user.sub; // Attach the authenticated user id
                this.logger.debug(`Client connected: ${client.id}, user: ${user.sub}`);
            } catch (error) {
                this.logger.error(`Authentication error: ${error.message}`);
                // Optionally disconnect on token errors or let them connect as guest
                // client.disconnect();
            }
        } else {
            // Allow guest connections without token.
            this.logger.debug(`Client connected as guest: ${client.id} (no token)`);
        }
    }

    //#region createRoom
    @SubscribeMessage('createRoom')
    async handleCreateRoom(
        @MessageBody() {
            matchId,
            hostUserId: payloadHostUserId, // may be provided but will be overridden by token if available.
            guestName,
            pooltable, // required: scanned QR code ID
            mode_game, // required: chosen game mode
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
            `createRoom payload: ${JSON.stringify({ matchId, hostUserId: payloadHostUserId, guestName, pooltable, mode_game })}`
        );

        // Validate the pooltable exists.
        try {
            await this.poolTableService.findOne(pooltable);
        } catch (error) {
            this.logger.error(`Pool table not found: ${pooltable}`);
            throw new NotFoundException(`Pool table with id ${pooltable} not found`);
        }

        // Determine the host: if the client is authenticated, use that ID.
        const accountUserId = client.data.userId;
        const effectiveHostUserId = accountUserId || payloadHostUserId;

        // If there’s a host, verify the user exists.
        if (effectiveHostUserId) {
            try {
                await this.userService.findOne(effectiveHostUserId);
            } catch (error) {
                this.logger.error(`User not found: ${effectiveHostUserId}`);
                throw new NotFoundException(`User with id ${effectiveHostUserId} not found`);
            }
        }

        let roomId: string;
        let match;

        // If a matchId was provided, try finding the match.
        if (matchId) {
            match = await this.matchModel.findById(matchId);
            this.logger.debug("Found match with provided matchId:", match);
        }

        // If no existing match, create a new one.
        if (!match) {
            const hostType = effectiveHostUserId ? 'account' : 'guest';
            match = new this.matchModel({ status: 'pending', hostType, pooltable, mode_game });
            await match.save();
            this.logger.debug("New match created:", match);

            roomId = `match-${match._id}`;

            // Create Team 1: for an account host, add their ObjectId; for a guest, store their guestName.
            const team1 = new this.teamModel({
                teamName: "Team 1",
                members: effectiveHostUserId ? [new Types.ObjectId(effectiveHostUserId)] : [],
                guestHost: effectiveHostUserId ? null : guestName,
                match: match._id,
                result: { score: 0, foulCount: 0, strokes: 0 },
            });
            await team1.save();
            this.logger.debug("New team created (Team 1):", team1);

            // Create Team 2 as an empty team.
            const team2 = new this.teamModel({
                teamName: "Team 2",
                members: [],
                guestHost: null,
                match: match._id,
                result: { score: 0, foulCount: 0, strokes: 0 },
            });
            await team2.save();
            this.logger.debug("New team created (Team 2):", team2);
        } else {
            roomId = `match-${match._id}`;
            this.logger.debug("Using existing match, roomId:", roomId);
        }

        // For guest initiators, also store their info in Redis.
        if (!accountUserId) {
            const guestInfo = { socketId: client.id, name: guestName };
            await this.redisClient.rPush(`room:${match._id}:guests`, JSON.stringify(guestInfo));
            this.logger.debug(`Stored guest info in Redis for match ${match._id}:`, guestInfo);
        }

        client.join(roomId);
        this.logger.debug(`Socket ${client.id} joined room ${roomId}`);

        return { event: 'roomCreated', roomId, matchId: match._id };
    }
    //#endregion

    //#region changeTeam
    @SubscribeMessage('changeTeam')
    async handleChangeTeam(
        @MessageBody() { currentTeamId, newTeamId }: { currentTeamId: string; newTeamId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.userId;
        if (!userId) {
            throw new NotFoundException('Authenticated user id not found');
        }

        const currentTeam = await this.teamModel.findById(currentTeamId);
        const newTeam = await this.teamModel.findById(newTeamId);
        if (!currentTeam || !newTeam) {
            throw new NotFoundException('Team not found');
        }

        // Remove user from the current team.
        currentTeam.members = currentTeam.members.filter(member => member.toString() !== userId);
        await currentTeam.save();

        // Add user to the new team if not already present.
        if (!newTeam.members.map(m => m.toString()).includes(userId)) {
            newTeam.members.push(new Types.ObjectId(userId));
            await newTeam.save();
            this.logger.debug(`User ${userId} moved from team ${currentTeamId} to team ${newTeamId}`);
        }

        return { event: 'teamChanged', newTeamId: newTeam._id };
    }
    //#endregion

    //#region leaveRoom
    @SubscribeMessage('leaveRoom')
    async handleLeaveRoom(
        @MessageBody() { teamId }: { teamId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.userId;
        if (!userId) {
            throw new NotFoundException('Authenticated user id not found');
        }

        const team = await this.teamModel.findById(teamId);
        if (!team) {
            throw new NotFoundException('Team not found');
        }

        // Remove user from team's members list.
        team.members = team.members.filter(member => member.toString() !== userId);
        await team.save();
        this.logger.debug(`User ${userId} left team ${teamId}`);

        // Optionally, have the user leave the Socket.IO room.
        const roomId = `match-${team.match.toString()}`;
        client.leave(roomId);
        this.logger.debug(`Socket ${client.id} left room ${roomId}`);

        return { event: 'leftRoom', roomId };
    }
    //#endregion

    //#region createTeam
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
    //#endregion

    //#region joinTeam
    @SubscribeMessage('joinTeam')
    async handleJoinMatch(
        @MessageBody() payload: any,
        @ConnectedSocket() client: Socket,
    ) {
        this.logger.debug("joinTeam payload received:", payload);
        const { teamId } = Array.isArray(payload) ? payload[0] : payload;
        const userId = client.data.userId; // Retrieved from your auth middleware/guard

        if (!teamId) {
            throw new NotFoundException('teamId must be provided');
        }
        if (!userId) {
            throw new NotFoundException('Authenticated user id not found');
        }

        const team = await this.teamModel.findById(teamId);
        if (!team) {
            throw new NotFoundException(`Team with id ${teamId} not found`);
        }

        if (!team.members.map((id) => id.toString()).includes(userId)) {
            team.members.push(new Types.ObjectId(userId));
            await team.save();
            this.logger.debug(`User ${userId} added to team:`, team);
        } else {
            this.logger.debug(`User ${userId} is already a member of team:`, team);
        }

        const roomId = `match-${team.match.toString()}`;
        client.join(roomId);
        this.logger.debug(`Socket ${client.id} joined room ${roomId}`);
        return { event: 'matchJoined', roomId, teamId: team._id };
    }
    //#endregion

    //#region joinAsGuest
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
    //#endregion

    //#region getRoomGuests
    @SubscribeMessage('getRoomGuests')
    async handleGetRoomGuests(
        @MessageBody() { matchId }: { matchId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const redisKey = `room:${matchId}:guests`;
        // Retrieve guest info as raw JSON strings from Redis
        const guestData = await this.redisClient.lRange(redisKey, 0, -1);
        // Log the raw data from Redis
        this.logger.debug(`Raw Redis data for key ${redisKey}:`, guestData);

        // Parse each JSON string
        const guests = guestData.map(data => JSON.parse(data));
        this.logger.debug(`Parsed room guests for match ${matchId}:`, guests);

        return { event: 'roomGuests', matchId, guests };
    }
    //#endregion

    //#region endMatch
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
    //#endregion
}