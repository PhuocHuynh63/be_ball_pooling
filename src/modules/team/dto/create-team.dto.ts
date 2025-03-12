import { IsNotEmpty, IsOptional, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ResultDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 100,
    description: 'Score of the team',
  })
  score: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 2,
    description: 'Number of fouls committed by the team',
  })
  foulCount: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 5,
    description: 'Number of strokes taken by the team',
  })
  strokes: number;
}

export class CreateTeamDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'Team Alpha',
    description: 'Name of the team',
  })
  teamName: string;

  @IsNotEmpty()
  @ApiProperty({
    example: ['67b3426976ac0a0ff0b207fe', '67b3445f76ac0a0ff0b20804'],
    description: 'Array of member IDs',
  })
  members: string[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '67d13f267aa5668090133cdb',
    description: 'ID of the match',
  })
  match: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResultDto)
  @ApiProperty({
    type: ResultDto,
    description: 'Result of the team',
    required: false,
  })
  result?: ResultDto;
}