import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Venda } from 'src/entities/venda.entity';
import { Repository } from 'typeorm';
import { ConsultaHistoricoDto } from './historico.dto';

@Injectable()
export class HistoricoService {
  constructor(
    @InjectRepository(Venda)
    private readonly vendaRepository: Repository<Venda>,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async consultarHistorico(filtros: ConsultaHistoricoDto) {
    const filtrosValidos = ['sessaoId', 'usuario'];

    const filtrosInformados = Object.entries(filtros).filter(
      ([chave, valor]) =>
        filtrosValidos.includes(chave) && valor !== undefined && valor !== '',
    );

    if (filtrosInformados.length === 0) {
      throw new BadRequestException(
        'Erro ao tentar consultar histórico de vendas, informe ao menos um filtro válido: id, usuario.',
      );
    }

    const cacheKey = this.gerarCacheKey(Object.fromEntries(filtrosInformados));

    const cache = await this.redis.get(cacheKey);
    if (cache) {
      console.log('Cache, key: ', cacheKey);
      return {
        data: JSON.parse(cache),
      };
    }

    console.log('Banco, key: ', cacheKey);
    const query = this.vendaRepository
      .createQueryBuilder('v')
      .select(['v.id', 'v.usuario', 'v.sessao_id', 'v.assentos']);

    if (filtros.sessaoId) {
      query.andWhere('v.sessao_id = :id', { id: filtros.sessaoId });
    }

    if (filtros.usuario) {
      query.andWhere('LOWER(v.usuario) LIKE LOWER(:usuario)', {
        usuario: `%${filtros.usuario}%`,
      });
    }

    const resultado = await query.getRawMany();

    await this.redis.set(cacheKey, JSON.stringify(resultado), 'EX', 60);

    return {
      data: resultado,
    };
  }

  private gerarCacheKey(filtros: ConsultaHistoricoDto): string {
    return `venda:${Object.entries(filtros)
      .filter(([_, v]) => v !== undefined && v !== '')
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join('|')}`;
  }
}
