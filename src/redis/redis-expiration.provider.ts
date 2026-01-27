import { Inject, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { Channel } from 'amqplib';
import { RedisExpirationListener } from './redis-expiration.listener';
import { CacheUtilsService } from 'src/utils/cache.util';

export class RedisExpirationProvider implements OnModuleInit {
  constructor(
    @Inject('REDIS_SUBSCRIBER')
    private readonly redisSubscriber: Redis,

    @Inject('RABBITMQ_CHANNEL')
    private readonly channel: Channel,

    private readonly cacheUtils: CacheUtilsService,
  ) {}

  async onModuleInit() {
    const listener = new RedisExpirationListener(
      this.redisSubscriber,
      this.channel,
      this.cacheUtils,
    );

    await listener.listen();
    console.log('Listener de expiração Redis ativo');
  }
}
