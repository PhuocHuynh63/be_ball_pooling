import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRoles } from 'src/constant/users.enums';

export class CreateAuthDto {
  @IsNotEmpty({ message: 'Name is required' })
  @ApiProperty({
    example: 'Thuan',
    description: 'Name of the user',
  })
  name: string;

  avatar: string;

  @IsNotEmpty({ message: 'Email is required' })
  @ApiProperty({
    example: 'thuan@example.com',
    description: 'Email of the user',
  })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @ApiProperty({
    example: 'thuanpass123',
    description: 'Password for the user account',
  })
  password: string;

  @IsNotEmpty({ message: 'Phone is required' })
  @ApiProperty({
    example: '0986056438',
    description: 'User phone number',
  })
  phone: string;

  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRoles, { message: 'Role must be user' })
  @ApiProperty({
    example: 'user',
    description: 'Role for the user',
    enum: UserRoles,
  })
  role: UserRoles;

  @ApiProperty({
    example: 'active',
    description: 'Current status of the user account',
  })
  status: string;

  @IsEnum(['local', 'google'], { message: 'Auth provider must be either local or google' })
  @IsOptional()
  @ApiProperty({
    example: 'local',
    description: 'Authentication provider for the user',
    enum: ['local', 'google'],
    default: 'local',
  })
  authProvider?: 'local' | 'google';
}