import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';

import { ConsultaService } from './consulta.service';
import { Sessao } from 'src/entities/sessao.entity';
import { ConsultaSessaoDto } from './consulta.dto';

describe('ConsultaService', () => {
  let service: ConsultaService;
  let sessaoRepository: jest.Mocked<Repository<Sessao>>;
  let redis: jest.Mocked<Redis>;

  beforeEach(async () => {
    sessaoRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Sessao>>;

    redis = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultaService,
        {
          provide: getRepositoryToken(Sessao),
          useValue: sessaoRepository,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get(ConsultaService);
  });

  it('deve lançar erro se nenhum filtro válido for informado', async () => {
    const filtros = {} as ConsultaSessaoDto;

    await expect(service.consultarSessoes(filtros)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deve retornar dados do cache quando existir', async () => {
    const filtros: ConsultaSessaoDto = { filme: 'Tenet' };

    redis.get.mockResolvedValue(JSON.stringify([{ id: 1, filme: 'Tenet' }]));

    const result = await service.consultarSessoes(filtros);

    expect(redis.get).toHaveBeenCalled();
    expect(sessaoRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(result.data).toEqual([{ id: 1, filme: 'Tenet' }]);
  });

  it('deve buscar no banco e salvar no cache quando não houver cache', async () => {
    const filtros: ConsultaSessaoDto = { filme: 'Tenet' };

    redis.get.mockResolvedValue(null);

    const mockQueryBuilder: any = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          filme: 'Tenet',
          assentosdisponiveis: [1, 2, 3, 4],
        },
      ]),
    };

    sessaoRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    redis.get.mockResolvedValueOnce(null); // cache da sessão
    redis.set.mockResolvedValue('OK');

    const result = await service.consultarSessoes(filtros);

    expect(sessaoRepository.createQueryBuilder).toHaveBeenCalled();
    expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
    expect(redis.set).toHaveBeenCalled();
    expect(result.data.length).toBe(1);
  });

  it('deve remover assentos reservados do retorno', async () => {
    const filtros: ConsultaSessaoDto = { id: 1 };

    redis.get.mockResolvedValueOnce(null); // cache principal

    const mockQueryBuilder: any = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          assentosdisponiveis: [1, 2, 3, 4, 5],
        },
      ]),
    };

    sessaoRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    redis.get.mockResolvedValueOnce(
      JSON.stringify([
        {
          reservaId: 'abc',
          assentos: [2, 4],
        },
      ]),
    );

    redis.set.mockResolvedValue('OK');

    const result = await service.consultarSessoes(filtros);

    expect(result.data[0].assentosdisponiveis).toEqual([1, 3, 5]);
  });
});
