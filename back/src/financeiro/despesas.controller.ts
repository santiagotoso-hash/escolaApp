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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Papeis } from '../common/decorators/papeis.decorator';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { FINANCAS } from '../common/enums/papel.enum';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';
import { DespesasService } from './despesas.service';
import { RegistrarPagamentoDto } from './dto/cobranca.dto';
import {
  AtualizarCategoriaDto,
  AtualizarDespesaDto,
  CriarCategoriaDto,
  CriarDespesaDto,
} from './dto/despesa.dto';

/** Despesas da escola e as suas categorias: só financeiro e direção. */
@ApiTags('financeiro')
@ApiBearerAuth()
@Papeis(...FINANCAS)
@Controller('financeiro')
export class DespesasController {
  constructor(private readonly despesas: DespesasService) {}

  @Get('categorias')
  listarCategorias() {
    return this.despesas.listarCategorias();
  }

  @Post('categorias')
  criarCategoria(@Body() dto: CriarCategoriaDto) {
    return this.despesas.criarCategoria(dto);
  }

  /** Renomeia, desativa ou reativa. */
  @Patch('categorias/:id')
  atualizarCategoria(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarCategoriaDto,
  ) {
    return this.despesas.atualizarCategoria(id, dto);
  }

  /** Só sem despesas lançadas; com despesas, desative. */
  @Delete('categorias/:id')
  @HttpCode(204)
  removerCategoria(@Param('id', ParseUUIDPipe) id: string) {
    return this.despesas.removerCategoria(id);
  }

  @Get('despesas')
  @ApiQuery({
    name: 'mes',
    required: false,
    description: 'AAAA-MM; padrão: o mês atual',
  })
  listar(@Query('mes') mes?: string) {
    return this.despesas.listar(mes);
  }

  @Post('despesas')
  criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: CriarDespesaDto,
  ) {
    return this.despesas.criar(usuario, dto);
  }

  @Patch('despesas/:id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarDespesaDto,
  ) {
    return this.despesas.atualizar(id, dto);
  }

  @Delete('despesas/:id')
  @HttpCode(204)
  remover(@Param('id', ParseUUIDPipe) id: string) {
    return this.despesas.remover(id);
  }

  @Post('despesas/:id/pagamento')
  @HttpCode(200)
  registrarPagamento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarPagamentoDto,
  ) {
    return this.despesas.registrarPagamento(id, dto);
  }

  @Delete('despesas/:id/pagamento')
  desfazerPagamento(@Param('id', ParseUUIDPipe) id: string) {
    return this.despesas.desfazerPagamento(id);
  }
}
