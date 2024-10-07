import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
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

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  me() {
    console.log('me()');
  }

  @Mutation(() => CreateAccountOutput)
  createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return this.usersService.createAccount(createAccountInput);
  }

  @Mutation(() => SignInOutputType)
  signIn(
    @Args('input') signInInputType: SignInInputType,
  ): Promise<SignInOutputType> {
    return this.usersService.signIn(signInInputType);
  }
}
