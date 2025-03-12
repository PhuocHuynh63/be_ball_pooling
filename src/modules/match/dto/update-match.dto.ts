import { PartialType } from '@nestjs/mapped-types';
import { CreateMatchDto } from './create-match.dto';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateMatchDto {
    @IsOptional()
    @IsString()
    status: string;
    
}