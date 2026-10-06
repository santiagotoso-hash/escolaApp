import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Papeis } from '../common/decorators/papeis.decorator';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { EQUIPE } from '../common/enums/papel.enum';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';
import { CriarEventoDto } from './dto/evento.dto';
import { EventosService } from './eventos.service';

@ApiTags('eventos')
@ApiBearerAuth()
@Controller('eventos')
export class EventosController {
  constructor(private readonly eventos: EventosService) {}

  @Get()
  @ApiQuery({ name: 'de', required: false, description: 'ISO 8601; padrão: hoje' })
  @ApiQuery({ name: 'ate', required: false, description: 'ISO 8601' })
  listar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('de') de?: string,
    @Query('ate') ate?: string,
  ) {
    return this.eventos.listar(usuario, de, ate);
  }

  @Post()
  @Papeis(...EQUIPE)
  criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: CriarEventoDto,
  ) {
    return this.eventos.criar(usuario, dto);
  }

  @Delete(':id')
  @Papeis(...EQUIPE)
  @HttpCode(204)
  remover(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.eventos.remover(usuario, id);
  }
}
