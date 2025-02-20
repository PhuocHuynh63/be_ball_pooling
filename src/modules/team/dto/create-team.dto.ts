import { IsNotEmpty, IsMongoId, IsOptional, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class ResultDto {
  @IsNotEmpty()
  @IsNumber()
  score: number;

  @IsNotEmpty()
  @IsNumber()
  foulCount: number;

  @IsNotEmpty()
  @IsNumber()
  strokes: number;
}

export class CreateTeamDto {
  @IsNotEmpty()
  @IsString()
  teamName: string;

  @IsNotEmpty()
  @IsMongoId({ each: true })
  members: Types.ObjectId[];

  @IsNotEmpty()
  @IsMongoId()
  match: Types.ObjectId;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResultDto)
  result?: ResultDto;
}