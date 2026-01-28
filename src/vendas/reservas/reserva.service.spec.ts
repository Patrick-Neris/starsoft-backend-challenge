import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Channel } from 'amqplib';

import { ReservasService } from './reserva.service';
import { Assento } from 'src/entities/assento.entity';
import { CacheUtilsService } from 'src/utils/cache.util';
import { ReservarDto } from './reservar.dto';

describe('ReservasService', () => {
  let service: ReservasService;

  let assentoRepository: jest.Mocked<Repository<Assento>>;
  let redis: jest.Mocked<Redis>;
  let channel: jest.Mocked<Channel>;
  let cacheUtils: jest.Mocked<CacheUtilsService>;

  beforeEach(async () => {
    assentoRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Assento>>;

    redis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    channel = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<Channel>;

    cacheUtils = {
      invalidateSessaoCache: jest.fn(),
    } as unknown as jest.Mocked<CacheUtilsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservasService,
        {
          provide: getRepositoryToken(Assento),
          useValue: assentoRepository,
        },
        { provide: 'REDIS_CLIENT', useValue: redis },
        { provide: 'RABBITMQ_CHANNEL', useValue: channel },
        { provide: CacheUtilsService, useValue: cacheUtils },
      ],
    }).compile();

    service = module.get(ReservasService);
  });

  const dto: ReservarDto = {
    sessaoId: 1,
    assentos: [1, 2],
    usuario: 'Patrick',
  };

  it('deve lançar erro se não conseguir adquirir o lock', async () => {
    redis.set.mockResolvedValue(null);

    await expect(service.reservar(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(redis.del).not.toHaveBeenCalled();
  });

  it('deve lançar erro se a sessão não existir', async () => {
    redis.set.mockResolvedValue('OK');
    assentoRepository.findOne.mockResolvedValue(null);

    await expect(service.reservar(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(redis.del).toHaveBeenCalledWith('lock:sessao:1');
  });

  it('deve lançar erro se algum assento estiver indisponível', async () => {
    redis.set.mockResolvedValue('OK');

    assentoRepository.findOne.mockResolvedValue({
      disponiveis: [3, 4],
    } as Assento);

    redis.get.mockResolvedValue(JSON.stringify([]));

    await expect(service.reservar(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(redis.del).toHaveBeenCalledWith('lock:sessao:1');
  });

  it('deve criar a reserva com sucesso', async () => {
    redis.set.mockResolvedValue('OK');

    assentoRepository.findOne.mockResolvedValue({
      disponiveis: [1, 2, 3],
    } as Assento);

    redis.get.mockResolvedValue(null);

    // chamadas do redis.set:
    // lock
    // reserva:{id}
    // reservas:sessao:{id}
    redis.set
      .mockResolvedValueOnce('OK')
      .mockResolvedValueOnce('OK')
      .mockResolvedValueOnce('OK');

    redis.del.mockResolvedValue(1);

    const result = await service.reservar(dto);

    expect(result.reservaId).toBeDefined();
    expect(result.sessaoId).toBe(dto.sessaoId);
    expect(result.assentos).toEqual(dto.assentos);
    expect(result.usuario).toBe(dto.usuario);

    expect(channel.publish).toHaveBeenCalled();
    expect(cacheUtils.invalidateSessaoCache).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalledWith('lock:sessao:1');
  });
});
