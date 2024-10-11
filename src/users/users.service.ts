import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dto/create-account.dto';
import { SignInInput, SignInOutput } from 'src/users/dto/sign-in.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dto/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailInput, VerifyEmailOutput } from './dto/verify-email.dto';
import {
  GetUserProfileInput,
  GetUserProfileOutput,
} from './dto/get-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    // Repository를 만들기 위해서는 해당 Module에서 TypeOrmModule.forFeature([]) 안에 Entity를 넣어야 한다.
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    // private readonly config: ConfigService, // 글로벌 모듈이기 때문에 app.modlue.ts 에서 imports 할 필요가 없음.
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    name,
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({ where: { email } });
      if (exists) {
        throw new Error('There is a user with that email already.');
      }
      const user = await this.users.save(
        this.users.create({ name, email, password, role }),
      );
      await this.verifications.save(this.verifications.create({ user }));
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

  async signIn({ email, password }: SignInInput): Promise<SignInOutput> {
    try {
      const user = await this.users.findOne({
        where: { email },
        select: ['id', 'password'],
      });
      if (!user) {
        throw new Error('Not found user.');
      }
      const isCorrect = await user.checkPassword(password);
      if (!isCorrect) {
        throw new Error('Password is not correct.');
      }
      // 1. process.env.TOKEN_SECRET_KEY를 사용하지 않고 Config에서 가져 올 수 있다.
      //   const token = jwt.sign(
      //     { id: user.id },
      //     this.config.get('TOKEN_SECRET_KEY'),
      //   );
      // 2. Jwt Dynamic Module을 직접만들어 가져올 수 있다. Config보다 불편하지만 다른 프로젝트에서 그대로 사용할 수 있다.
      const token = this.jwtService.sign({ id: user.id });
      return {
        ok: true,
        token,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async findById(id: number) {
    try {
      const user = await this.users.findOneOrFail({ where: { id } });
      if (!user) {
        throw new Error('User not found.');
      }
      return {
        ok: true,
        user,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async getUserProfile({
    userId,
  }: GetUserProfileInput): Promise<GetUserProfileOutput> {
    try {
      const { user } = await this.findById(userId);
      if (!user) {
        throw new Error('User not found.');
      }
      return {
        ok: true,
        user: user,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async editProfile(
    id: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    // update는 Entity를 직접 update 하지 않고, DB에 query만 보내기 때문에 @BeforeUpdate()을 작동시키지 않는다.
    // return this.users.update(id, { email, password });

    // 따라서 save를 통해 직접 Entity를 update해주는 코드로 변경.
    const user = await this.users.findOne({ where: { id } });
    if (email) {
      user.email = email;
      user.verified = false;
      await this.verifications.save(this.verifications.create({ user }));
    }
    if (password) {
      user.password = password;
    }
    await this.users.save(user);
    return {
      ok: true,
    };
  }

  async verifyEmail(
    id: number,
    { code }: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    try {
      const verifiation = await this.verifications.findOne({
        where: { code },
        relations: ['user'],
      });
      if (id !== verifiation.user.id) {
        throw new Error('Not have permission.');
      }
      if (verifiation) {
        verifiation.user.verified = true;
        await this.users.save(verifiation.user);
        await this.verifications.delete(verifiation.id);
      }
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
