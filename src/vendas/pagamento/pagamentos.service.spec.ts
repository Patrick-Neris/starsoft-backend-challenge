import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import Redis from 'ioredis';
import { Channel } from 'amqplib';

import { PagamentoService } from './pagamentos.service';
import { Venda } from 'src/entities/venda.entity';
import { Assento } from 'src/entities/assento.entity';
import { CacheUtilsService } from 'src/utils/cache.util';
import { PagamentoDto } from './pagamentos.dto';

describe('PagamentoService', () => {
  let service: PagamentoService;

  let redis: jest.Mocked<Redis>;
  let channel: jest.Mocked<Channel>;
  let cacheUtils: jest.Mocked<CacheUtilsService>;
  let dataSource: DataSource;

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    channel = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<Channel>;

    cacheUtils = {
      invalidateSessaoCache: jest.fn(),
    } as unknown as jest.Mocked<CacheUtilsService>;

    const manager: jest.Mocked<EntityManager> = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => cb(manager)),
    } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagamentoService,
        {
          provide: getRepositoryToken(Venda),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Assento),
          useValue: {},
        },
        { provide: DataSource, useValue: dataSource },
        { provide: 'REDIS_CLIENT', useValue: redis },
        { provide: 'RABBITMQ_CHANNEL', useValue: channel },
        { provide: CacheUtilsService, useValue: cacheUtils },
      ],
    }).compile();

    service = module.get(PagamentoService);
  });

  const dto: PagamentoDto = {
    reservaId: 'reserva-123',
  };

  const reservaMock = {
    reservaId: 'reserva-123',
    sessaoId: 1,
    assentos: [1, 2],
    usuario: 'Patrick',
  };

  it('deve lançar erro se reserva não existir no redis', async () => {
    redis.get.mockResolvedValue(null);

    await expect(service.confirmarPagamento(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('deve confirmar pagamento com sucesso', async () => {
    redis.get.mockResolvedValue(JSON.stringify(reservaMock));

    const assentoMock = {
      disponiveis: [1, 2, 3],
      indisponiveis: [],
    };

    (dataSource.transaction as jest.Mock).mockImplementationOnce(async (cb) => {
      const fakeManager: jest.Mocked<EntityManager> = {
        findOne: jest.fn().mockResolvedValue(assentoMock),
        save: jest.fn(),
        create: jest.fn().mockReturnValue({}),
      } as unknown as jest.Mocked<EntityManager>;

      await cb(fakeManager);
    });

    const result = await service.confirmarPagamento(dto);

    expect(channel.publish).toHaveBeenCalled();
    expect(cacheUtils.invalidateSessaoCache).toHaveBeenCalled();
    expect(result.status).toBe('VENDA_CONFIRMADA');
  });

  it('deve lançar erro se assentos não forem encontrados', async () => {
    redis.get.mockResolvedValue(JSON.stringify(reservaMock));

    (dataSource.transaction as jest.Mock).mockImplementationOnce(async (cb) => {
      const fakeManager: jest.Mocked<EntityManager> = {
        findOne: jest.fn().mockResolvedValue(null),
      } as unknown as jest.Mocked<EntityManager>;

      await cb(fakeManager);
    });

    await expect(service.confirmarPagamento(dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve lançar erro se assento já estiver indisponível', async () => {
    redis.get.mockResolvedValue(JSON.stringify(reservaMock));

    const assentoMock = {
      disponiveis: [3, 4],
      indisponiveis: [],
    };

    (dataSource.transaction as jest.Mock).mockImplementationOnce(async (cb) => {
      const fakeManager: jest.Mocked<EntityManager> = {
        findOne: jest.fn().mockResolvedValue(assentoMock),
      } as unknown as jest.Mocked<EntityManager>;

      await cb(fakeManager);
    });

    await expect(service.confirmarPagamento(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
