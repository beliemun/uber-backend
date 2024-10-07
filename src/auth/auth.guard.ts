import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  // true를 return하면 request를 진행시키고, false면 중단 시킴.
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // context를 로그해보면 context가 http 형태로로 되어있기 때문에 graphql로 변경해야 함. (context의 user, token에 접근할 수 없는 형태.)
    const gqlContext = GqlExecutionContext.create(context).getContext();
    return gqlContext['user'] ? true : false;
  }
}
