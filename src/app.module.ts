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
import { User } from './users/entities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { Verification } from './users/entities/verification.entity';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { Category } from './restaurants/entities/category.entity';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod', // 서버에 deploy 할 때 환경 변수 파일을 사용하지 않음.
      validationSchema: Joi.object({
        // 환경 변수가 제공되지 않을 경우 앱을 실행시키지 않기 위해 Joi로 validation 사전 진행.
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
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
      context: ({ req }) => ({ user: req['user'] }), // jwt.middleware에서 token에 의해 찾아낸 user는 graphql context에 의해 모든 resolver에 공유.
    }),
    TypeOrmModule.forRoot({
      // cross-env로 개발 환경에 따라 사용할 환경 변수를 설정.
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PAWSSWORD,
      database: process.env.DB_NAME,
      synchronize: process.env.NODE_ENV !== 'prod', // 프로덕션에서는 실제 데이터를 가지고 있기 때문에 자동 마이그레이션이 되면 안 됨.
      logging: false,
      entities: [User, Verification, Restaurant, Category],
    }),
    JwtModule.forRoot({
      tokenSecretKey: process.env.TOKEN_SECRET_KEY,
    }),
    UsersModule,
    RestaurantsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  // NestModule: middleware를 route에 적용하는 방법을 정의해주는 interface. NestModule은 interface로서 configure을 구현해야 함.
  configure(consumer: MiddlewareConsumer) {
    // 이 Middleware를 정확히 어떤 routes에 적용하고 싶은지 지정할 수 있다.  /graphl 경로 내 모든 요청에 대해서 jwtMiddleware를 거친도록 설정.
    consumer
      .apply(JwtMiddleware)
      .forRoutes({ path: '/graphql', method: RequestMethod.ALL });
  }
}
