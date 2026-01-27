import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('vendas')
export class Venda {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  usuario: string;

  @Index()
  @Column({ name: 'sessao_id', type: 'int' })
  sessaoId: number;

  @Column('int', { array: true })
  assentos: number[];
}
