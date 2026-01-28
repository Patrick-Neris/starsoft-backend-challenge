import {
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from 'amqplib';
import Redis from 'ioredis';
import { Assento } from 'src/entities/assento.entity';
import { Venda } from 'src/entities/venda.entity';
import { CacheUtilsService } from 'src/utils/cache.util';
import { DataSource, Repository } from 'typeorm';
import { PagamentoDto } from './pagamentos.dto';

export class PagamentoService {
  private readonly logger = new Logger(PagamentoService.name);

  constructor(
    @InjectRepository(Venda)
    private readonly vendaRepository: Repository<Venda>,

    @InjectRepository(Assento)
    private readonly assentoRepository: Repository<Assento>,

    private readonly dataSource: DataSource,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,

    @Inject('RABBITMQ_CHANNEL')
    private readonly channel: Channel,

    private readonly cacheUtils: CacheUtilsService,
  ) {}

  async confirmarPagamento(dto: PagamentoDto) {
    const reservasKey = `reserva:${dto.reservaId}`;
    const reservaRaw = await this.redis.get(reservasKey);

    if (!reservaRaw) {
      this.logger.warn(
        `Reserva expirada ou inexistente | reserva=${dto.reservaId}`,
      );
      throw new ConflictException('Reserva expirada ou inexistene');
    }

    const reserva: {
      reservaId: string;
      sessaoId: number;
      assentos: number[];
      usuario: string;
    } = JSON.parse(reservaRaw);

    await this.dataSource.transaction(async (manager) => {
      const assento = await manager.findOne(Assento, {
        where: { sessao_id: reserva.sessaoId },
      });

      if (!assento) {
        this.logger.error(
          `Assentos não encontrados | reserva=${dto.reservaId}`,
        );
        throw new NotFoundException('Assentos não encontrados');
      }

      const indisponiveis = reserva.assentos.filter(
        (a) => !assento.disponiveis.includes(a),
      );

      if (indisponiveis.length > 0) {
        this.logger.error(`Assentos indisponíveis | reserva=${dto.reservaId}`);
        throw new ConflictException(
          `Assentos indisponíveis: ${indisponiveis.join(', ')}`,
        );
      }

      assento.disponiveis = assento.disponiveis.filter(
        (a) => !reserva.assentos.includes(a),
      );

      assento.indisponiveis.push(...reserva.assentos);

      await manager.save(assento);

      const venda = manager.create(Venda, {
        id: reserva.reservaId,
        usuario: reserva.usuario,
        sessaoId: reserva.sessaoId,
        assentos: reserva.assentos,
      });

      await manager.save(venda);
    });

    await this.cacheUtils.invalidateSessaoCache();

    this.channel.publish(
      'vendas.exchange',
      '',
      Buffer.from(
        JSON.stringify({
          type: 'VENDA_CONFIRMADA',
          reservaId: dto.reservaId,
          sessaoId: reserva.sessaoId,
          assentos: reserva.assentos,
          usuario: reserva.usuario,
        }),
      ),
    );

    this.logger.log(`Reserva convertida em venda | reserva=${dto.reservaId}`);

    return {
      status: 'VENDA_CONFIRMADA',
      reservaId: dto.reservaId,
    };
  }
}
