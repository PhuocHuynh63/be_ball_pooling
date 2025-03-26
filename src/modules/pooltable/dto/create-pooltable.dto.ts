import { IsNotEmpty, IsString, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CreatePoolTableDto {
 

  @ApiProperty({
    example: 'available',
    description: 'Status of the pool table',
  })
  @IsNotEmpty()
  @IsString()
  readonly status: string;

  @ApiProperty({
    example: { type_name: 'Standard', compatible_mode: ['8-ball', '9-ball'] },
    description: 'Table type details for the pool table',
  })
  @IsNotEmpty()
  readonly tableType: {
    type_name: string;
    compatible_mode: string[];
  };

  @ApiProperty({
    example: '67966bd5d88c7fdb0809e3b8',
    description: 'Store ID associated with the pool table',
  })
  @IsNotEmpty()
  @IsMongoId()
  readonly store: string;
  
}