import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class CreatePoolTableDto {
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  tableType: {
    type_name: string;
    compatible_mode: string[];
  };

  @IsNotEmpty()
  store: string; // Store ID
}