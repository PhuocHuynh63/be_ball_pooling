import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, ValidateNested } from "class-validator";


class ResultDto {
    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        example: 100,
        description: 'Score of the team',
    })
    score: number;

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        example: 2,
        description: 'Number of fouls committed by the team',
    })
    foulCount: number;

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        example: 5,
        description: 'Number of strokes taken by the team',
    })
    strokes: number;
}

export class UpdateTeamDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => ResultDto)
    @ApiProperty({
        type: ResultDto,
        description: 'Result of the team',
        required: false,
    })
    result?: ResultDto;
}