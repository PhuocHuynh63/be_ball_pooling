import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CreateMatchDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'ready',
    description: 'Status of the match',
  })
  status: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '9-ball',
    description: 'Mode of the game',
  })
  mode_game: string;

  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty({
    example: '67ceec0d423880c8153405fc',
    description: 'ID of the pool table',
  })
  pooltable: string;
}