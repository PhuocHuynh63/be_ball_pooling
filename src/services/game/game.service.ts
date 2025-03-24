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

  //#region createRoom
  async createRoom(payload: {
    matchId?: string;
    payloadHostUserId?: string;
    guestName?: string;
    pooltable: string;
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
      match = new this.matchModel({
        status: 'pending',
        hostType,
        pooltable: new Types.ObjectId(payload.pooltable),
      });
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
  //#endregion

  //#region isGuestInRoom
  async isGuestInRoom(matchId: string, clientId: string): Promise<boolean> {
    const key = `room:${matchId}:guests`;
    const guests = await this.redisClient.lRange(key, 0, -1);
    for (const guestStr of guests) {
      const guest = JSON.parse(guestStr);
      if (guest.socketId === clientId) {
        return true;
      }
    }
    return false;
  }
  //#endregion

  //#region storeGuestInfo
  async storeGuestInfo(matchId: string, clientId: string, guestName: string) {
    const guestInfo = { socketId: clientId, name: guestName };
    await this.redisClient.rPush(`room:${matchId}:guests`, JSON.stringify(guestInfo));
    this.logger.debug(`Stored guest info in Redis for match ${matchId}:`, guestInfo);
  }
  //#endregion

  //#region removeGuestInfo
  async removeGuestInfo(matchId: string, clientId: string): Promise<void> {
    const key = `room:${matchId}:guests`;
    const guestEntries = await this.redisClient.lRange(key, 0, -1);
    for (const guestStr of guestEntries) {
      try {
        const guest = JSON.parse(guestStr);
        if (guest.socketId === clientId) {
          // Remove this guest entry from the list.
          await this.redisClient.lRem(key, 1, guestStr);
          this.logger.debug(`Removed guest info from Redis for match ${matchId}: ${guestStr}`);
          break;
        }
      } catch (error) {
        this.logger.error('Error parsing guest entry from Redis', error);
      }
    }
  }
  //#endregion

  // async addTeam({ matchId, userId }: { matchId: string; userId: string }): Promise<any> {
  //   const match = await this.matchModel.findById(matchId);
  //   if (!match) {
  //     throw new NotFoundException(`Match with id ${matchId} not found`);
  //   }
  //   // Count existing active teams for the match using ObjectId for proper matching.
  //   const teamCount = await this.teamModel.countDocuments({
  //     match: new Types.ObjectId(matchId),
  //     isDeleted: { $ne: true }
  //   });
  //   console.log(teamCount);
  //   const defaultTeamName = `Team ${teamCount + 1}`;

  //   const newTeam = new this.teamModel({
  //     teamName: defaultTeamName,
  //     members: [userId],
  //     // Ensure the match field is stored as an ObjectId.
  //     match: new Types.ObjectId(matchId),
  //     result: { score: 0, foulCount: 0, strokes: 0 },
  //   });
  //   await newTeam.save();
  //   this.logger.debug(`New team created: ${newTeam.teamName} for match ${matchId}`);
  //   return newTeam;
  // }

  //#region addTeam
  async addTeam({ matchId, userId }: { matchId: string; userId: string }): Promise<any> {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException(`Match with id ${matchId} not found`);
    }

    const newTeam = new this.teamModel({
      teamName: 'New Team',
      members: [userId],
      // Store the match as an ObjectId.
      match: new Types.ObjectId(matchId),
      result: { score: 0, foulCount: 0, strokes: 0 },
    });
    await newTeam.save();
    this.logger.debug(`New team created: ${newTeam.teamName} for match ${matchId}`);
    return newTeam;
  }
  //#endregion


  //#region removeTeam
  async removeTeam({ teamId, userId }: { teamId: string; userId: string }): Promise<string> {
    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    // Optionally, you can restrict removal to teams that the user owns or is a member of.
    // For now, we simply flag the team as deleted.
    team.isDeleted = true;
    await team.save();
    this.logger.debug(`Team ${teamId} removed by user ${userId}`);
    // Optionally, return the match id to update the client's room.
    return team.match.toString();
  }
  //#endregion

  //#region changeTeam
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
  //#endregion

  //#region leaveTeam
  async leaveTeam({ teamId, userId }: { teamId: string; userId: string }): Promise<string> {
    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    team.members = team.members.filter(member => member.toString() !== userId);
    await team.save();
    return team.match.toString();
  }
  //#endregion

  //#region createTeam
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
  //#endregion

  //#region joinTeam
  async joinTeam({ teamId, userId }: { teamId: string; userId: string }) {
    // Find the team the user is trying to join.
    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    // Prevent duplicate membership: Check if the user is already in any team for the same match.
    const existingTeam = await this.teamModel.findOne({
      match: team.match,
      members: { $in: [new Types.ObjectId(userId)] },
      isDeleted: { $ne: true }
    });

    // If found and it's not the same team, reject the join request.
    if (existingTeam && existingTeam._id.toString() !== teamId) {
      throw new Error('User is already in a team for this match');
    }

    // Add the user if not already a member of this team.
    if (!team.members.map(id => id.toString()).includes(userId)) {
      team.members.push(new Types.ObjectId(userId));
      await team.save();
      this.logger.debug(`User ${userId} added to team:`, team);
    }
    return team;
  }
  //#endregion

  async getPlayers(matchId: string): Promise<{ accounts: any[]; guests: any[] }> {
    // Query teams for account players (members)
    const teams = await this.teamModel.find({
      match: new Types.ObjectId(matchId),
      isDeleted: { $ne: true }
    });
    const accountIds: string[] = [];
    teams.forEach(team => {
      team.members.forEach(member => {
        if (member) {
          accountIds.push(member.toString());
        }
      });
    });

    // Populate user info for each account id using the UserService
    const accounts = await Promise.all(
      accountIds.map(async (id) => {
        try {
          const user = await this.userService.findOne(id);
          return user;
        } catch (error) {
          this.logger.error(`Error fetching user with id ${id}:`, error);
          return { id, error: 'User not found' };
        }
      })
    );

    // Get guest players from Redis & return only the name
    const key = `room:${matchId}:guests`;
    const guestEntries = await this.redisClient.lRange(key, 0, -1);
    const guests = guestEntries.map(entry => {
      try {
        const guest = JSON.parse(entry);
        return { name: guest.name };
      } catch (err) {
        this.logger.error('Error parsing guest entry from Redis:', err);
        return null;
      }
    }).filter(g => g !== null);

    return { accounts, guests };
  }

  //#region getRoomGuests
  async getRoomGuests(matchId: string): Promise<any[]> {
    const redisKey = `room:${matchId}:guests`;
    const guestData = await this.redisClient.lRange(redisKey, 0, -1);
    const guests = guestData.map(data => JSON.parse(data));
    this.logger.debug(`Parsed room guests for match ${matchId}:`, guests);
    return guests;
  }
  //#endregion

  //#region endMatch
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
  //#endregion

  //#region updateScore
  async updateScore({
    teamId,
    scoreDelta,
    foulDelta,
    strokesDelta,
  }: {
    teamId: string;
    scoreDelta: number;
    foulDelta: number;
    strokesDelta: number;
  }) {
    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }
    // Update the team's result fields with provided delta values.
    team.result.score = (team.result.score || 0) + scoreDelta;
    team.result.foulCount = (team.result.foulCount || 0) + foulDelta;
    team.result.strokes = (team.result.strokes || 0) + strokesDelta;

    await team.save();
    this.logger.debug(`Updated score for team ${teamId}:`, team.result);
    return team;
  }
  //#endregion

  //#region findTeamById
  async findTeamById(teamId: string): Promise<any> {
    return await this.teamModel.findById(teamId);
  }
  //#endregion

  //#region leaveMatch
  async leaveMatch({ matchId, userId }: { matchId: string; userId: string }): Promise<void> {
    // Remove the user from all teams associated with the match.
    await this.teamModel.updateMany(
      { match: new Types.ObjectId(matchId), members: { $in: [new Types.ObjectId(userId)] } },
      { $pull: { members: new Types.ObjectId(userId) } }
    );
    this.logger.debug(`User ${userId} removed from all teams in match ${matchId}`);
  }
  //#endregion
}

