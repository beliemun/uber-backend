import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from './jwt.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if ('accesstoken' in req.headers) {
      const token = req.headers['accesstoken'];
      try {
        const decoded = this.jwtService.verify(token.toString());
        if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
          const user = await this.usersService.findById(decoded['id']);
          // user라는 request property에 찾아낸 user를 담는다.
          // request에 담긴 user는 graphql context에 의해 모든 resolver에서 공유된다. (app.module.ts)
          req['user'] = user;
        }
      } catch (e) {}
    }
    next();
  }
}
