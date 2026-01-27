import { Module } from '@nestjs/common';
import { RabbitMQProvider } from './rabbitmq.provider';

@Module({
  providers: [RabbitMQProvider],
  exports: [RabbitMQProvider],
})
export class RabbitMQModule {}
