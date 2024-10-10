import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dto/create-account.dto';
import { SignInInputType, SignInOutputType } from 'src/users/dto/sign-in.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { UseGuards } from '@nestjs/common';
import { AuthUser } from 'src/auth/auth-user.decorator';
import {
  GetUserProfileInput,
  GetUserProfileOutput,
} from './dto/get-user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dto/edit-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dto/verify-email.dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(AuthGuard) // AuthGuard(auth.guard)를 만들어 UseGuards와 함께 사용하는 authentication.
  me(@AuthUser() authUser: User) {
    // 직접 Decorator를 생성(auth-user.decorator.ts)하여 사용하는 authentication.
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

  @UseGuards(AuthGuard)
  @Query(() => GetUserProfileOutput)
  async userProfile(
    @Args('input') GetUserProfileInput: GetUserProfileInput,
  ): Promise<GetUserProfileOutput> {
    return this.usersService.getUserProfile(GetUserProfileInput);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => EditProfileOutput)
  editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser, editProfileInput);
  }

  @Mutation(() => VerifyEmailOutput)
  verifyEmail(
    @AuthUser() authUser: User,
    @Args('input') verifyEmailInput: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(authUser, verifyEmailInput);
  }
}
