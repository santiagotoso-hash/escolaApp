import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Papeis } from '../common/decorators/papeis.decorator';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { Papel } from '../common/enums/papel.enum';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';
import { AtualizarTurmaDto, CriarTurmaDto } from './dto/turma.dto';
import { TurmasService } from './turmas.service';

@ApiTags('turmas')
@ApiBearerAuth()
@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmas: TurmasService) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.turmas.listar(usuario);
  }

  @Get(':id')
  buscar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.turmas.buscar(usuario, id);
  }

  @Post()
  @Papeis(Papel.ADMIN)
  criar(@Body() dto: CriarTurmaDto) {
    return this.turmas.criar(dto);
  }

  @Patch(':id')
  @Papeis(Papel.ADMIN)
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarTurmaDto,
  ) {
    return this.turmas.atualizar(id, dto);
  }

  @Delete(':id')
  @Papeis(Papel.ADMIN)
  @HttpCode(204)
  remover(@Param('id', ParseUUIDPipe) id: string) {
    return this.turmas.remover(id);
  }
}
