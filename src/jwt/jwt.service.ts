import { Inject, Injectable } from '@nestjs/common';
import { JwtModuleOptions } from './jwt.interface';
import { CONFIG_OPTION } from './jwt.constants';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTION) private readonly options: JwtModuleOptions,
  ) {}

  sign(payload: object): string {
    return jwt.sign(payload, this.options.tokenSecretKey);
  }

  verify(token: string) {
    return jwt.verify(token, this.options.tokenSecretKey);
  }
}
