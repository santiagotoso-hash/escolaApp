import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aluno } from '../alunos/aluno.entity';
import { AcessoService } from '../common/acesso/acesso.service';
import { FINANCAS, Papel } from '../common/enums/papel.enum';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';
import { Turma } from '../turmas/turma.entity';
import { Cobranca, NOME_TIPO_COBRANCA, TipoCobranca } from './cobranca.entity';
import { dataExiste, hojeEmBrasilia, nomeDoMes, somarMeses } from './datas';
import { Despesa } from './despesa.entity';
import {
  AtualizarCobrancaDto,
  CriarCobrancaDto,
  RegistrarPagamentoDto,
} from './dto/cobranca.dto';

export type Situacao = 'pendente' | 'atrasada' | 'paga' | 'cancelada';

/** O que entrou de fato (com juros ou desconto), ou o valor cheio. */
const RECEBIDO = 'COALESCE(c.valor_pago_centavos, c.valor_centavos)';

function situacao(c: Cobranca, hoje: string): Situacao {
  if (c.cancelada) return 'cancelada';
  if (c.pagoEm) return 'paga';
  return c.vencimento < hoje ? 'atrasada' : 'pendente';
}

/**
 * Cobranças dos alunos. Financeiro e direção veem e mexem em tudo; a
 * família só lê as cobranças dos próprios filhos (sem as canceladas e sem
 * as anotações internas). Professores não têm acesso.
 */
@Injectable()
export class FinanceiroService {
  constructor(
    @InjectRepository(Cobranca)
    private readonly cobrancas: Repository<Cobranca>,
    @InjectRepository(Aluno) private readonly alunos: Repository<Aluno>,
    @InjectRepository(Turma) private readonly turmas: Repository<Turma>,
    @InjectRepository(Despesa) private readonly despesas: Repository<Despesa>,
    private readonly acesso: AcessoService,
  ) {}

  /** Visão geral: totais da escola (ou da turma) e a situação de cada aluno. */
  async resumo(turmaId?: string) {
    const hoje = hojeEmBrasilia();
    const inicioDoMes = `${hoje.slice(0, 7)}-01`;
    const soma = (filtro: string, valor = 'c.valor_centavos') =>
      `COALESCE(SUM(${valor}) FILTER (WHERE ${filtro}), 0)`;

    const [alunos, turmas, despesasPagas, linhas] = await Promise.all([
      this.alunos.find({
        where: turmaId ? { turma: { id: turmaId } } : {},
        relations: { turma: true, responsaveis: true },
        order: { nome: 'ASC' },
      }),
      this.turmas.find({ order: { anoLetivo: 'DESC', nome: 'ASC' } }),
      // Despesas da escola pagas neste mês, para o saldo.
      this.despesas
        .createQueryBuilder('d')
        .select(
          'COALESCE(SUM(COALESCE(d.valor_pago_centavos, d.valor_centavos)), 0)',
          'total',
        )
        .where('d.pago_em >= :inicioDoMes', { inicioDoMes })
        .getRawOne<{ total: string }>(),
      this.cobrancas
        .createQueryBuilder('c')
        .select('c.aluno_id', 'alunoId')
        .addSelect(
          soma('c.pago_em IS NULL AND c.vencimento >= :hoje'),
          'aVencer',
        )
        .addSelect(
          soma('c.pago_em IS NULL AND c.vencimento < :hoje'),
          'atrasado',
        )
        .addSelect(soma('c.pago_em IS NOT NULL', RECEBIDO), 'pago')
        .addSelect(soma('c.pago_em >= :inicioDoMes', RECEBIDO), 'pagoNoMes')
        .addSelect(
          `TO_CHAR(MIN(c.vencimento) FILTER (WHERE c.pago_em IS NULL), 'YYYY-MM-DD')`,
          'proximoVencimento',
        )
        .where('c.cancelada = false')
        .groupBy('c.aluno_id')
        .setParameters({ hoje, inicioDoMes })
        .getRawMany<{
          alunoId: string;
          aVencer: string;
          atrasado: string;
          pago: string;
          pagoNoMes: string;
          proximoVencimento: string | null;
        }>(),
    ]);

    const porAluno = new Map(linhas.map((l) => [l.alunoId, l]));
    const totais = {
      aVencerCentavos: 0,
      atrasadoCentavos: 0,
      recebidoNoMesCentavos: 0,
      alunosEmAtraso: 0,
      /** Da escola toda (não muda com o filtro de turma). */
      despesasPagasNoMesCentavos: Number(despesasPagas?.total ?? 0),
    };
    const lista = alunos.map((a) => {
      const l = porAluno.get(a.id);
      const aVencerCentavos = Number(l?.aVencer ?? 0);
      const atrasadoCentavos = Number(l?.atrasado ?? 0);
      totais.aVencerCentavos += aVencerCentavos;
      totais.atrasadoCentavos += atrasadoCentavos;
      totais.recebidoNoMesCentavos += Number(l?.pagoNoMes ?? 0);
      if (atrasadoCentavos > 0) totais.alunosEmAtraso += 1;
      return {
        id: a.id,
        nome: a.nome,
        matricula: a.matricula,
        turma: a.turma ? { id: a.turma.id, nome: a.turma.nome } : null,
        responsaveis: a.responsaveis.map((r) => ({
          id: r.id,
          nome: r.nome,
          telefone: r.telefone,
          email: r.email,
        })),
        aVencerCentavos,
        atrasadoCentavos,
        pagoCentavos: Number(l?.pago ?? 0),
        proximoVencimento: l?.proximoVencimento ?? null,
      };
    });

    return {
      hoje,
      totais,
      turmas: turmas.map((t) => ({ id: t.id, nome: t.nome })),
      alunos: lista,
    };
  }

