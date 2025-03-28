import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { UserRoles } from "src/constant/users.enums";


export class updateUsersDto {
    @IsNotEmpty({ message: 'name is required' })
    @ApiProperty({
        example: 'Thuan',
        description: 'Name of the user',
    })
    name: string;

    avatar: string;

    @IsNotEmpty({ message: 'email is required' })
    @ApiProperty({
        example: 'thuan@example.com',
        description: 'Email of the user',
    })
    email: string;

    @IsOptional()
    @ApiProperty({
        example: 'thuanpass123',
        description: 'password for old',
    })
    password: string;

    @IsOptional()
    @ApiProperty({
        example: 'thuanpass123',
        description: 'password for update',
    })
    passwordNew: string;


    @IsOptional()
    @ApiProperty({
        example: '123456',
        description: 'OTP for the email',
    })
    otp: string;

    @IsOptional()
    @ApiProperty({
        example: '0986056438',
        description: 'user phone number',
    })
    phone?: string;


    @IsOptional()
    @ApiProperty({
        example: 'active || inActive',
        description: 'Current status of the user account',
        required: false,
    })
    status: string;

    @IsEnum(['local', 'google'], { message: 'Auth provider must be either local or google' })
    @IsOptional()
    @ApiProperty({
        example: 'local',
        description: 'Authentication provider for the user',
        enum: ['local', 'google'],
        default: 'local',
        required: false,
    })
    authProvider?: 'local' | 'google';


}




