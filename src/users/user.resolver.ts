import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './user.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dto/create-account.dto';
import { SignInInputType, SignInOutputType } from 'src/users/dto/sign-in.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { UseGuards } from '@nestjs/common';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { UserProfileInput, UserProfileOutput } from './dto/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dto/edit-profile.dto';

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
  @Query(() => UserProfileOutput)
  async userProfile(
    @Args('input') { userId }: UserProfileInput,
  ): Promise<UserProfileOutput> {
    const user = await this.usersService.findById(userId);
    return {
      ok: user ? true : false,
      user,
      ...(!user && { error: 'User not found' }),
    };
  }

  @UseGuards(AuthGuard)
  @Mutation(() => EditProfileOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      await this.usersService.editProfile(authUser, editProfileInput);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }
}