  /**
   * Alunos com cobrança vencida e não paga: quanto devem, quantas cobranças
   * e desde quando. Financeiro e direção recebem todos; a família, só os
   * próprios filhos. Serve para destacar o aluno na tela Alunos.
   */
  async pendencias(usuario: UsuarioAutenticado) {
    const qb = this.cobrancas
      .createQueryBuilder('c')
      .select('c.aluno_id', 'alunoId')
      .addSelect('SUM(c.valor_centavos)', 'atrasado')
      .addSelect('COUNT(*)', 'quantidade')
      .addSelect(`TO_CHAR(MIN(c.vencimento), 'YYYY-MM-DD')`, 'desde')
      .where('c.cancelada = false AND c.pago_em IS NULL')
      .andWhere('c.vencimento < :hoje', { hoje: hojeEmBrasilia() })
      .groupBy('c.aluno_id');
    if (usuario.papel === Papel.RESPONSAVEL) {
      qb.andWhere(
        'c.aluno_id IN (SELECT ar.aluno_id FROM aluno_responsaveis ar WHERE ar.responsavel_id = :uid)',
        { uid: usuario.id },
      );
    }
    const linhas = await qb.getRawMany<{
      alunoId: string;
      atrasado: string;
      quantidade: string;
      desde: string;
    }>();
    return linhas.map((l) => ({
      alunoId: l.alunoId,
      atrasadoCentavos: Number(l.atrasado),
      quantidade: Number(l.quantidade),
      desde: l.desde,
    }));
  }

