import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { query } from 'express';
import { sign } from 'crypto';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

const GRAPHQL_ENDPOINT = '/graphql';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let token: String;
  let usersRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();
  });

  afterAll(async () => {
    const dataSource: DataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PAWSSWORD,
      database: process.env.DB_NAME,
    });
    const connection: DataSource = await dataSource.initialize();
    await connection.dropDatabase();
    await connection.destroy();
    app.close();
  });

  const TEST_USER = {
    EMAIL: 'test@test.com',
    PASSWORD: '1234',
  };

  describe('createAccount', () => {
    it('should create a new account.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input:{
              name:"test"
              email:"${TEST_USER.EMAIL}",
              password:"${TEST_USER.PASSWORD}",
              role:Owner
            }){
              ok
              error
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBe(true);
          expect(createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exist.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input:{
              name:"test"
              email:"${TEST_USER.EMAIL}",
              password:"${TEST_USER.PASSWORD}",
              role:Owner
            }){
              ok
              error
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBe(false);
          expect(createAccount.error).toEqual(
            'There is a user with that email already.',
          );
        });
    });
  });

  describe('signIn', () => {
    it('should sign in with correct credentials.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation{
            signIn(input:{
              email:"${TEST_USER.EMAIL}",
              password:"${TEST_USER.PASSWORD}",
            }) {
              ok
              error
              token
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { signIn },
            },
          } = res;
          expect(signIn.ok).toBe(true);
          expect(signIn.error).toBe(null);
          expect(signIn.token).toEqual(expect.any(String));
          token = signIn.token;
        });
    });

    it('should fail with wrong email.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
        mutation{
          signIn(input:{
              email:"wrong-email@test.com",
              password:"${TEST_USER.PASSWORD}",
          }) {
            ok
            error
            token
          }
        }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { signIn },
            },
          } = res;
          expect(signIn.ok).toBe(false);
          expect(signIn.error).toBe('Not found user.');
          expect(signIn.token).toBe(null);
        });
    });

    it('should fail with wrong password.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation{
            signIn(input:{
                email:"${TEST_USER.EMAIL}",
                password:"wrong-password",
            }) {
              ok
              error
              token
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { signIn },
            },
          } = res;
          expect(signIn.ok).toBe(false);
          expect(signIn.error).toBe('Password is not correct.');
          expect(signIn.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;

    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it('should find an user.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('accessToken', token.toString())
        .send({
          query: `
            {
              userProfile(input:{userId:${userId}}){
                ok
                error
                user {
                  id
                }
              }
            }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it('should not find any user.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('accessToken', token.toString())
        .send({
          query: `
          {
            userProfile(input:{userId:${11}}){
              ok
              error
              user {
                id
              }
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('User not found.');
          expect(user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it.todo('');
  });

  it.todo('edtiProfile');
  it.todo('verifyEmail');
});
