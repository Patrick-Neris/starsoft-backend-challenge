/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CriarSessaoDto } from './criar-sessao.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Sessao } from '../../entities/sessao.entity';
import { DataSource, Repository } from 'typeorm';
import { Assento } from '../../entities/assento.entity';
import Redis from 'ioredis';

@Injectable()
export class CriarSessaoService {
  constructor(
    private readonly dataSource: DataSource,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,

    @InjectRepository(Sessao)
    private readonly sessaoRepository: Repository<Sessao>,

    @InjectRepository(Assento)
    private readonly assentoRepository: Repository<Assento>,
  ) {}

  async criarSessao(dto: CriarSessaoDto): Promise<Sessao> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sessao = this.sessaoRepository.create({
        filme: dto.filme,
        data: dto.data,
        horario: dto.horario,
        sala: dto.sala,
        preco: dto.preco,
        assentos: dto.assentos,
      });

      const sessaoSalva = await queryRunner.manager.save(sessao);

      const listaAssentos = Array.from(
        { length: dto.assentos },
        (_, i) => i + 1,
      );

      const assentos = queryRunner.manager.create(Assento, {
        sessao_id: sessaoSalva.id,
        disponiveis: listaAssentos,
        indisponiveis: [],
      });

      await queryRunner.manager.save(assentos);

      await queryRunner.commitTransaction();

      await this.invalidateSessaoCache();

      return sessaoSalva;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (e.code === '23505') {
        throw new ConflictException(
          'Já existe uma sessão com o mesmo filme, data, horário e sala.',
        );
      }

      throw new InternalServerErrorException('Erro ao criar sessão');
    } finally {
      await queryRunner.release();
    }
  }

  private async invalidateSessaoCache(): Promise<void> {
    const keys = await this.redis.keys('sessao:*');

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
