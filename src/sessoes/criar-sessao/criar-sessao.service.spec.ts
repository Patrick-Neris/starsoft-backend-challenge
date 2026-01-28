import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import Redis from 'ioredis';

import { CriarSessaoService } from './criar-sessao.service';
import { Sessao } from 'src/entities/sessao.entity';
import { Assento } from 'src/entities/assento.entity';
import { CriarSessaoDto } from './criar-sessao.dto';
import { CacheUtilsService } from 'src/utils/cache.util';

describe('CriarSessaoService', () => {
  let service: CriarSessaoService;

  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;
  let redis: jest.Mocked<Redis>;
  let sessaoRepository: jest.Mocked<Repository<Sessao>>;
  let assentoRepository: jest.Mocked<Repository<Assento>>;
  let cacheUtils: jest.Mocked<CacheUtilsService>;

  const dto: CriarSessaoDto = {
    filme: 'Tenet',
    data: '2026-02-01',
    horario: '20:00',
    sala: 1,
    preco: 10,
    assentos: 3,
  };

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        create: jest.fn(),
      },
    } as unknown as jest.Mocked<QueryRunner>;

    dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as jest.Mocked<DataSource>;

    redis = {
      keys: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    sessaoRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<Repository<Sessao>>;

    assentoRepository = {} as jest.Mocked<Repository<Assento>>;

    cacheUtils = {
      invalidateSessaoCache: jest.fn(),
    } as unknown as jest.Mocked<CacheUtilsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CriarSessaoService,
        { provide: DataSource, useValue: dataSource },
        { provide: 'REDIS_CLIENT', useValue: redis },
        { provide: CacheUtilsService, useValue: cacheUtils },
        {
          provide: getRepositoryToken(Sessao),
          useValue: sessaoRepository,
        },
        {
          provide: getRepositoryToken(Assento),
          useValue: assentoRepository,
        },
      ],
    }).compile();

    service = module.get(CriarSessaoService);
  });

  it('deve criar a sessão, assentos, commitar transação e invalidar cache', async () => {
    const sessaoCriada = { id: 1 } as Sessao;

    sessaoRepository.create.mockReturnValue({} as Sessao);

    queryRunner.manager.save
      .mockResolvedValueOnce(sessaoCriada) // salva Sessao
      .mockResolvedValueOnce({}); // salva Assentos

    queryRunner.manager.create.mockReturnValue({});

    const result = await service.criarSessao(dto);

    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();

    expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();

    expect(cacheUtils.invalidateSessaoCache).toHaveBeenCalled();

    expect(queryRunner.release).toHaveBeenCalled();
    expect(result).toEqual(sessaoCriada);
  });

  it('deve lançar ConflictException quando erro for 23505', async () => {
    const error = { code: '23505' };

    sessaoRepository.create.mockReturnValue({} as Sessao);
    queryRunner.manager.save.mockRejectedValueOnce(error);

    await expect(service.criarSessao(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('deve lançar InternalServerErrorException para erro genérico', async () => {
    sessaoRepository.create.mockReturnValue({} as Sessao);
    queryRunner.manager.save.mockRejectedValueOnce(
      new Error('erro inesperado'),
    );

    await expect(service.criarSessao(dto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});
