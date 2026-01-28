import { Controller, Get, Query } from '@nestjs/common';
import { ConsultaSessaoDto } from './consulta.dto';
import { ConsultaService } from './consulta.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Sessões')
@Controller('sessoes')
export class ConsultaController {
  constructor(private readonly service: ConsultaService) {}

  @Get('consulta')
  @ApiOperation({ summary: 'Consultar sessões.' })
  @ApiQuery({ name: 'id', required: false })
  @ApiQuery({ name: 'filme', required: false })
  @ApiQuery({ name: 'data', required: false })
  @ApiQuery({ name: 'horario', required: false })
  consultar(@Query() filtros: ConsultaSessaoDto) {
    return this.service.consultarSessoes(filtros);
  }
}
