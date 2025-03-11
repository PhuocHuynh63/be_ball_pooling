import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match } from '@modules/match/entities/match.schema';
import { Team } from '@modules/team/entities/team.schemas';
import { PoolTableService } from '@modules/pooltable/pooltable.service';
import { UserService } from '@modules/user/user.service';
import { createClient } from 'redis';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  public redisClient;

  constructor(
    @InjectModel(Match.name) private matchModel: Model<Match>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
    private readonly poolTableService: PoolTableService,
    private readonly userService: UserService,
  ) {
    this.redisClient = createClient({
      url: process.env.REDIS_URI,
    });
    this.redisClient.connect().catch(console.error);
  }

  async createRoom(payload: {
    matchId?: string;
    payloadHostUserId?: string;
    guestName?: string;
    pooltable: string;
    mode_game: string;
    effectiveHostUserId?: string;
  }): Promise<{ roomId: string; match: any }> {
    // Validate the pooltable exists
    try {
      await this.poolTableService.findOne(payload.pooltable);
    } catch (error) {
      throw new NotFoundException(`Pool table with id ${payload.pooltable} not found`);
    }

    let roomId: string;
    let match;

    // If matchId provided, try finding match.
    if (payload.matchId) {
      match = await this.matchModel.findById(payload.matchId);
      this.logger.debug("Found match with provided matchId:", match);
    }

    // If no match, create one.
    if (!match) {
      const hostType = payload.effectiveHostUserId ? 'account' : 'guest';
      match = new this.matchModel({ status: 'pending', hostType, pooltable: payload.pooltable, mode_game: payload.mode_game });
      await match.save();
      this.logger.debug("New match created:", match);

      roomId = `match-${match._id}`;

      // Create Team 1, using ObjectId for account hosts or storing guestName.
      const team1 = new this.teamModel({
        teamName: "Team 1",
        members: payload.effectiveHostUserId ? [new Types.ObjectId(payload.effectiveHostUserId)] : [],
        guestHost: payload.effectiveHostUserId ? null : payload.guestName,
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
    return { roomId, match };
  }

  async storeGuestInfo(matchId: string, clientId: string, guestName: string) {
    const guestInfo = { socketId: clientId, name: guestName };
    await this.redisClient.rPush(`room:${matchId}:guests`, JSON.stringify(guestInfo));
    this.logger.debug(`Stored guest info in Redis for match ${matchId}:`, guestInfo);
  }

  async changeTeam({ currentTeamId, newTeamId, userId }: { currentTeamId: string; newTeamId: string; userId: string }): Promise<string> {
    const currentTeam = await this.teamModel.findById(currentTeamId);
    const newTeam = await this.teamModel.findById(newTeamId);
    if (!currentTeam || !newTeam) {
      throw new NotFoundException('Team not found');
    }

    // Remove the user from the current team.
    currentTeam.members = currentTeam.members.filter(member => member.toString() !== userId);
    await currentTeam.save();

    // Add the user to the new team if not present.
    if (!newTeam.members.map(m => m.toString()).includes(userId)) {
      newTeam.members.push(new Types.ObjectId(userId));
      await newTeam.save();
      this.logger.debug(`User ${userId} moved from team ${currentTeamId} to team ${newTeamId}`);
    }
    return newTeam._id.toString();
  }

  async leaveTeam({ teamId, userId }: { teamId: string; userId: string }): Promise<string> {
    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    team.members = team.members.filter(member => member.toString() !== userId);
    await team.save();
    return team.match.toString();
  }

  async createTeam({ matchId, userId }: { matchId: string; userId: string }): Promise<any> {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException(`Match with id ${matchId} not found`);
    }
    const teams = await this.teamModel.find({ match: matchId, isDeleted: false });
    const MAX_TEAMS = 2;
    if (teams.length >= MAX_TEAMS) {
      throw new Error('Maximum number of teams reached');
    }
    const newTeam = new this.teamModel({
      teamName: `Team ${teams.length + 1}`,
      members: [userId],
      match: matchId,
      result: { score: 0, foulCount: 0, strokes: 0 },
    });
    await newTeam.save();
    return newTeam;
  }

  async joinTeam({ teamId, userId }: { teamId: string; userId: string }) {
    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }
    if (!team.members.map(id => id.toString()).includes(userId)) {
      team.members.push(new Types.ObjectId(userId));
      await team.save();
      this.logger.debug(`User ${userId} added to team:`, team);
    }
    return team;
  }

  async getRoomGuests(matchId: string): Promise<any[]> {
    const redisKey = `room:${matchId}:guests`;
    const guestData = await this.redisClient.lRange(redisKey, 0, -1);
    const guests = guestData.map(data => JSON.parse(data));
    this.logger.debug(`Parsed room guests for match ${matchId}:`, guests);
    return guests;
  }

  async endMatch({ matchId, teamResults }:
    { matchId: string; teamResults: Array<{ teamId: string; result: { score: number; foulCount: number; strokes: number } }> }) {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException(`Match with id ${matchId} not found`);
    }
    match.status = 'finished';
    await match.save();

    for (const { teamId, result } of teamResults) {
      await this.teamModel.findByIdAndUpdate(teamId, { result });
    }
    return { matchId, teamResults };
  }
}