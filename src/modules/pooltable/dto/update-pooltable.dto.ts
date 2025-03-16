import { PartialType } from '@nestjs/mapped-types';
import { CreatePoolTableDto } from './create-pooltable.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdatePoolTableDto extends PartialType(CreatePoolTableDto) {

  @ApiProperty({
    example: 'available or in_use or maintenance',
    description: 'Status of the pool table',
  })
  @IsOptional()
  @IsString()
  status?: string;


  @ApiProperty({
    example: '67966bd5d88c7fdb0809e3b8',
    description: 'Store ID associated with the pool table',
  })
  @IsOptional()
  @IsMongoId()
  store?: string;


  @ApiProperty({
    example: true,
    description: 'Flag to indicate if a new QR code should be generated',
  })
  @IsOptional()
  @IsBoolean()
  generateNewQRCode?: boolean;
}