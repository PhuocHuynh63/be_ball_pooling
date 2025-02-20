import { IsNotEmpty, IsString, IsArray, IsMongoId, ValidateNested, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

class UserDto {
  @IsMongoId()
  user: string;
}

export class CreateMatchDto {
 
  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsString()
  mode_game: string;

  @IsNotEmpty()
  @IsMongoId()
  pooltable: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;
}