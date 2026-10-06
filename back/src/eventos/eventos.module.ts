import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turma } from '../turmas/turma.entity';
import { Evento } from './evento.entity';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Evento, Turma])],
  controllers: [EventosController],
  providers: [EventosService],
})
export class EventosModule {}
