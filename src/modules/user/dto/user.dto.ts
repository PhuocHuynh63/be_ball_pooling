import { IsOptional, IsString, IsNumber, Min, Max, Matches } from 'class-validator';

export class FindUserDto {
    @IsOptional()
    @IsString()
    term?: string;
    
    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    current?: string = '1';

    @IsOptional()
    pageSize?: string = '10';

    @IsOptional()
    @IsString()
    @Matches(/^(createdAt|updatedAt|name|email|phone|status)$/)
    sortBy?: string = 'createdAt';

    @IsOptional()
    @Matches(/^(asc|desc)$/)
    sortDirection?: 'asc' | 'desc' = 'desc';
}