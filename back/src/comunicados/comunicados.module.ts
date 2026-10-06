import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turma } from '../turmas/turma.entity';
import { CienciaComunicado } from './ciencia-comunicado.entity';
import { Comunicado } from './comunicado.entity';
import { ComunicadosController } from './comunicados.controller';
import { ComunicadosService } from './comunicados.service';

@Module({
  imports: [TypeOrmModule.forFeature([Comunicado, CienciaComunicado, Turma])],
  controllers: [ComunicadosController],
  providers: [ComunicadosService],
})
export class ComunicadosModule {}
