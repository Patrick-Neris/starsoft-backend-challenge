import { Controller, Get, Query } from '@nestjs/common';
import { HistoricoService } from './historico.service';
import { ConsultaHistoricoDto } from './historico.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Vendas')
@Controller('vendas')
export class HistoricoController {
  constructor(private readonly service: HistoricoService) {}

  @Get('historico')
  @ApiOperation({ summary: 'Consultar histórico de vendas' })
  @ApiQuery({ name: 'usuario', required: false })
  @ApiQuery({ name: 'sessaoId', required: false })
  consultar(@Query() filtros: ConsultaHistoricoDto) {
    return this.service.consultarHistorico(filtros);
  }
}
