import { Inject, Injectable } from '@nestjs/common';
import { JwtModuleOptions } from './jwt.interface';
import { CONFIG_OPTION } from '../common/common.constants';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTION) private readonly options: JwtModuleOptions,
  ) {}

  sign(payload: object, expiresIn?: string | number): string {
    return jwt.sign(payload, this.options.tokenSecretKey, { expiresIn });
  }

  verify(token: string) {
    return jwt.verify(token, this.options.tokenSecretKey);
  }
}
