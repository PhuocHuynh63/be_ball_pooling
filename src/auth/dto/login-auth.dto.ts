import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class LoginAuthDto {
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Email must be valid' })
    @ApiProperty({ example: 'user@example.com', description: 'Email' })
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    @ApiProperty({ example: 'password123', description: 'Password' })

    password: string;

}