import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import Redis from 'ioredis';

import { HistoricoService } from './historico.service';
import { ConsultaHistoricoDto } from './historico.dto';
import { Venda } from 'src/entities/venda.entity';

describe('HistoricoService', () => {
  let service: HistoricoService;
  let vendaRepository: jest.Mocked<Repository<Venda>>;
  let redis: jest.Mocked<Redis>;

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    vendaRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Venda>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoricoService,
        {
          provide: getRepositoryToken(Venda),
          useValue: vendaRepository,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get(HistoricoService);
  });

  it('deve lançar erro se nenhum filtro válido for informado', async () => {
    const filtros = {} as ConsultaHistoricoDto;

    await expect(service.consultarHistorico(filtros)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deve retornar dados do cache quando existir', async () => {
    const filtros: ConsultaHistoricoDto = { usuario: 'Patrick' };

    redis.get.mockResolvedValue(
      JSON.stringify([
        {
          id: 'uuid',
          usuario: 'Patrick',
          sessao_id: 1,
          assentos: [1, 2],
        },
      ]),
    );

    const result = await service.consultarHistorico(filtros);

    expect(redis.get).toHaveBeenCalled();
    expect(vendaRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(result.data.length).toBe(1);
  });

  it('deve buscar no banco e salvar no cache quando não houver cache', async () => {
    const filtros: ConsultaHistoricoDto = { usuario: 'Patrick' };

    redis.get.mockResolvedValue(null);

    const mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Venda>> = {
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          id: 'uuid',
          usuario: 'Patrick',
          sessao_id: 1,
          assentos: [1, 2],
        },
      ]),
    } as unknown as jest.Mocked<SelectQueryBuilder<Venda>>;

    vendaRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    redis.set.mockResolvedValue('OK');

    const result = await service.consultarHistorico(filtros);

    expect(vendaRepository.createQueryBuilder).toHaveBeenCalled();
    expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
    expect(redis.set).toHaveBeenCalled();
    expect(result.data.length).toBe(1);
  });

  it('deve aplicar filtro por sessaoId corretamente', async () => {
    const filtros: ConsultaHistoricoDto = { sessaoId: 2 };

    redis.get.mockResolvedValue(null);

    const mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Venda>> = {
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<SelectQueryBuilder<Venda>>;

    vendaRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    redis.set.mockResolvedValue('OK');

    await service.consultarHistorico(filtros);

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'v.sessao_id = :id',
      { id: 2 },
    );
  });
});
