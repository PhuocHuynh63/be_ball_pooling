import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CreateStoreDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  readonly location: string;

  @IsNotEmpty()
  @IsString()
  readonly status: string;

  @IsNotEmpty()
  @IsString()
  readonly address: string;

  @IsNotEmpty()
  @IsMongoId()
  readonly manager: string;
}