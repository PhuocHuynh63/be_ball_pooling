import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super();
    }

    async validate(email: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(email, password);
        if (user === null) {
            throw new UnauthorizedException(`Email ${email} is not exits. Please try again`);
        }
        if (user === undefined) {
            throw new UnauthorizedException('Password is not correct');
        }
        if (user.isActive === false) {
            throw new BadRequestException('Your account is not active');
        }
        return user;
    }
}