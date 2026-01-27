import { Body, Controller, Post } from '@nestjs/common';
import { PagamentoService } from './pagamentos.service';
import { PagamentoDto } from './pagamentos.dto';

@Controller('vendas')
export class PagamentoController {
  constructor(private readonly pagamentoService: PagamentoService) {}

  @Post('pagamento')
  confirmarPagamento(@Body() dto: PagamentoDto) {
    return this.pagamentoService.confirmarPagamento(dto);
  }
}
