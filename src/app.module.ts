import { Module } from '@nestjs/common';
import { VendasModule } from './vendas/vendas.module';
import { SessoesModule } from './sessoes/sessoes.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisProvider } from './redis/redis.provider';
import { RedisModule } from './redis/redis.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    RabbitMQModule,
    RedisModule,
    VendasModule,
    SessoesModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
    }),
  ],
  controllers: [],
  providers: [RedisProvider],
})
export class AppModule {}
