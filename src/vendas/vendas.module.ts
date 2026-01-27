import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assento } from 'src/entities/assento.entity';
import { RedisModule } from 'src/redis/redis.module';
import { ReservasService } from './reservas/reserva.service';
import { ReservasController } from './reservas/reserva.controller';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';
import { UtilsModule } from 'src/utils/utils.module';
import { PagamentoService } from './pagamento/pagamentos.service';
import { PagamentoController } from './pagamento/pagamento.controller';
import { Venda } from 'src/entities/venda.entity';
import { HistoricoService } from './historico/historico.service';
import { HistoricoController } from './historico/historico.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assento, Venda]),
    RedisModule,
    RabbitMQModule,
    UtilsModule,
  ],
  providers: [ReservasService, PagamentoService, HistoricoService],
  controllers: [ReservasController, PagamentoController, HistoricoController],
})
export class VendasModule {}
