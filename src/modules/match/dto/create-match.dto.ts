import { IsNotEmpty, IsString, IsArray, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UserDto {
  @IsMongoId()
  user: string;
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

  @IsNotEmpty()
  @IsMongoId()
  pooltable: string;
}