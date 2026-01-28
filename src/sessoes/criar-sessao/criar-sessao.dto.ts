import { ApiProperty } from '@nestjs/swagger';

export class CriarSessaoDto {
  @ApiProperty({ example: 'Velocipastor' })
  filme: string;

  @ApiProperty({ example: '2026-02-13' })
  data: string;

  @ApiProperty({ example: '18:00' })
  horario: string;

  @ApiProperty({ example: 7 })
  sala: number;

  @ApiProperty({ example: 15 })
  preco: number;

  @ApiProperty({ example: 40 })
  assentos: number;
}
