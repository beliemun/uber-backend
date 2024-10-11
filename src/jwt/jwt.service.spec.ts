import { Test } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'test-token'),
    verify: jest.fn(() => ({
      id: 1,
    })),
  };
});

describe('JwtService', () => {
  let jwtService: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        // JwtService 내 Dependency가 있는 provider를 정의한다.
        { provide: 'CONFIG_OPTION', useValue: { tokenSecretKey: 'test-key' } },
      ],
    }).compile();
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be define', () => {
    expect(jwtService).toBeDefined();
  });

  it('sign()', () => {
    const id = 1;
    const token = jwtService.sign({ id });
    expect(typeof token).toEqual('string');
    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(jwt.sign).toHaveBeenCalledWith({ id }, 'test-key');
  });

  it('verify()', () => {
    const token = 'test-token';
    const verify = jwtService.verify(token);
    expect(verify).toEqual({ id: 1 });
    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(jwt.verify).toHaveBeenCalledWith(token, 'test-key');
  });
});
