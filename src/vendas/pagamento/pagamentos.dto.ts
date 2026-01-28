import { ApiProperty } from '@nestjs/swagger';

export class PagamentoDto {
  @ApiProperty({ example: '27f56795-373f-47c9-9bee-820678bac292' })
  reservaId: string;
}
