import { IsNotEmpty, IsArray, ValidateNested, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class StrokeDto {
  @IsNotEmpty()
  _id: number;

  @IsNotEmpty()
  player: Types.ObjectId;

  @IsArray()
  ballsPotted: string[];

  @IsBoolean()
  foul: boolean;

  @IsString()
  action: string;
}

export class UpdateProgressDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrokeDto)
  progress: StrokeDto[];
}
