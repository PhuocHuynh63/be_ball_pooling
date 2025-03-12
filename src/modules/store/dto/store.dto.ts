import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, Matches } from 'class-validator';

export class FindStoreDto {
    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'Thuan',
        description: 'Search by name',
        required: false,
    })
    term?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'false',
        description: 'Filter by isDeleted',
        required: false,
    })
    isDeleted?: boolean;

    @IsOptional()
    @ApiProperty({
        example: '1',
        description: 'Current page number',
        required: false,
    })
    current?: string = '1';

    @ApiProperty({
        example: '10',
        description: 'Number of items per page',
        required: false,
    })
    @IsOptional()
    pageSize?: string = '10';

    @IsOptional()
    @IsString()
    @Matches(/^(createdAt|updatedAt|name|email|phone|status)$/)
    @ApiProperty({
        example: 'createdAt',
        description: 'createdAt|updatedAt|name|email|phone|status',
        required: false,
    })
    sortBy?: string = 'createdAt';

    @IsOptional()
    @Matches(/^(asc|desc)$/)
    @ApiProperty({
        example: 'desc',
        description: 'asc|desc',
        required: false,
    })
    sortDirection?: 'asc' | 'desc' = 'desc';
}