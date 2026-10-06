import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Turma } from '../turmas/turma.entity';
import { CienciaComunicado } from './ciencia-comunicado.entity';

export enum CategoriaComunicado {
  GERAL = 'geral',
  PEDAGOGICO = 'pedagogico',
  EVENTO = 'evento',
  FINANCEIRO = 'financeiro',
  URGENTE = 'urgente',
}

@Entity('comunicados')
export class Comunicado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  titulo: string;

  @Column({ type: 'text' })
  conteudo: string;

  @Column({
    type: 'enum',
    enum: CategoriaComunicado,
    default: CategoriaComunicado.GERAL,
  })
  categoria: CategoriaComunicado;

  /** Se true, o responsável precisa clicar em "Estou ciente". */
  @Column({ name: 'exige_ciencia', default: false })
  exigeCiencia: boolean;

  @ManyToOne(() => Usuario, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'autor_id' })
  autor: Usuario | null;

  /** null = comunicado para a escola inteira. */
  @ManyToOne(() => Turma, { nullable: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma | null;

  @OneToMany(() => CienciaComunicado, (c) => c.comunicado)
  ciencias: CienciaComunicado[];

  @CreateDateColumn({ name: 'publicado_em' })
  publicadoEm: Date;
}
