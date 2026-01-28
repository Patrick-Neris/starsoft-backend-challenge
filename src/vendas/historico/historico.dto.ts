import { ApiProperty } from '@nestjs/swagger';

export class ConsultaHistoricoDto {
  @ApiProperty({ example: 'Fausto Silva' })
  usuario?: string;

  @ApiProperty({ example: 10 })
  sessaoId?: number;
}
