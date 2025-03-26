import { PartialType } from '@nestjs/mapped-types';
import { CreatePoolTableDto } from './create-pooltable.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class UpdatePoolTableDto {

  @ApiProperty({
    example: 'available or in_use or maintenance',
    description: 'Status of the pool table',
  })
  @IsOptional()
  @IsString()
  status?: string;


  @IsOptional()
  @ApiProperty({
    example: { type_name: 'Standard', compatible_mode: ['8-ball', '9-ball'] },
    description: 'Table type details for the pool table',
  })
  tableType: {
    type_name: string;
    compatible_mode: string[];
  };


  @ApiProperty({
    example: '67966bd5d88c7fdb0809e3b8',
    description: 'Store ID associated with the pool table',
  })
  @IsOptional()
  @IsMongoId()
  store?: string | Types.ObjectId;

}