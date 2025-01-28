import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreDto } from './create-store.dto';
import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class UpdateStoreDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  address?: string;

  @IsMongoId()
  @IsNotEmpty()
  @IsOptional()
  manager?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  status?: string;
}