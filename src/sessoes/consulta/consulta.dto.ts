import { ApiProperty } from '@nestjs/swagger';

export class ConsultaSessaoDto {
  @ApiProperty({ example: 1 })
  id?: number;

  @ApiProperty({ example: 'Shrek' })
  filme?: string;

  @ApiProperty({ example: '23-07-2002' })
  data?: string;

  @ApiProperty({ example: '13:00' })
  horario?: string;
}
