import Redis from 'ioredis';
import { Channel } from 'amqplib';
import { CacheUtilsService } from 'src/utils/cache.util';

export class RedisExpirationListener {
  constructor(
    private readonly redis: Redis,
    private readonly channel: Channel,
    private readonly cacheUtils: CacheUtilsService,
  ) {}

  async listen() {
    await this.redis.psubscribe('__keyevent@0__:expired');

    this.redis.on('pmessage', (_, __, key) => {
      if (!key.startsWith('reserva:')) return;

      void (async () => {
        try {
          const reservaId = key.replace('reserva:', '');

          this.channel.publish(
            'reservas.exchange',
            '',
            Buffer.from(
              JSON.stringify({
                type: 'RESERVA_EXPIRADA',
                reservaId,
              }),
            ),
          );

          await this.cacheUtils.invalidateSessaoCache();

          console.log('Reserva expirada:', reservaId);
        } catch (err) {
          console.error('Erro ao processar expiração de reserva:', err);
        }
      })();
    });
  }
}
