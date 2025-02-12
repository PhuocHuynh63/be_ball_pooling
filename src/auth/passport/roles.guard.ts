import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserRole } from '../../modules/user/entities/User.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, run the JwtAuthGuard to ensure the user is authenticated
    const isAuthenticated = await this.jwtAuthGuard.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Debugging statements
    // console.log('RolesGuard: user object:', user);
    // if (user) {
    //   console.log('RolesGuard: user role:', user.role);
    // } else {
    //   console.log('RolesGuard: user is undefined');
    // }

    if (user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)) {
      return true;
    }

    throw new ForbiddenException('You do not have permission to perform this action');
  }
}