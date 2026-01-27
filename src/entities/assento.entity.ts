import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('assentos')
export class Assento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessao_id: number;

  @Column('int', { array: true })
  disponiveis: number[];

  @Column('int', { array: true })
  indisponiveis: number[];
}
