import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';
import { dataExiste, hojeEmBrasilia, somarMeses } from './datas';
import { CategoriaDespesa, Despesa } from './despesa.entity';
import { RegistrarPagamentoDto } from './dto/cobranca.dto';
import {
  AtualizarCategoriaDto,
  AtualizarDespesaDto,
  CriarCategoriaDto,
  CriarDespesaDto,
} from './dto/despesa.dto';

export type SituacaoDespesa = 'pendente' | 'atrasada' | 'paga';

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function situacao(d: Despesa, hoje: string): SituacaoDespesa {
  if (d.pagoEm) return 'paga';
  return d.vencimento < hoje ? 'atrasada' : 'pendente';
}

/**
 * Despesas da escola (aluguel, energia, manutenção…) e as categorias em que
 * são lançadas. Só o financeiro e a direção chegam aqui.
 */
@Injectable()
export class DespesasService {
  constructor(
    @InjectRepository(Despesa) private readonly despesas: Repository<Despesa>,
    @InjectRepository(CategoriaDespesa)
    private readonly categorias: Repository<CategoriaDespesa>,
  ) {}

  /* ───────────────────────── Categorias ───────────────────────── */

  /** Todas, com quantas despesas cada uma tem (com despesa não se apaga). */
  async listarCategorias() {
    const { entities, raw } = await this.categorias
      .createQueryBuilder('c')
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(Despesa, 'd')
            .where('d.categoria_id = c.id'),
        'total',
      )
      .orderBy('c.ativa', 'DESC')
      .addOrderBy('LOWER(c.nome)', 'ASC')
      .getRawAndEntities<{ total: string }>();
    return entities.map((c, i) => ({
      id: c.id,
      nome: c.nome,
      ativa: c.ativa,
      totalDespesas: Number(raw[i].total),
    }));
  }

  async criarCategoria(dto: CriarCategoriaDto) {
    const nome = await this.nomeLivre(dto.nome);
    const categoria = await this.categorias.save(
      this.categorias.create({ nome }),
    );
    return { ...this.categoriaResposta(categoria), totalDespesas: 0 };
  }

  async atualizarCategoria(id: string, dto: AtualizarCategoriaDto) {
    const categoria = await this.buscarCategoria(id);
    if (dto.nome !== undefined) {
      categoria.nome = await this.nomeLivre(dto.nome, id);
    }
    if (dto.ativa !== undefined) categoria.ativa = dto.ativa;
    await this.categorias.save(categoria);
    return this.categoriaResposta(categoria);
  }

  async removerCategoria(id: string) {
    await this.buscarCategoria(id);
    if (await this.despesas.existsBy({ categoriaId: id })) {
      throw new BadRequestException(
        'Esta categoria já tem despesas lançadas. Desative-a em vez de excluir.',
      );
    }
    await this.categorias.delete(id);
  }

  /** Nome sem espaços nas pontas e que nenhuma outra categoria usa. */
  private async nomeLivre(bruto: string, ignorarId?: string) {
    const nome = bruto.trim().replace(/\s+/g, ' ');
    if (nome.length < 2) {
      throw new BadRequestException('Informe o nome da categoria');
    }
    const outra = await this.categorias
      .createQueryBuilder('c')
      .where('LOWER(c.nome) = LOWER(:nome)', { nome })
      .getOne();
    if (outra && outra.id !== ignorarId) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }
    return nome;
  }

  private async buscarCategoria(id: string) {
    const categoria = await this.categorias.findOneBy({ id });
    if (!categoria) throw new NotFoundException('Categoria não encontrada');
    return categoria;
  }

  private categoriaResposta(c: CategoriaDespesa) {
    return { id: c.id, nome: c.nome, ativa: c.ativa };
  }

  /* ────────────────────────── Despesas ────────────────────────── */

  /**
   * Despesas que vencem no mês. No mês atual entram também as atrasadas de
   * meses anteriores, para nenhuma conta vencida sumir de vista.
   */
  async listar(mes?: string) {
    const hoje = hojeEmBrasilia();
    const mesAtual = hoje.slice(0, 7);
    const escolhido = mes ?? mesAtual;
    if (!MES.test(escolhido)) {
      throw new BadRequestException('Mês inválido (use AAAA-MM)');
    }
    const inicio = `${escolhido}-01`;
    const fim = somarMeses(inicio, 1); // exclusivo

    const qb = this.despesas
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.categoria', 'categoria')
      .leftJoinAndSelect('d.lancadaPor', 'lancadaPor')
      .where('(d.vencimento >= :inicio AND d.vencimento < :fim)', {
        inicio,
        fim,
      })
      .orderBy('d.vencimento', 'ASC')
      .addOrderBy('d.criada_em', 'ASC');
    if (escolhido === mesAtual) {
      qb.orWhere('(d.pago_em IS NULL AND d.vencimento < :inicio)', { inicio });
    }
    const lista = await qb.getMany();

    // "Pago no mês" olha a data do pagamento, não a do vencimento.
    const { pago } = await this.despesas
      .createQueryBuilder('d')
      .select(
        'COALESCE(SUM(COALESCE(d.valor_pago_centavos, d.valor_centavos)), 0)',
        'pago',
      )
      .where('d.pago_em >= :inicio AND d.pago_em < :fim', { inicio, fim })
      .getRawOne<{ pago: string }>()
      .then((r) => r ?? { pago: '0' });

    const totais = {
      aPagarCentavos: 0,
      atrasadoCentavos: 0,
      pagoNoMesCentavos: Number(pago),
    };
    for (const d of lista) {
      const s = situacao(d, hoje);
      if (s === 'pendente') totais.aPagarCentavos += d.valorCentavos;
      if (s === 'atrasada') totais.atrasadoCentavos += d.valorCentavos;
    }

    return {
      hoje,
      mes: escolhido,
      totais,
      despesas: lista.map((d) => this.paraResposta(d, hoje)),
    };
  }

  /** Com `meses`, repete a despesa todo mês (ex.: o aluguel do ano). */
  async criar(usuario: UsuarioAutenticado, dto: CriarDespesaDto) {
    if (!dataExiste(dto.vencimento)) {
      throw new BadRequestException('Vencimento inválido');
    }
    const categoria = await this.buscarCategoria(dto.categoriaId);
    if (!categoria.ativa) {
      throw new BadRequestException('Esta categoria está desativada');
    }

    const meses = dto.meses ?? 1;
    const base = dto.descricao?.trim() || categoria.nome;
    const novas = Array.from({ length: meses }, (_, i) =>
      this.despesas.create({
        categoriaId: categoria.id,
        descricao: meses > 1 ? `${base} (${i + 1}/${meses})` : base,
        valorCentavos: dto.valorCentavos,
        vencimento: somarMeses(dto.vencimento, i),
        observacao: dto.observacao?.trim() || null,
        lancadaPorId: usuario.id,
      }),
    );
    await this.despesas.save(novas);
    return { criadas: novas.length };
  }

  async atualizar(id: string, dto: AtualizarDespesaDto) {
    const despesa = await this.buscar(id);
    const { observacao, ...resto } = dto;
    const mudaAlgo = Object.values(resto).some((v) => v !== undefined);
    if (despesa.pagoEm && mudaAlgo) {
      throw new BadRequestException(
        'Esta despesa já foi paga. Desfaça o pagamento antes de alterar.',
      );
    }
    if (dto.vencimento && !dataExiste(dto.vencimento)) {
      throw new BadRequestException('Vencimento inválido');
    }

    if (
      dto.categoriaId !== undefined &&
      dto.categoriaId !== despesa.categoriaId
    ) {
      const categoria = await this.buscarCategoria(dto.categoriaId);
      despesa.categoriaId = categoria.id;
      despesa.categoria = categoria;
    }
    if (dto.descricao !== undefined) {
      const descricao = dto.descricao.trim();
      if (!descricao) throw new BadRequestException('Informe a descrição');
      despesa.descricao = descricao;
    }
    if (dto.valorCentavos !== undefined) {
      despesa.valorCentavos = dto.valorCentavos;
    }
    if (dto.vencimento !== undefined) despesa.vencimento = dto.vencimento;
    if (observacao !== undefined) {
      despesa.observacao = observacao.trim() || null;
    }
    await this.despesas.save(despesa);
    return this.paraResposta(despesa, hojeEmBrasilia());
  }

  async remover(id: string) {
    const despesa = await this.buscar(id);
    if (despesa.pagoEm) {
      throw new BadRequestException(
        'Esta despesa já foi paga. Desfaça o pagamento antes de excluir.',
      );
    }
    await this.despesas.delete(id);
  }

  async registrarPagamento(id: string, dto: RegistrarPagamentoDto) {
    const despesa = await this.buscar(id);
    const hoje = hojeEmBrasilia();
    if (despesa.pagoEm) {
      throw new BadRequestException('Esta despesa já foi paga');
    }
    if (!dataExiste(dto.pagoEm) || dto.pagoEm > hoje) {
      throw new BadRequestException(
        'A data do pagamento não pode ser no futuro',
      );
    }
    despesa.pagoEm = dto.pagoEm;
    despesa.formaPagamento = dto.formaPagamento;
    despesa.valorPagoCentavos = dto.valorPagoCentavos ?? despesa.valorCentavos;
    await this.despesas.save(despesa);
    return this.paraResposta(despesa, hoje);
  }

  async desfazerPagamento(id: string) {
    const despesa = await this.buscar(id);
    if (!despesa.pagoEm) {
      throw new BadRequestException('Esta despesa não está paga');
    }
    despesa.pagoEm = null;
    despesa.formaPagamento = null;
    despesa.valorPagoCentavos = null;
    await this.despesas.save(despesa);
    return this.paraResposta(despesa, hojeEmBrasilia());
  }

  private async buscar(id: string) {
    const despesa = await this.despesas.findOne({
      where: { id },
      relations: { categoria: true, lancadaPor: true },
    });
    if (!despesa) throw new NotFoundException('Despesa não encontrada');
    return despesa;
  }

  private paraResposta(d: Despesa, hoje: string) {
    return {
      id: d.id,
      categoria: { id: d.categoria.id, nome: d.categoria.nome },
      descricao: d.descricao,
      valorCentavos: d.valorCentavos,
      vencimento: d.vencimento,
      pagoEm: d.pagoEm,
      valorPagoCentavos: d.valorPagoCentavos,
      formaPagamento: d.formaPagamento,
      situacao: situacao(d, hoje),
      observacao: d.observacao,
      lancadaPor: d.lancadaPor?.nome ?? null,
    };
  }
}
