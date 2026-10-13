import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { FormaPagamento } from './cobranca.entity';

/** As que toda escola começa tendo (a migration e o seed criam). */
export const CATEGORIAS_PADRAO = [
  'Aluguel',
  'Energia',
  'Manutenção',
  'Internet',
  'Outros',
];

/**
 * Categoria de despesa (Aluguel, Energia…). A escola cria as suas, renomeia
 * e desativa as que não usa mais; as despesas antigas continuam com ela.
 */
@Entity('categorias_despesa')
export class CategoriaDespesa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 60, unique: true })
  nome: string;

  /** Desativada: some da lista ao lançar, mas fica no histórico. */
  @Column({ default: true })
  ativa: boolean;

  @CreateDateColumn({ name: 'criada_em', type: 'timestamptz' })
  criadaEm: Date;
}

/**
 * Uma conta da escola a pagar: o aluguel de março, a conta de luz, um
 * conserto. Como as cobranças dos alunos, o controle é manual e a situação
 * (a pagar, atrasada, paga) sai de `pagoEm` e do vencimento.
 */
@Entity('despesas')
export class Despesa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'categoria_id', type: 'uuid' })
  categoriaId: string;

  /** RESTRICT: categoria com despesas não é apagada, só desativada. */
  @ManyToOne(() => CategoriaDespesa, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaDespesa;

  /** Ex.: "Aluguel (3/12)", "Conserto do portão". */
  @Column({ length: 150 })
  descricao: string;

  /** Em centavos. */
  @Column({ name: 'valor_centavos', type: 'int' })
  valorCentavos: number;

  @Index()
  @Column({ type: 'date' })
  vencimento: string;

  /** Dia em que a escola pagou. null = ainda não paga. */
  @Column({ name: 'pago_em', type: 'date', nullable: true })
  pagoEm: string | null;

  /** O que saiu de fato (com juros ou desconto). null = o valor cheio. */
  @Column({ name: 'valor_pago_centavos', type: 'int', nullable: true })
  valorPagoCentavos: number | null;

  @Column({
    name: 'forma_pagamento',
    type: 'enum',
    enum: FormaPagamento,
    nullable: true,
  })
  formaPagamento: FormaPagamento | null;

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
