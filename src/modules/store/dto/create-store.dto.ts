import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'Thuan Twice Hai',
    description: 'Name of the store',
  })
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '29 Le Van Viet, TP.HCM',
    description: 'Address of the store',
  })
  readonly address: string;

  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty({
    example: '679372039468782a7f1e43ea',
    description: 'Manager ID of the store',
  })
  readonly manager: string;
  
}