import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './user.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dto/create-account.dto';
import {
  SignInInputType,
  SignInOutputType,
} from 'src/restaurants/dto/sign-in.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { UseGuards } from '@nestjs/common';
import { AuthUser } from 'src/auth/auth-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(AuthGuard) // AuthGuard(auth.guard)를 만들어 UseGuards와 함께 사용하는 authentication.
  me(@AuthUser() authUser: User) { // 직접 Decorator를 생성(auth-user.decorator.ts)하여 사용하는 authentication.
    return authUser;
  }

  @Mutation(() => SignInOutputType)
  signIn(
    @Args('input') signInInputType: SignInInputType,
  ): Promise<SignInOutputType> {
    return this.usersService.signIn(signInInputType);
  }

  @Mutation(() => CreateAccountOutput)
  createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return this.usersService.createAccount(createAccountInput);
  }
}
