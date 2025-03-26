import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreDto } from './create-store.dto';
import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class UpdateStoreDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    example: 'Thuan Twice Hai',
    description: 'Name of the store',
  })
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    example: '29 Le Van Viet',
    description: 'Address of the store',
  })
  address?: string;

  @IsMongoId()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    example: '679372039468782a7f1e43ea',
    description: 'Manager ID of the store',
  })
  manager?: string | Types.ObjectId;

  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    example: false,
    description: 'Status of the store',
  })
  isDeleted: boolean;
}