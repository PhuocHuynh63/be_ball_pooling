import { ApiProperty } from '@nestjs/swagger';
import { PoolTable } from '@modules/pooltable/entities/poolTable.schema';

export class StoreResponseDto {

    
    tables: PoolTable[];
}