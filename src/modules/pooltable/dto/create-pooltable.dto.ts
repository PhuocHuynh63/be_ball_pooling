import { IsNotEmpty, IsString, IsArray, IsMongoId } from 'class-validator';

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
  @IsMongoId()
  readonly store: string; // Store ID
}