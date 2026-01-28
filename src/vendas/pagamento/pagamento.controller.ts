import { Body, Controller, Post } from '@nestjs/common';
import { PagamentoService } from './pagamentos.service';
import { PagamentoDto } from './pagamentos.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Vendas')
@Controller('vendas')
export class PagamentoController {
  constructor(private readonly pagamentoService: PagamentoService) {}

  @Post('pagamento')
  @ApiOperation({ summary: 'Confirmar pagamentos' })
  @ApiQuery({ name: 'reservaId', required: true })
  confirmarPagamento(@Body() dto: PagamentoDto) {
    return this.pagamentoService.confirmarPagamento(dto);
  }
}