  /** Extrato de um aluno. A família só chega aos próprios filhos. */
  async doAluno(usuario: UsuarioAutenticado, alunoId: string) {
    const aluno = await this.acesso.garantirAcessoAoAluno(usuario, alunoId);
    const equipe = FINANCAS.includes(usuario.papel);
    const hoje = hojeEmBrasilia();

    const cobrancas = await this.cobrancas.find({
      where: { alunoId, ...(equipe ? {} : { cancelada: false }) },
      relations: equipe ? { lancadaPor: true } : {},
      order: { vencimento: 'ASC', criadaEm: 'ASC' },
    });

    const totais = { aVencerCentavos: 0, atrasadoCentavos: 0, pagoCentavos: 0 };
    for (const c of cobrancas) {
      const s = situacao(c, hoje);
      if (s === 'pendente') totais.aVencerCentavos += c.valorCentavos;
      if (s === 'atrasada') totais.atrasadoCentavos += c.valorCentavos;
      if (s === 'paga') {
        totais.pagoCentavos += c.valorPagoCentavos ?? c.valorCentavos;
      }
    }

    return {
      hoje,
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        matricula: aluno.matricula,
        turma: aluno.turma
          ? { id: aluno.turma.id, nome: aluno.turma.nome }
          : null,
      },
      totais,
      cobrancas: cobrancas.map((c) => this.paraResposta(c, hoje, equipe)),
    };
  }

  /**
   * Lança para um aluno ou para a turma toda. Com `parcelas`, cria uma
   * cobrança por mês a partir do vencimento (ex.: as 12 mensalidades).
   */
  async criar(usuario: UsuarioAutenticado, dto: CriarCobrancaDto) {
    if (!dto.alunoId === !dto.turmaId) {
      throw new BadRequestException('Escolha um aluno ou uma turma');
    }
    if (!dataExiste(dto.vencimento)) {
      throw new BadRequestException('Vencimento inválido');
    }

    let alunoIds: string[];
    if (dto.alunoId) {
      if (!(await this.alunos.existsBy({ id: dto.alunoId }))) {
        throw new NotFoundException('Aluno não encontrado');
      }
      alunoIds = [dto.alunoId];
    } else {
      if (!(await this.turmas.existsBy({ id: dto.turmaId }))) {
        throw new NotFoundException('Turma não encontrada');
      }
      const daTurma = await this.alunos.find({
        where: { turma: { id: dto.turmaId } },
        select: { id: true },
      });
      if (daTurma.length === 0) {
        throw new BadRequestException('Esta turma não tem alunos');
      }
      alunoIds = daTurma.map((a) => a.id);
    }

    const parcelas = dto.parcelas ?? 1;
    const texto = dto.descricao?.trim();
    const novas: Cobranca[] = [];
    for (const alunoId of alunoIds) {
      for (let i = 0; i < parcelas; i++) {
        const vencimento = somarMeses(dto.vencimento, i);
        const base =
          texto ||
          (dto.tipo === TipoCobranca.MENSALIDADE
            ? `Mensalidade de ${nomeDoMes(vencimento)}`
            : NOME_TIPO_COBRANCA[dto.tipo]);
        novas.push(
          this.cobrancas.create({
            alunoId,
            tipo: dto.tipo,
            descricao: parcelas > 1 ? `${base} (${i + 1}/${parcelas})` : base,
            valorCentavos: dto.valorCentavos,
            vencimento,
            observacao: dto.observacao?.trim() || null,
            lancadaPorId: usuario.id,
          }),
        );
      }
    }
    await this.cobrancas.save(novas);
    return { criadas: novas.length, alunos: alunoIds.length };
  }

  async atualizar(id: string, dto: AtualizarCobrancaDto) {
    const cobranca = await this.buscar(id);
    const { observacao, ...resto } = dto;
    const mudaAlgo = Object.values(resto).some((v) => v !== undefined);
    if (cobranca.pagoEm && mudaAlgo) {
      throw new BadRequestException(
        'Esta cobrança já foi paga. Desfaça o pagamento antes de alterar.',
      );
    }
    if (dto.vencimento && !dataExiste(dto.vencimento)) {
      throw new BadRequestException('Vencimento inválido');
    }

    if (dto.tipo !== undefined) cobranca.tipo = dto.tipo;
    if (dto.descricao !== undefined) {
      const descricao = dto.descricao.trim();
      if (!descricao) throw new BadRequestException('Informe a descrição');
      cobranca.descricao = descricao;
    }
    if (dto.valorCentavos !== undefined) {
      cobranca.valorCentavos = dto.valorCentavos;
    }
    if (dto.vencimento !== undefined) cobranca.vencimento = dto.vencimento;
    if (dto.cancelada !== undefined) cobranca.cancelada = dto.cancelada;
    if (observacao !== undefined) {
      cobranca.observacao = observacao.trim() || null;
    }
    await this.cobrancas.save(cobranca);
    return this.paraResposta(cobranca, hojeEmBrasilia(), true);
  }

  /** A escola recebeu: registra a data, a forma e o valor que entrou. */
  async registrarPagamento(id: string, dto: RegistrarPagamentoDto) {
    const cobranca = await this.buscar(id);
    const hoje = hojeEmBrasilia();
    if (cobranca.cancelada) {
      throw new BadRequestException('Esta cobrança está cancelada');
    }
    if (cobranca.pagoEm) {
      throw new BadRequestException('Esta cobrança já foi paga');
    }
    if (!dataExiste(dto.pagoEm) || dto.pagoEm > hoje) {
      throw new BadRequestException(
        'A data do pagamento não pode ser no futuro',
      );
    }
    cobranca.pagoEm = dto.pagoEm;
    cobranca.formaPagamento = dto.formaPagamento;
    cobranca.valorPagoCentavos =
      dto.valorPagoCentavos ?? cobranca.valorCentavos;
    await this.cobrancas.save(cobranca);
    return this.paraResposta(cobranca, hoje, true);
  }

  /** Desfaz o pagamento (registrado por engano). */
  async desfazerPagamento(id: string) {
    const cobranca = await this.buscar(id);
    if (!cobranca.pagoEm) {
      throw new BadRequestException('Esta cobrança não está paga');
    }
    cobranca.pagoEm = null;
    cobranca.formaPagamento = null;
    cobranca.valorPagoCentavos = null;
    await this.cobrancas.save(cobranca);
    return this.paraResposta(cobranca, hojeEmBrasilia(), true);
  }

  private async buscar(id: string) {
    const cobranca = await this.cobrancas.findOne({
      where: { id },
      relations: { lancadaPor: true },
    });
    if (!cobranca) throw new NotFoundException('Cobrança não encontrada');
    return cobranca;
  }

  /** A família não recebe a anotação interna nem quem lançou. */
  private paraResposta(c: Cobranca, hoje: string, equipe: boolean) {
    return {
      id: c.id,
      alunoId: c.alunoId,
      tipo: c.tipo,
      descricao: c.descricao,
      valorCentavos: c.valorCentavos,
      vencimento: c.vencimento,
      pagoEm: c.pagoEm,
      valorPagoCentavos: c.valorPagoCentavos,
      formaPagamento: c.formaPagamento,
      situacao: situacao(c, hoje),
      ...(equipe
        ? {
            observacao: c.observacao,
            lancadaPor: c.lancadaPor?.nome ?? null,
            criadaEm: c.criadaEm,
          }
        : {}),
    };
  }
}
