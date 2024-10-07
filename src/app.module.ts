import { ApolloDriver } from '@nestjs/apollo';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { User } from './users/entities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import { jwtMiddleware } from './jwt/jwt.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.dev.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod', // 서버에 deploy 할 때 환경 변수 파일을 사용하지 않음.
      validationSchema: Joi.object({
        // 환경 변수가 제공되지 않을 경우 앱을 실행시키지 않기 위해 Joi로 validation 사전 진행.
        NODE_ENV: Joi.string().valid('dev', 'prod').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PAWSSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        TOKEN_SECRET_KEY: Joi.string().required(),
      }),
    }),
    GraphQLModule.forRoot({
      driver: ApolloDriver, // driver를 Apollo 생성자를 통해 Nest 방식으로 사용.
      autoSchemaFile: true, // 일일이 Graphql 파일을 만들지 안도록 스키마 생성을 자동화. 메모리상에서 생성.
    }),
    TypeOrmModule.forRoot({
      // cross-env로 개발 환경에 따라 사용할 환경 변수를 설정.
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PAWSSWORD,
      database: process.env.DB_NAME,
      synchronize: process.env.NODE_ENV !== 'prod', // 프로덕션에서는 실제 데이터를 가지고 있기 때문에 자동 마이그레이션이 되면 안됨.
      logging: false,
      entities: [User],
    }),
    CommonModule,
    UsersModule,
    JwtModule.forRoot({
      tokenSecretKey: process.env.TOKEN_SECRET_KEY,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule  {}

// 이하의 방법은 특정 path와 특정 method에 따라 middleware 설정을 하는 방법이며,
// 모든 경로에서 모든 요청에 대해 받을 경우 main.ts에서 app.use(jwtMiddleware) 적용으로 대체될 수 있는 코드이다.
// export class AppModule implements NestModule {
//   // NestModule: middleware를 route에 적용하는 방법을 정의해주는 interface
//   // NestModule은 interface로서 configure을 구현해야한다.
//   configure(consumer: MiddlewareConsumer) {
//     // 이 Middleware를 정확히 어떤 routes에 적용하고 싶은지 지정할 수 있다.
//     // /graphl 경로 내 모든 요청에 대해서 jwtMiddleware를 거친도록 설정
//     consumer.apply(jwtMiddleware).forRoutes({
//       path:"/graphql",
//       method:RequestMethod.ALL
//     })
//   }
// }
