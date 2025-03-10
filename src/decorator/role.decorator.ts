import { SetMetadata } from '@nestjs/common';
import { UserRoles } from 'src/constant/users.enums';

export const Roles = (...roles: UserRoles[]) => SetMetadata('roles', roles);