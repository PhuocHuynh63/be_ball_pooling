import { PartialType } from '@nestjs/mapped-types';
import { CreateMatchDto } from './create-match.dto';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMatchDto {

    @IsString()
    @ApiProperty({
        example: 'playing or finished',
        description: 'Mode of the game',
        required: false
    })
    status: string;

}