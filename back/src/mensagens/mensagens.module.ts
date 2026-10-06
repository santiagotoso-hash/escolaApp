import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversa } from './conversa.entity';
import { Mensagem } from './mensagem.entity';
import { MensagensController } from './mensagens.controller';
import { MensagensService } from './mensagens.service';

@Module({
  imports: [TypeOrmModule.forFeature([Conversa, Mensagem])],
  controllers: [MensagensController],
  providers: [MensagensService],
})
export class MensagensModule {}
