import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheUtilsService {
  private readonly logger = new Logger(CacheUtilsService.name);

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
    this.logger.log(`Cache de sessões invalidado. | chaves=${keys.join(', ')}`);
  }
}
