import { IsNotEmpty, IsArray, ValidateNested, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class StrokeDto {
  @IsNotEmpty()
  player: Types.ObjectId;

  @IsArray()
  ballsPotted: string[];

  @IsBoolean()
  @IsOptional()
  foul?: boolean;
}

export class UpdateProgressDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrokeDto)
  progress: StrokeDto[];
}
