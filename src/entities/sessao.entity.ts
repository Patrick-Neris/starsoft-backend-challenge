import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('sessoes')
@Unique(['filme', 'data', 'horario', 'sala'])
export class Sessao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filme: string;

  @Column({ type: 'date' })
  data: string;

  @Column({ type: 'time' })
  horario: string;

  @Column()
  sala: number;

  @Column({ type: 'numeric' })
  preco: number;

  @Column()
  assentos: number;
}
