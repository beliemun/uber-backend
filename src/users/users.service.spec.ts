import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';

const mokeRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const mokeJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe('Users Service', () => {
  let service: UsersService;

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
          useValue:mokeJwtService,
        }
      ],
    }).compile();
    service = modules.get<UsersService>(UsersService);
  });

  it('be defined', () => {
    expect(service).toBeDefined();
  });
  it.todo('createAccount()');
  it.todo('signIn()');
  it.todo('findById()');
  it.todo('getUserProfile()');
  it.todo('editProfile()');
  it.todo('verifyEmail()');
});
