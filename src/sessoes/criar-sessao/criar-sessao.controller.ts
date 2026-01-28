import { Body, Controller, Post } from '@nestjs/common';
import { CriarSessaoService } from './criar-sessao.service';
import { CriarSessaoDto } from './criar-sessao.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Sessões')
@Controller('sessoes')
export class SessoesController {
  constructor(private readonly service: CriarSessaoService) {}

  @Post('criar-sessao')
  @ApiOperation({ summary: 'Criar sessões' })
  @ApiQuery({ name: 'filme', required: true })
  @ApiQuery({ name: 'data', required: true })
  @ApiQuery({ name: 'horario', required: true })
  @ApiQuery({ name: 'sala', required: true })
  @ApiQuery({ name: 'preco', required: true })
  @ApiQuery({ name: 'assentos', required: true })
  criarSessao(@Body() dto: CriarSessaoDto) {
    return this.service.criarSessao(dto);
  }
}
