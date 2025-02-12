import { IsNotEmpty, IsArray, ValidateNested, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class StrokeDto {
  @ApiProperty({
    example: "67967711609088d5835f8e98",
    description: "ID of the player performing the stroke",
  })
  @IsNotEmpty()
  player: Types.ObjectId;

  @ApiProperty({
    example: ["11", "8"],
    description: "List of balls potted during the stroke",
  })
  @IsArray()
  ballsPotted: string[];

  @ApiPropertyOptional({
    example: false,
    description: "Indicator if this stroke was a foul",
  })
  @IsBoolean()
  @IsOptional()
  foul?: boolean;
}

export class UpdateProgressDto {
  @ApiProperty({
    example: [
      {
        ballsPotted: ["11", "8"],
        player: "67967711609088d5835f8e98"
      }
    ],
    description: "List of strokes to update the match progress",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrokeDto)
  progress: StrokeDto[];
}
