import { Body, Controller, Post } from '@nestjs/common';
import { CriarSessaoService } from './criar-sessao.service';
import { CriarSessaoDto } from './criar-sessao.dto';

@Controller('sessoes')
export class SessoesController {
  constructor(private readonly service: CriarSessaoService) {}

  @Post('criar-sessao')
  criarSessao(@Body() dto: CriarSessaoDto) {
    return this.service.criarSessao(dto);
  }
}
