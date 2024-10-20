import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

export type UserRoles = keyof typeof UserRole | 'Any';

export const Role = (roles: UserRoles[]) => SetMetadata('roles', roles);
