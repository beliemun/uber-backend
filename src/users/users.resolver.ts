import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dto/create-account.dto';
import { SignInInput, SignInOutput } from 'src/users/dto/sign-in.dto';
import { AuthUser } from 'src/auth/auth-user.decorator';
import {
  GetUserProfileInput,
  GetUserProfileOutput,
} from './dto/get-user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dto/edit-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dto/verify-email.dto';
import { Role } from 'src/auth/role.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Role(['Any'])
  @Query(() => User) // AuthGuard(auth.guard)를 만들어 UseGuards와 함께 사용하는 authentication.
  me(@AuthUser() authUser: User) {
    console.log(authUser);
    // 직접 Decorator를 생성(auth-user.decorator.ts)하여 사용하는 authentication.
    return authUser;
  }

  @Mutation(() => SignInOutput)
  signIn(@Args('input') signInInputType: SignInInput): Promise<SignInOutput> {
    return this.usersService.signIn(signInInputType);
  }

  @Mutation(() => CreateAccountOutput)
  createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return this.usersService.createAccount(createAccountInput);
  }

  @Role(['Any'])
  @Query(() => GetUserProfileOutput)
  async userProfile(
    @Args('input') GetUserProfileInput: GetUserProfileInput,
  ): Promise<GetUserProfileOutput> {
    return this.usersService.getUserProfile(GetUserProfileInput);
  }

  @Role(['Any'])
  @Mutation(() => EditProfileOutput)
  editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    console.log(editProfileInput);
    return this.usersService.editProfile(authUser.id, editProfileInput);
  }

  @Mutation(() => VerifyEmailOutput)
  verifyEmail(
    @AuthUser() authUser: User,
    @Args('input') verifyEmailInput: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(authUser.id, verifyEmailInput);
  }
}
