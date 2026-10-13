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
import { FINANCAS, Papel } from '../common/enums/papel.enum';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';
import {
  AtualizarCobrancaDto,
  CriarCobrancaDto,
  RegistrarPagamentoDto,
} from './dto/cobranca.dto';
import { FinanceiroService } from './financeiro.service';

/** Tudo aqui é do financeiro e da direção; a família só lê o extrato. */
@ApiTags('financeiro')
@ApiBearerAuth()
@Papeis(...FINANCAS)
@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiro: FinanceiroService) {}

  /** Totais e a situação de cada aluno (da escola ou de uma turma). */
  @Get('resumo')
  @ApiQuery({ name: 'turmaId', required: false })
  resumo(
    @Query('turmaId', new ParseUUIDPipe({ optional: true })) turmaId?: string,
  ) {
    return this.financeiro.resumo(turmaId);
  }

  /** Quem está com cobrança vencida (a família: só os próprios filhos). */
  @Get('pendencias')
  @Papeis(...FINANCAS, Papel.RESPONSAVEL)
  pendencias(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.financeiro.pendencias(usuario);
  }

  /** Extrato do aluno. A família vê só os próprios filhos. */
  @Get('alunos/:alunoId')
  @Papeis(...FINANCAS, Papel.RESPONSAVEL)
  doAluno(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('alunoId', ParseUUIDPipe) alunoId: string,
  ) {
    return this.financeiro.doAluno(usuario, alunoId);
  }

  @Post('cobrancas')
  criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: CriarCobrancaDto,
  ) {
    return this.financeiro.criar(usuario, dto);
  }

  @Patch('cobrancas/:id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarCobrancaDto,
  ) {
    return this.financeiro.atualizar(id, dto);
  }

  /** Dá baixa. */
  @Post('cobrancas/:id/pagamento')
  @HttpCode(200)
  registrarPagamento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarPagamentoDto,
  ) {
    return this.financeiro.registrarPagamento(id, dto);
  }

  /** Desfaz a baixa. */
  @Delete('cobrancas/:id/pagamento')
  desfazerPagamento(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeiro.desfazerPagamento(id);
  }
}
