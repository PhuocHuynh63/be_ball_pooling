import { Match } from '../entities/match.schema';

export class MatchResponseDto {
  match: Match;
  message?: string;
}