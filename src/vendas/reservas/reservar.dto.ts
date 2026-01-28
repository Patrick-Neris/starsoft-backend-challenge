import { ApiProperty } from '@nestjs/swagger';

export class ReservarDto {
  @ApiProperty({ example: 1 })
  sessaoId: number;

  @ApiProperty({ example: [1, 2, 3] })
  assentos: number[];

  @ApiProperty({ example: 'Patrick Neris' })
  usuario: string;
}
