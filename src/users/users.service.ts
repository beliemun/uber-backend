import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dto/create-account.dto';
import { SignInInputType, SignInOutputType } from 'src/users/dto/sign-in.dto';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dto/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { error } from 'console';
import { VerifyEmailInput } from './dto/verify-email.dto';
import { GetUserProfileInput } from './dto/get-user-profile.dto';

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
        return {
          ok: false,
          error: 'There is a user with that email already.',
        };
      }
      const user = await this.users.save(
        this.users.create({ name, email, password, role }),
      );
      const verifications = await this.verifications.save(
        this.verifications.create({ user }),
      );
      console.log(verifications);
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

  async signIn({
    email,
    password,
  }: SignInInputType): Promise<SignInOutputType> {
    try {
      const user = await this.users.findOne({
        where: { email },
        select: ['id', 'password'],
      });
      if (!user) {
        return {
          ok: false,
          error: 'Not found user.',
        };
      }
      const isCorrect = await user.checkPassword(password);
      if (!isCorrect) {
        return {
          ok: false,
          error: 'Password is not correct.',
        };
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
    return this.users.findOne({ where: { id } });
  }

  async getUserProfile({ userId }: GetUserProfileInput) {
    try {
      const user = await this.findById(userId);
      return {
        ok: user ? true : false,
        user,
        ...(!user && { error: 'User not found' }),
      };
    } catch (e) {
      return {
        ok: false,
        error: e.meesage,
      };
    }
  }

  async editProfile({ id }: User, { email, password }: EditProfileInput) {
    try {
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
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async verifyEmail({ id }: User, { code }: VerifyEmailInput) {
    try {
      const verifiation = await this.verifications.findOne({
        where: { code },
        relations: ['user'],
      });
      if (id !== verifiation.user.id) {
        return {
          ok: false,
          error: 'Not have permission.',
        };
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
