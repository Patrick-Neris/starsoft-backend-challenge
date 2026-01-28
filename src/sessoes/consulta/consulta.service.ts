/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Sessao } from 'src/entities/sessao.entity';
import { ConsultaSessaoDto } from './consulta.dto';
import Redis from 'ioredis';

@Injectable()
export class ConsultaService {
  private readonly logger = new Logger(ConsultaService.name);

  constructor(
    @InjectRepository(Sessao)
    private readonly sessaoRepository: Repository<Sessao>,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async consultarSessoes(filtros: ConsultaSessaoDto) {
    const filtrosValidos = ['id', 'filme', 'data', 'horario'];

    const filtrosInformados = Object.entries(filtros).filter(
      ([chave, valor]) =>
        filtrosValidos.includes(chave) && valor !== undefined && valor !== '',
    );

    if (filtrosInformados.length === 0) {
      this.logger.warn(`Nenhum filtro válido informado.`);
      throw new BadRequestException(
        'Informe ao menos um filtro válido: id, filme, data ou horario',
      );
    }
    const cacheKey = this.gerarCacheKey(Object.fromEntries(filtrosInformados));

    const cache = await this.redis.get(cacheKey);
    if (cache) {
      return {
        data: JSON.parse(cache),
      };
    }

    const query = this.sessaoRepository
      .createQueryBuilder('s')
      .innerJoin('assentos', 'a', 'a.sessao_id = s.id')
      .select([
        's.id AS id',
        's.filme AS filme',
        's.data AS data',
        's.horario AS horario',
        's.sala AS sala',
        's.preco AS preco',
        'a.disponiveis AS assentosDisponiveis',
      ]);

    if (filtros.id) {
      query.andWhere('s.id = :id', { id: filtros.id });
    }

    if (filtros.filme) {
      query.andWhere('LOWER(s.filme) LIKE LOWER(:filme)', {
        filme: `%${filtros.filme}%`,
      });
    }

    if (filtros.data) {
      query.andWhere('s.data = :data', { data: filtros.data });
    }

    if (filtros.horario) {
      query.andWhere('s.horario = :horario', { horario: filtros.horario });
    }

    const resultado = await query.getRawMany();

    for (const sessao of resultado) {
      const reservasKey = `reservas:sessao:${sessao.id}`;
      const reservasRaw = await this.redis.get(reservasKey);

      if (!reservasRaw) {
        continue;
      }

      const reservas: {
        reservaId: string;
        assentos: number[];
      }[] = JSON.parse(reservasRaw);

      const assentosReservados = reservas.flatMap((r) => r.assentos);

      sessao.assentosdisponiveis = sessao.assentosdisponiveis.filter(
        (a: number) => !assentosReservados.includes(a),
      );
    }

    await this.redis.set(cacheKey, JSON.stringify(resultado), 'EX', 60);

    this.logger.log(
      `Consulta feita com sucesso. | filtros=${filtrosInformados.join(', ')}`,
    );

    return {
      data: resultado,
    };
  }

  private gerarCacheKey(filtros: ConsultaSessaoDto): string {
    return `sessao:${Object.entries(filtros)
      .filter(([_, v]) => v !== undefined && v !== '')
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join('|')}`;
  }
}
