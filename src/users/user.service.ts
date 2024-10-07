import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dto/create-account.dto';
import {
  SignInInputType,
  SignInOutputType,
} from 'src/restaurants/dto/sign-in.dto';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService, // 글로벌 모듈이기 때문에 app.modlue.ts 에서 imports 할 필요가 없음.
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    name,
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const user = await this.users.findOne({ where: { email } });
      if (user) {
        return {
          ok: false,
          error: 'There is a user with that email already.',
        };
      }
      await this.users.save(this.users.create({ name, email, password, role }));
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
      const user = await this.users.findOne({ where: { email } });
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
      const token = this.jwtService.sign({id:user.id})
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

  async findById(id:number) {
    return this.users.findOne({where:{id}})
  }
}
