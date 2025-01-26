import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class CreatePoolTableDto {
  @IsNotEmpty()
  @IsString()
  readonly qrCode: string;

  @IsNotEmpty()
  @IsString()
  readonly status: string;

  @IsNotEmpty()
  readonly tableType: {
    type_name: string;
    compatible_mode: string[];
  };

  @IsNotEmpty()
  readonly store: string; // Store ID
}