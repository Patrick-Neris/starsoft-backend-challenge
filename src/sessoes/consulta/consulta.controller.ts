import { Controller, Get, Query } from '@nestjs/common';
import { ConsultaSessaoDto } from './consulta.dto';
import { ConsultaService } from './consulta.service';

@Controller('sessoes')
export class ConsultaController {
  constructor(private readonly service: ConsultaService) {}

  @Get('consulta')
  consultar(@Query() filtros: ConsultaSessaoDto) {
    return this.service.consultarSessoes(filtros);
  }
}
