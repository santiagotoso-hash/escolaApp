import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aluno } from '../alunos/aluno.entity';
import { Turma } from '../turmas/turma.entity';
import { Cobranca } from './cobranca.entity';
import { CategoriaDespesa, Despesa } from './despesa.entity';
import { DespesasController } from './despesas.controller';
import { DespesasService } from './despesas.service';
import { FinanceiroController } from './financeiro.controller';
import { FinanceiroService } from './financeiro.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cobranca,
      Despesa,
      CategoriaDespesa,
      Aluno,
      Turma,
    ]),
  ],
  controllers: [FinanceiroController, DespesasController],
  providers: [FinanceiroService, DespesasService],
})
export class FinanceiroModule {}
