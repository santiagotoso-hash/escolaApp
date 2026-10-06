import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';
import { EnviarMensagemDto, IniciarConversaDto } from './dto/mensagem.dto';
import { MensagensService } from './mensagens.service';

@ApiTags('conversas')
@ApiBearerAuth()
@Controller('conversas')
export class MensagensController {
  constructor(private readonly mensagens: MensagensService) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.mensagens.listar(usuario);
  }

  @Post()
  iniciar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: IniciarConversaDto,
  ) {
    return this.mensagens.iniciar(usuario, dto);
  }

  @Get(':id')
  abrir(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mensagens.abrir(usuario, id);
  }

  @Post(':id/mensagens')
  responder(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnviarMensagemDto,
  ) {
    return this.mensagens.responder(usuario, id, dto);
  }
}
