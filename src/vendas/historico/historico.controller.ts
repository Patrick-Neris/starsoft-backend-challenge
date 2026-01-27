import { Controller, Get, Query } from '@nestjs/common';
import { HistoricoService } from './historico.service';
import { ConsultaHistoricoDto } from './historico.dto';

@Controller('vendas')
export class HistoricoController {
  constructor(private readonly service: HistoricoService) {}

  @Get('historico')
  consultar(@Query() filtros: ConsultaHistoricoDto) {
    return this.service.consultarHistorico(filtros);
  }
}
