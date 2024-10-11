import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { Repository } from 'typeorm';

const mockUsersRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'signed-token'),
  verify: jest.fn(),
});

type MokeRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('Users Service', () => {
  let usersService: UsersService;
  let jwtService: JwtService;
  let usersRepository: MokeRepository<User>;
  let verificationRepository: MokeRepository<Verification>;

  beforeEach(async () => {
    const modules = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockUsersRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
      ],
    }).compile();
    usersService = modules.get<UsersService>(UsersService);
    jwtService = modules.get<JwtService>(JwtService);
    usersRepository = modules.get(getRepositoryToken(User));
    verificationRepository = modules.get(getRepositoryToken(Verification));
  });

  it('be defined', async () => {
    expect(usersService).toBeDefined();
  });

  describe('createAccount()', () => {
    const createAccountArgs = {
      email: 'test@test.com',
      name: 'tester',
      password: '1234',
      role: 0,
    };

    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue(createAccountArgs);
      const result = await usersService.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already.',
      });
    });

    it('should create a user', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      verificationRepository.create.mockReturnValue(createAccountArgs);

      const result = await usersService.createAccount(createAccountArgs);

      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);

      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith(
        createAccountArgs,
      );

      expect(result).toEqual({ ok: true });
    });
  });

  describe('signIn()', () => {
    const signInArgs = {
      email: 'test@test.com',
      password: '1234',
    };

    it('should fail if user does not exist.', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      const result = await usersService.signIn(signInArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: false, error: 'Not found user.' });
    });

    it('should fail if the password is wrong.', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await usersService.signIn(signInArgs);
      expect(result).toEqual({ ok: false, error: 'Password is not correct.' });
    });

    it('should return token if password correct.', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await usersService.signIn(signInArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({ id: expect.any(Number) });
      expect(result).toEqual({ ok: true, token: 'signed-token' });
    });
  });

  describe('findById()', () => {
    it('should find an existing user.', async () => {
      const findByIdArgs = {
        id: 1,
      };
      usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await usersService.findById(1);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    it('should fail if user not exist', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(undefined);
      const result = await usersService.findById(1);
      expect(result).toEqual({ ok: false, error: 'User not found.' });
    });
  });

  describe('getUserProfile()', () => {
    it('should find an exsiting user.', async () => {
      const getUserProfileArgs = {
        id: 1,
      };
      usersRepository.findOneOrFail.mockResolvedValue(getUserProfileArgs);
      const result = await usersService.getUserProfile({
        userId: getUserProfileArgs.id,
      });
      expect(result).toEqual({ ok: true, user: getUserProfileArgs });
    });

    it('should fail if user not exist', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(undefined);
      const result = await usersService.getUserProfile({ userId: 1 });
      expect(result).toEqual({ ok: false, error: 'User not found.' });
    });
  });

  describe('editProfile()', () => {
    it('should change email', async () => {
      const oldUser = {
        id: 1,
        email: 'test1@test.com',
        verified: true,
      };
      const newVerification = {
        code: 'code',
      };

      usersRepository.findOne.mockResolvedValue(oldUser);
      verificationRepository.create.mockReturnValue(newVerification);
      verificationRepository.save.mockResolvedValue(newVerification);
      const result = await usersService.editProfile(oldUser.id, {
        email: 'test2@test.com',
      });

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: oldUser.id },
      });

      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: oldUser,
      });

      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith(newVerification);

      expect(result).toEqual({ ok: true });
    });

    it('should change password', async () => {
      const oldUser = {
        id: 1,
        password: '1234',
      };
      usersRepository.findOne.mockResolvedValue(oldUser);
      const result = await usersService.editProfile(oldUser.id, {
        password: '5678',
      });
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({
        id: 1,
        password: '5678',
      });
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception.', async () => {
      usersRepository.findOne.mockRejectedValue(
        new Error('Can not update profile.'),
      );
      const result = await usersService.editProfile(1, {
        email: 'test@test.com',
      });
      expect(result).toEqual({ ok: false, error: 'Can not update profile.' });
    });
  });

  describe('verifyEmail()', () => {
    const verification = {
      id: 1,
      user: { id: 1, verified: false },
      code: 'code',
    };

    it('should fail on verification not found.', async () => {
      verificationRepository.findOne.mockResolvedValue(undefined);
      const result = await usersService.verifyEmail(1, { code: 'code' });
      expect(result).toEqual({ ok: false, error: 'Not found verification.' });
    });

    it('should fail on permission not have.', async () => {
      verificationRepository.findOne.mockResolvedValue(verification);
      const result = await usersService.verifyEmail(2, { code: 'code' });
      expect(result).toEqual({ ok: false, error: 'Not have permission.' });
    });

    it('should make a verification', async () => {
      verificationRepository.findOne.mockResolvedValue(verification);
      const result = await usersService.verifyEmail(verification.user.id, {
        code: 'code',
      });

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(verification.user);

      expect(verificationRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationRepository.delete).toHaveBeenCalledWith(
        verification.id,
      );
      expect(result).toEqual({ ok: true });
    });
  });
});
