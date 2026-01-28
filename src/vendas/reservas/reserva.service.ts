import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Assento } from 'src/entities/assento.entity';
import { Repository } from 'typeorm';
import { ReservarDto } from './reservar.dto';
import { Channel } from 'amqplib';
import { randomUUID } from 'crypto';
import { CacheUtilsService } from 'src/utils/cache.util';

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name);

  constructor(
    @InjectRepository(Assento)
    private readonly assentoRepository: Repository<Assento>,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,

    @Inject('RABBITMQ_CHANNEL')
    private readonly channel: Channel,

    private readonly cacheUtils: CacheUtilsService,
  ) {}

  async reservar(dto: ReservarDto) {
    const lockKey = `lock:sessao:${dto.sessaoId}`;
    const lock = await this.redis.set(lockKey, 'locked', 'EX', 5, 'NX');

    if (!lock) {
      this.logger.warn(
        `Assentos reservados | sessão=${dto.sessaoId} | usuário=${dto.usuario} | assentos=${dto.assentos.join(', ')}`,
      );
      throw new ConflictException('Assentos Reservados.');
    }

    try {
      const assento = await this.assentoRepository.findOne({
        where: { sessao_id: dto.sessaoId },
      });

      if (!assento) {
        this.logger.warn(`Sessão não encontrada | sessao=${dto.sessaoId}`);
        throw new ConflictException('Sessão não encontrada.');
      }

      const reservasKey = `reservas:sessao:${dto.sessaoId}`;
      const reservasRaw = await this.redis.get(reservasKey);
      const reservasAtivas: {
        reservaId: string;
        assentos: number[];
      }[] = reservasRaw ? JSON.parse(reservasRaw) : [];

      const assentosReservados = reservasAtivas.flatMap((r) => r.assentos);

      const indisponiveis = dto.assentos.filter(
        (a) =>
          !assento.disponiveis.includes(a) || assentosReservados.includes(a),
      );

      if (indisponiveis.length > 0) {
        this.logger.warn(
          `Assentos indisponíveis | sessão=${dto.sessaoId} | usuário=${dto.usuario} | assentos=${dto.assentos.join(', ')}`,
        );
        throw new ConflictException(
          `Assentos indisponíveis: ${indisponiveis.join(', ')}`,
        );
      }

      const reservaId = randomUUID();
      const expiresAt = new Date(Date.now() + 30_000);

      const reserva = {
        reservaId,
        sessaoId: dto.sessaoId,
        assentos: dto.assentos,
        usuario: dto.usuario,
        expiresAt,
      };

      await this.redis.set(
        `reserva:${reservaId}`,
        JSON.stringify(reserva),
        'EX',
        30,
      );

      reservasAtivas.push(reserva);

      await this.redis.set(
        reservasKey,
        JSON.stringify(reservasAtivas),
        'EX',
        30,
      );

      this.channel.publish(
        'reservas.exchange',
        '',
        Buffer.from(
          JSON.stringify({
            type: 'RESERVA_CRIADA',
            ...reserva,
          }),
        ),
      );

      this.logger.log(`Reserva criada com sucesso | id=${reserva.reservaId}`);

      await this.cacheUtils.invalidateSessaoCache();

      return reserva;
    } finally {
      await this.redis.del(lockKey);
    }
  }
}
