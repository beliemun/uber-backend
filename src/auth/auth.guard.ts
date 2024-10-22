import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRoles } from './role.decorator';
import { UsersService } from 'src/users/users.service';
import { JwtService } from 'src/jwt/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflecter: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}
  // true를 return하면 request를 진행시키고, false면 중단 시킴.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // key를 'roles' 이라고 정의한 Metadata를 가져온다.
    const roles = this.reflecter.get<UserRoles>('roles', context.getHandler());
    // Role을 위한 Decorator가 없을 경우 Pulbic End point 라고 간주하고 통과시킨다.
    if (roles === undefined) {
      return true;
    }
    // context를 로그해보면 context가 http 형태로로 되어있기 때문에 graphql로 변경해야 함. (context의 user, token에 접근할 수 없는 형태.)
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext['access-token'];
    try {
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        const { user } = await this.usersService.findById(decoded['id']);
        // Role Decorator가 있는데 User 정보가 없을 경우
        if (!user) {
          return false;
        }
        gqlContext['user'] = user;
        console.log(user);
        // Role이 Any인 경우, 모든 유저에 대해 인가가 허락된다.
        if (roles.includes('Any')) {
          return true;
        }
        // // Decorator에 명시한 Role과 user의 role을 비교하여 인가를 허락하거나 거부한다.
        return roles.includes(user.role);
      }
    } catch (e) {}

    return true;
  }
}
