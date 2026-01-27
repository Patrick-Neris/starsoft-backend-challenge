import { Test, TestingModule } from '@nestjs/testing';
import { CriarSessaoService } from './criar-sessao.service';

describe('CriarSessaoService', () => {
  let service: CriarSessaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CriarSessaoService],
    }).compile();

    service = module.get<CriarSessaoService>(CriarSessaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
