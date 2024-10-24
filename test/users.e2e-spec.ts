import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

const GRAPHQL_ENDPOINT = '/graphql';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let token: String;
  let verificationRepository: Repository<Verification>;
  let code: String;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    verificationRepository = moduleFixture.get<Repository<Verification>>(
      getRepositoryToken(Verification),
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

      const verification = await verificationRepository.findOne({
        where: { user: { id: userId } },
      });
      code = verification.code;
    });

    it('should find an user.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('access-token', token.toString())
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
        .set('access-token', token.toString())
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
    let userId: number;

    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it('should find my profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('access-token', token.toString())
        .send({
          query: `
          {
            me{
              id
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { id },
              },
            },
          } = res;
          expect(id).toEqual(userId);
        });
    });

    it('should not find my profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('accessToekn', token.toString())
        .send({
          query: `
          {
            me{
              id
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            errors: [{ message }],
            data,
          } = res.body;
          expect(message).toBe('Forbidden resource');
          expect(data).toBe(null);
        });
    });
  });

  describe('verifyEmail', () => {
    it('should change verified status to true.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('access-token', token.toString())
        .send({
          query: `
          mutation {
            verifyEmail(
              input: {
                code: "${code}"
              }
            ) {
              ok
              error
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            data: {
              verifyEmail: { ok, error },
            },
          } = res.body;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should not change verified status with a wrong code.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('access-token', token.toString())
        .send({
          query: `
          mutation {
            verifyEmail(
              input: {
                code: "wrong-code"
              }
            ) {
              ok
              error
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            data: {
              verifyEmail: { ok, error },
            },
          } = res.body;
          expect(ok).toBe(false);
          expect(error).toBe('Not found verification.');
        });
    });

    it('should not change verified status with a wrong credential.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            verifyEmail(
              input: {
                 code: "${code}"
              }
            ) {
              ok
              error
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            errors: [{ message }],
          } = res.body;
          expect(message).toBe(
            "Cannot read properties of undefined (reading 'id')",
          );
        });
    });
  });

  describe('editProfile', () => {
    it('should fail if the email exist.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('access-token', token.toString())
        .send({
          query: `
          mutation{
            editProfile(input:{
              email:"test@test.com"
            }) {
              ok
              error
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            data: {
              editProfile: { ok, error },
            },
          } = res.body;
          expect(ok).toBe(false);
          expect(error).toBe('The email is already exist.');
        });
    });

    it('should edit email in my profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('access-token', token.toString())
        .send({
          query: `
          mutation{
            editProfile(input:{
              email:"test1@test.com"
            }) {
              ok
              error
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            data: {
              editProfile: { ok, error },
            },
          } = res.body;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
  });
});
