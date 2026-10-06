import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aluno } from '../../alunos/aluno.entity';
import { Turma } from '../../turmas/turma.entity';
import { AcessoService } from './acesso.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Turma, Aluno])],
  providers: [AcessoService],
  exports: [AcessoService],
})
export class AcessoModule {}
