import { IsNotEmpty, IsString, IsArray, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UserDto {
  @IsMongoId()
  user: string;

  @IsString()
  team?: string;
}

class ProgressDto {
  @IsNotEmpty()
  _id: number;

  @IsMongoId()
  player: string;

  @IsArray()
  score: number[];

  @IsString()
  status: string;
}

export class CreateMatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDto)
  users: UserDto[];

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsString()
  mode_game: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressDto)
  progress: ProgressDto[];

  @IsMongoId()
  @IsNotEmpty()
  pooltable: string;
}