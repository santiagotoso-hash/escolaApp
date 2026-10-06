import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Turma } from '../turmas/turma.entity';

@Entity('alunos')
export class Aluno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  nome: string;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento: string | null;

  /** Número de matrícula da secretaria. */
  @Column({ type: 'varchar', nullable: true, unique: true, length: 30 })
  matricula: string | null;

  @ManyToOne(() => Turma, (turma) => turma.alunos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma | null;

  @ManyToMany(() => Usuario, (usuario) => usuario.filhos)
  @JoinTable({
    name: 'aluno_responsaveis',
    joinColumn: { name: 'aluno_id' },
    inverseJoinColumn: { name: 'responsavel_id' },
  })
  responsaveis: Usuario[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
