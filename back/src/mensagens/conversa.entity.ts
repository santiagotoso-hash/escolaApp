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
import { Aluno } from '../alunos/aluno.entity';
import { Mensagem } from './mensagem.entity';

/**
 * Conversa entre UM responsável e a equipe da escola sobre UM aluno.
 * Do lado da escola, quem tem acesso ao aluno (direção e professores da
 * turma) vê e responde a mesma conversa.
 */
@Entity('conversas')
export class Conversa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  assunto: string;

  @ManyToOne(() => Aluno, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluno_id' })
  aluno: Aluno;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel: Usuario;

  @OneToMany(() => Mensagem, (m) => m.conversa)
  mensagens: Mensagem[];

  @Column({ name: 'ultima_mensagem_em', type: 'timestamptz' })
  ultimaMensagemEm: Date;

  /** Quem mandou a última mensagem: true = escola, false = família. */
  @Column({ name: 'ultima_da_escola', default: false })
  ultimaDaEscola: boolean;

  @Column({ name: 'lida_pela_familia_em', type: 'timestamptz', nullable: true })
  lidaPelaFamiliaEm: Date | null;

  @Column({ name: 'lida_pela_escola_em', type: 'timestamptz', nullable: true })
  lidaPelaEscolaEm: Date | null;

  @CreateDateColumn({ name: 'criada_em' })
  criadaEm: Date;
}
