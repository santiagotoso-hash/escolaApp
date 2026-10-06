import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Papeis } from '../common/decorators/papeis.decorator';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { EQUIPE, Papel } from '../common/enums/papel.enum';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';
import { ComunicadosService } from './comunicados.service';
import { CriarComunicadoDto } from './dto/comunicado.dto';

@ApiTags('comunicados')
@ApiBearerAuth()
@Controller('comunicados')
export class ComunicadosController {
  constructor(private readonly comunicados: ComunicadosService) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.comunicados.listar(usuario);
  }

  @Post()
  @Papeis(...EQUIPE)
  criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: CriarComunicadoDto,
  ) {
    return this.comunicados.criar(usuario, dto);
  }

  /** Responsável confirma que leu ("Estou ciente"). Idempotente. */
  @Post(':id/ciencia')
  @Papeis(Papel.RESPONSAVEL)
  @HttpCode(200)
  confirmarCiencia(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.comunicados.confirmarCiencia(usuario, id);
  }

  @Delete(':id')
  @Papeis(...EQUIPE)
  @HttpCode(204)
  remover(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.comunicados.remover(usuario, id);
  }
}
