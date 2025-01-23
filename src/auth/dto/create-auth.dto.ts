import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { UserRole } from '../../schemas/user.schema';

export class CreateAuthDto {
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsNotEmpty({ message: 'Phone is required' })
  phone: string;

  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRole, { message: 'Role must be user' })
  role: UserRole.USER;

  @IsNotEmpty({ message: 'Status is required' })
  status: string;
}