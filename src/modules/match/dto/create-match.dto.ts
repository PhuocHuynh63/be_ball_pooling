import { IsNotEmpty, IsString, IsArray, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({
    example: '67967711609088d5835f8e98',
    description: 'ID of the user',
  })
  @IsMongoId()
  user: string;

  @ApiProperty({
    example: 'Team A',
    description: 'Team assigned to the user',
  })
  @IsString()
  team?: string;
}

class ProgressDto {
  @ApiProperty({
    example: 1,
    description: 'Progress identifier',
  })
  @IsNotEmpty()
  _id: number;

  @ApiProperty({
    example: '67967711609088d5835f8e98',
    description: 'ID of the player',
  })
  @IsMongoId()
  player: string;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Score array for the match progress',
  })
  @IsArray()
  score: number[];

  @ApiProperty({
    example: 'in-progress',
    description: 'Status of the match progress stage',
  })
  @IsString()
  status: string;
}

export class CreateMatchDto {
  @ApiProperty({
    example: [
      {
        user: '67967711609088d5835f8e98',
        team: 'Team A'
      },
      {
        user: '679371537948643e86c5c7ac',
        team: 'Team B'
      }
    ],
    description: 'List of users participating in the match along with their assigned teams',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDto)
  users: UserDto[];

  @ApiProperty({
    example: 'ongoing',
    description: 'Status of the match',
  })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({
    example: '8-ball',
    description: 'Game mode of the match',
  })
  @IsNotEmpty()
  @IsString()
  mode_game: string;

  @ApiProperty({
    example: [],
    description: 'Match progress information',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressDto)
  progress: ProgressDto[];

  @ApiProperty({
    example: '679938b1c833d30b623ceded',
    description: 'Pool table ID used for the match',
  })
  @IsMongoId()
  @IsNotEmpty()
  pooltable: string;
}