import { Match } from '../entities/Match.schema';

export class MatchResponseDto {
  match: Match;
  message?: string;
}