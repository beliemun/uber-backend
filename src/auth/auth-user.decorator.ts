import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // createParamDecorator는 Factory Function이 필요한데, Factory Function 에는 항상 unkwoun data와 context가 존재한다.
    const gqlContext = GqlExecutionContext.create(ctx).getContext();
    const user = gqlContext['user'];
    console.log(2, user);
    return user;
  },
);
