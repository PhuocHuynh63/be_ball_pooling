import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRoles } from 'src/constant/users.enums';

export class CreateAuthDto {
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

  @IsNotEmpty({ message: 'otp is required' })
  @ApiProperty({
    example: '876543',
    description: 'OTP code send to email of the user',
  })
  otp: string;

  @IsNotEmpty({ message: 'password is required' })
  @ApiProperty({
    example: 'thuanpass123',
    description: 'password for the user account',
  })
  password: string;

  @IsNotEmpty({ message: 'phone is required' })
  @ApiProperty({
    example: '0986056438',
    description: 'user phone number',
  })
  phone: string;


  @IsOptional()
  @ApiProperty({
    example: 'manager || if do not push already user',
    description: 'Role for the manager, if do not push already user ',
    enum: UserRoles,
    required: false,
  })
  role: UserRoles;

  @IsOptional()
  @ApiProperty({
    example: 'active',
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