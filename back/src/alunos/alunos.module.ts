import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turma } from '../turmas/turma.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Aluno } from './aluno.entity';
import { AlunosController } from './alunos.controller';
import { AlunosService } from './alunos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Aluno, Turma, Usuario])],
  controllers: [AlunosController],
  providers: [AlunosService],
})
export class AlunosModule {}
