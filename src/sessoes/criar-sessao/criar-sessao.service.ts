/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CacheUtilsService } from 'src/utils/cache.util';
import { CriarSessaoDto } from './criar-sessao.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Sessao } from 'src/entities/sessao.entity';
import { DataSource, Repository } from 'typeorm';
import { Assento } from 'src/entities/assento.entity';
import Redis from 'ioredis';

@Injectable()
export class CriarSessaoService {
  private readonly logger = new Logger(CriarSessaoService.name);

  constructor(
    private readonly dataSource: DataSource,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,

    @InjectRepository(Sessao)
    private readonly sessaoRepository: Repository<Sessao>,

    @InjectRepository(Assento)
    private readonly assentoRepository: Repository<Assento>,

    private readonly cacheUtils: CacheUtilsService,
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

      this.logger.log(`Sessão criada com sucesso. | sessao=${sessaoSalva.id}`);

      await this.cacheUtils.invalidateSessaoCache();

      return sessaoSalva;
    } catch (e) {
      await queryRunner.rollbackTransaction();

      if (e.code === '23505') {
        this.logger.warn(
          `Já existe sessão com o mesmo filme, horário, data e sala | filme=${dto.filme} | horario=${dto.horario} | data=${dto.data} | sala=${dto.sala}`,
        );
        throw new ConflictException(
          'Já existe uma sessão com o mesmo filme, data, horário e sala.',
        );
      }

      this.logger.error(
        `Erro ao criar sessão. | filme=${dto.filme} | horario=${dto.horario} | data=${dto.data} | sala=${dto.sala}`,
      );
      throw new InternalServerErrorException('Erro ao criar sessão');
    } finally {
      await queryRunner.release();
    }
  }
}
