import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { Repository } from 'typeorm';
import { Server } from 'http';

const mokeRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const mokeJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

type MokeRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('Users Service', () => {
  let usersService: UsersService;
  let usersRepository: MokeRepository<User>;

  beforeAll(async () => {
    const modules = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mokeRepository,
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mokeRepository,
        },
        {
          provide: JwtService,
          useValue: mokeJwtService,
        },
      ],
    }).compile();
    usersService = modules.get<UsersService>(UsersService);
    usersRepository = modules.get(getRepositoryToken(User));
  });

  it('be defined', async () => {
    expect(usersService).toBeDefined();
  });

  describe('createAccount()', () => {
    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'mock@test.com',
        name: 'tester',
      });
      const result = await usersService.createAccount({
        email: '',
        name: '',
        password: '',
        role: 0,
      });
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already.',
      });
    });
  });

  it.todo('signIn()');
  it.todo('findById()');
  it.todo('getUserProfile()');
  it.todo('editProfile()');
  it.todo('verifyEmail()');
});
