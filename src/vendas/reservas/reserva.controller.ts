import { Body, Controller, Post } from '@nestjs/common';
import { ReservasService } from './reserva.service';
import { ReservarDto } from './reservar.dto';

@Controller('vendas')
export class ReservasController {
  constructor(private readonly service: ReservasService) {}

  @Post('reservar')
  reservar(@Body() dto: ReservarDto) {
    return this.service.reservar(dto);
  }
}
