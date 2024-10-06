import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dto/create-account.dto';
import {
  SignInInputType,
  SignInOutputType,
} from 'src/restaurants/dto/sign-in.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
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
      const isCorrect =await user.checkPassword(password)
      if (!isCorrect) {
        return {
          ok: false,
          error: 'Password is not correct.',
        };
      }
      const token = "fake token";
      return {
        ok:true,
        token
      }
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }
}
