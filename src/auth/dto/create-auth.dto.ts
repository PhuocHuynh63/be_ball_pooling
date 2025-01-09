import { IsNotEmpty } from "class-validator";

export class CreateAuthDto {
    @IsNotEmpty({ message: 'Fullname is required' })
    fullname: string;

    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}

export class CodeAuthDto {
    @IsNotEmpty({ message: '_id is required' })
    _id: string;

    @IsNotEmpty({ message: 'Code is required' })
    code: string;
}

export class UpdateAuthDto {
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}