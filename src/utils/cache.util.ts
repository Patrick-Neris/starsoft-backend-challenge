import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheUtilsService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async invalidateSessaoCache(): Promise<void> {
    const keys = await this.redis.keys('sessao:*');

    if (keys.length === 0) {
      return;
    }

    await this.redis.del(...keys);
    console.log('Cache de sessões invalidado:', keys);
  }
}
