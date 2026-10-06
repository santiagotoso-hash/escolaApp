import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Aluno } from '../alunos/aluno.entity';

export enum Turno {
  MANHA = 'manha',
  TARDE = 'tarde',
  INTEGRAL = 'integral',
  NOITE = 'noite',
}

@Entity('turmas')
export class Turma {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Ex.: "5º Ano A". */
  @Column({ length: 60 })
  nome: string;

  @Column({ name: 'ano_letivo', type: 'int' })
  anoLetivo: number;

  @Column({ type: 'enum', enum: Turno, default: Turno.MANHA })
  turno: Turno;

  @ManyToMany(() => Usuario, (usuario) => usuario.turmas)
  @JoinTable({
    name: 'turma_professores',
    joinColumn: { name: 'turma_id' },
    inverseJoinColumn: { name: 'professor_id' },
  })
  professores: Usuario[];

  @OneToMany(() => Aluno, (aluno) => aluno.turma)
  alunos: Aluno[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
