import { Body, Controller, Post } from '@nestjs/common';
import { ReservasService } from './reserva.service';
import { ReservarDto } from './reservar.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Vendas')
@Controller('vendas')
export class ReservasController {
  constructor(private readonly service: ReservasService) {}

  @Post('reservar')
  @ApiOperation({ summary: 'Reservar sessões.' })
  @ApiQuery({ name: 'sessaoId', required: true })
  @ApiQuery({ name: 'assentos', required: true })
  @ApiQuery({ name: 'usuario', required: true })
  reservar(@Body() dto: ReservarDto) {
    return this.service.reservar(dto);
  }
}
