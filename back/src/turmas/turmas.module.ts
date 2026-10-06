import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Turma } from './turma.entity';
import { TurmasController } from './turmas.controller';
import { TurmasService } from './turmas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Turma, Usuario])],
  controllers: [TurmasController],
  providers: [TurmasService],
})
export class TurmasModule {}
