import { IsNotEmpty, IsMongoId, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateTeamDto {
  @IsNotEmpty()
  @IsString()
  teamName: string;

  @IsNotEmpty()
  @IsMongoId()
  user: string;

  @IsNotEmpty()
  @IsMongoId()
  match: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsNumber()
  foulCount?: number;

  @IsOptional()
  @IsNumber()
  stroke?: number;
}