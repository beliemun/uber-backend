import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

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
      synchronize: true,
      logging: true,
    }),
    RestaurantsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
