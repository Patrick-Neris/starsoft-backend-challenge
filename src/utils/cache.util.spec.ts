import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';

import { CacheUtilsService } from './cache.util';

describe('CacheUtilsService', () => {
  let service: CacheUtilsService;
  let redis: jest.Mocked<Redis>;

  beforeEach(async () => {
    redis = {
      keys: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheUtilsService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get(CacheUtilsService);
  });

  it('deve não fazer nada se não houver chaves de sessão no cache', async () => {
    redis.keys.mockResolvedValue([]);

    await service.invalidateSessaoCache();

    expect(redis.keys).toHaveBeenCalledWith('sessao:*');
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('deve remover todas as chaves de sessão do cache quando existirem', async () => {
    const keys = ['sessao:1', 'sessao:filme=Tenet'];

    redis.keys.mockResolvedValue(keys);
    redis.del.mockResolvedValue(keys.length);

    await service.invalidateSessaoCache();

    expect(redis.keys).toHaveBeenCalledWith('sessao:*');
    expect(redis.del).toHaveBeenCalledWith(...keys);
  });
});
