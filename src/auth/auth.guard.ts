import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { UserRoles } from './role.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflecter: Reflector) {}
  // true를 return하면 request를 진행시키고, false면 중단 시킴.
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflecter.get<UserRoles>('roles', context.getHandler());
    if (roles === undefined) {
      return true;
    }
    // context를 로그해보면 context가 http 형태로로 되어있기 때문에 graphql로 변경해야 함. (context의 user, token에 접근할 수 없는 형태.)
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user: User = gqlContext['user'];
    if (!user) {
      return false;
    }
    if (roles === 'Any') {
      return true;
    }
    return roles.includes(user.role);
  }
}
