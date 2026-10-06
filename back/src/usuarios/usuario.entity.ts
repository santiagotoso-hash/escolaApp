import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Papel } from '../common/enums/papel.enum';
import { Aluno } from '../alunos/aluno.entity';
import { Turma } from '../turmas/turma.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  nome: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'senha_hash', select: false })
  senhaHash: string;

  @Column({ type: 'enum', enum: Papel, default: Papel.RESPONSAVEL })
  papel: Papel;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  telefone: string | null;

  @Column({ default: true })
  ativo: boolean;

  /** Filhos (só para responsáveis). */
  @ManyToMany(() => Aluno, (aluno) => aluno.responsaveis)
  filhos: Aluno[];

  /** Turmas em que dá aula (só para professores). */
  @ManyToMany(() => Turma, (turma) => turma.professores)
  turmas: Turma[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
