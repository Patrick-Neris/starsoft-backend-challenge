import { Module } from '@nestjs/common';
import { ConsultaService } from './consulta/consulta.service';
import { CriarSessaoService } from './criar-sessao/criar-sessao.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sessao } from '../entities/sessao.entity';
import { SessoesController } from './criar-sessao/criar-sessao.controller';
import { Assento } from '../entities/assento.entity';
import { ConsultaController } from './consulta/consulta.controller';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sessao, Assento]), RedisModule],
  providers: [ConsultaService, CriarSessaoService],
  controllers: [ConsultaController, SessoesController],
})
export class SessoesModule {}
