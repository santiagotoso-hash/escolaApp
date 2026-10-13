import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Aluno } from '../alunos/aluno.entity';
import { Usuario } from '../usuarios/usuario.entity';

export enum TipoCobranca {
  MATRICULA = 'matricula',
  MENSALIDADE = 'mensalidade',
  UNIFORME = 'uniforme',
  LIVROS = 'livros',
  OUTRO = 'outro',
}

export const NOME_TIPO_COBRANCA: Record<TipoCobranca, string> = {
  [TipoCobranca.MATRICULA]: 'Matrícula',
  [TipoCobranca.MENSALIDADE]: 'Mensalidade',
  [TipoCobranca.UNIFORME]: 'Uniforme',
  [TipoCobranca.LIVROS]: 'Livros',
  [TipoCobranca.OUTRO]: 'Outro',
};

export enum FormaPagamento {
  PIX = 'pix',
  BOLETO = 'boleto',
  CARTAO = 'cartao',
  DINHEIRO = 'dinheiro',
  TRANSFERENCIA = 'transferencia',
}

/**
 * Uma cobrança de UM aluno: matrícula, uma mensalidade, uma compra de
 * uniforme ou de livros. O controle é manual: o financeiro lança e dá
 * baixa quando recebe (não há boleto nem Pix automático).
 *
 * A situação (pendente, atrasada, paga, cancelada) não é gravada: sai de
 * `pagoEm`, `cancelada` e do vencimento comparado com hoje.
 */
@Entity('cobrancas')
export class Cobranca {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'aluno_id', type: 'uuid' })
  alunoId: string;

  @ManyToOne(() => Aluno, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluno_id' })
  aluno: Aluno;

  @Column({ type: 'enum', enum: TipoCobranca })
  tipo: TipoCobranca;

  /** Ex.: "Mensalidade de março (3/12)", "Camiseta tam. 10". */
  @Column({ length: 150 })
  descricao: string;

  /** Em centavos, para não somar dinheiro com ponto flutuante. */
  @Column({ name: 'valor_centavos', type: 'int' })
  valorCentavos: number;

  @Column({ type: 'date' })
  vencimento: string;

  /** Dia em que a escola recebeu. null = ainda não paga. */
  @Column({ name: 'pago_em', type: 'date', nullable: true })
  pagoEm: string | null;

  @Column({
    name: 'forma_pagamento',
    type: 'enum',
    enum: FormaPagamento,
    nullable: true,
  })
  formaPagamento: FormaPagamento | null;

  /** Lançada por engano ou desistência: fica no histórico, fora das somas. */
  @Column({ default: false })
  cancelada: boolean;

  /** Anotação interna do financeiro (a família não vê). */
  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @Column({ name: 'lancada_por_id', type: 'uuid', nullable: true })
  lancadaPorId: string | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lancada_por_id' })
  lancadaPor: Usuario | null;

  @CreateDateColumn({ name: 'criada_em', type: 'timestamptz' })
  criadaEm: Date;
}
