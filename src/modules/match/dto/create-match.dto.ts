import { IsNotEmpty, IsString, IsArray, IsMongoId, ValidateNested, IsOptional, IsDate } from 'class-validator';



export class CreateMatchDto {
 
  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsString()
  mode_game: string;

  @IsNotEmpty()
  @IsMongoId()
  pooltable: string;


}