import { Global, Module } from '@nestjs/common';
import { RedisProvider, RedisSubscriberProvider } from './redis.provider';
import { RedisExpirationProvider } from './redis-expiration.provider';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';
import { UtilsModule } from 'src/utils/utils.module';

@Global()
@Module({
  imports: [RabbitMQModule, UtilsModule],
  providers: [RedisProvider, RedisExpirationProvider, RedisSubscriberProvider],
  exports: [RedisProvider],
})
export class RedisModule {}
