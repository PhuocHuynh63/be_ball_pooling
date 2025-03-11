import { ApiProperty, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, Matches } from 'class-validator';


@ApiQuery({required: false})
export class FindUserDto {
    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'Thuan',
        description: 'Name of the user or phone number or email',
        required: false
    })
    term?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'user',
        description: 'Role of the user',
        required: false
    })
    role?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'active',
        description: 'Status of the user account',
        required: false
    })
    status?: string;

    @IsOptional()
    @ApiProperty({
        example: '1',
        description: 'Current page number',
        required: false
    })
    current?: string = '1';

    @ApiProperty({
        example: '10',
        description: 'Number of items per page',
        required: false
    })
    @IsOptional()
    pageSize?: string = '10';

    @IsOptional()
    @IsString()
    @Matches(/^(createdAt|updatedAt|name|email|phone|status)$/)
    @ApiProperty({
        example: 'createdAt',
        description: 'createdAt|updatedAt|name|email|phone|status',
        required: false
    })
    sortBy?: string = 'createdAt';

    @IsOptional()
    @Matches(/^(asc|desc)$/)
    @ApiProperty({
        example: 'desc',
        description: 'asc|desc',
        required: false
    })
    sortDirection?: 'asc' | 'desc' = 'desc';
}