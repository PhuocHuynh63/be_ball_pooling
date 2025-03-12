import { ApiProperty, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Matches } from 'class-validator';

@ApiQuery({ required: false })
export class FindMatchDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'search term',
    description: 'Search term for match',
    required: false
  })
  term?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'active',
    description: 'Status of the match',
    required: false
  })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'pooltable',
    description: 'ID of the pool table',
    required: false
  })
  pooltable?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'mode_game',
    description: 'Mode of the game',
    required: false
  })
  mode_game?: string;

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
  @Matches(/^(createdAt|updatedAt|status|mode_game)$/)
  @ApiProperty({
    example: 'createdAt',
    description: 'createdAt|updatedAt|status|mode_game',
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