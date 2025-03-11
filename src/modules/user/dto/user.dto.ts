import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, Matches } from 'class-validator';

export class FindUserDto {
    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'Thuan',
        description: 'Name of the user or phone number or email',
    })
    term?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'user',
        description: 'Role of the user',
    })
    role?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'active',
        description: 'Status of the user account',
    })
    status?: string;

    @IsOptional()
    @ApiProperty({
        example: '1',
        description: 'Current page number',
    })
    current?: string = '1';

    @ApiProperty({
        example: '10',
        description: 'Number of items per page',
    })
    @IsOptional()
    pageSize?: string = '10';

    @IsOptional()
    @IsString()
    @Matches(/^(createdAt|updatedAt|name|email|phone|status)$/)
    @ApiProperty({
        example: 'createdAt',
        description: 'createdAt|updatedAt|name|email|phone|status',
    })
    sortBy?: string = 'createdAt';

    @IsOptional()
    @Matches(/^(asc|desc)$/)
    @ApiProperty({
        example: 'desc',
        description: 'asc|desc',
    })
    sortDirection?: 'asc' | 'desc' = 'desc';
}