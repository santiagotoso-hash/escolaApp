import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcessoService } from '../common/acesso/acesso.service';
import { Papel } from '../common/enums/papel.enum';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';
import { Conversa } from './conversa.entity';
import { EnviarMensagemDto, IniciarConversaDto } from './dto/mensagem.dto';
import { Mensagem } from './mensagem.entity';

const ehFamilia = (u: UsuarioAutenticado) => u.papel === Papel.RESPONSAVEL;

@Injectable()
export class MensagensService {
  constructor(
    @InjectRepository(Conversa)
    private readonly conversas: Repository<Conversa>,
    @InjectRepository(Mensagem)
    private readonly mensagens: Repository<Mensagem>,
    private readonly acesso: AcessoService,
  ) {}

  async listar(usuario: UsuarioAutenticado) {
    const qb = this.conversas
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.aluno', 'aluno')
      .leftJoinAndSelect('aluno.turma', 'turma')
      .leftJoinAndSelect('c.responsavel', 'responsavel')
      .orderBy('c.ultimaMensagemEm', 'DESC');

    if (ehFamilia(usuario)) {
      qb.where('responsavel.id = :uid', { uid: usuario.id });
    } else {
      const ids = await this.acesso.turmaIdsVisiveis(usuario);
      if (ids) {
        if (!ids.length) return [];
        qb.where('turma.id IN (:...ids)', { ids });
      }
    }

    const conversas = await qb.getMany();
    return conversas.map((c) => ({ ...c, naoLida: this.naoLida(c, usuario) }));
  }

  /** Abre a conversa (com mensagens) e marca como lida para quem abriu. */
  async abrir(usuario: UsuarioAutenticado, id: string) {
    const conversa = await this.buscarVisivel(usuario, id);
    const mensagens = await this.mensagens.find({
      where: { conversa: { id } },
      order: { enviadaEm: 'ASC' },
    });
    const agora = new Date();
    await this.conversas.update(
      id,
      ehFamilia(usuario)
        ? { lidaPelaFamiliaEm: agora }
        : { lidaPelaEscolaEm: agora },
    );
    return { ...conversa, naoLida: false, mensagens };
  }

  async iniciar(usuario: UsuarioAutenticado, dto: IniciarConversaDto) {
    const aluno = await this.acesso.garantirAcessoAoAluno(usuario, dto.alunoId);

    let responsavelId = usuario.id;
    if (!ehFamilia(usuario)) {
      if (!dto.responsavelId) {
        throw new BadRequestException('Escolha o responsável que vai receber');
      }
      responsavelId = dto.responsavelId;
    }
    if (!aluno.responsaveis.some((r) => r.id === responsavelId)) {
      throw new BadRequestException('Este responsável não é do aluno');
    }

    const conversa = await this.conversas.save(
      this.conversas.create({
        assunto: dto.assunto,
        aluno: { id: aluno.id },
        responsavel: { id: responsavelId },
        ultimaMensagemEm: new Date(),
      }),
    );
    await this.registrar(usuario, conversa.id, dto.texto);
    return this.abrir(usuario, conversa.id);
  }

  async responder(usuario: UsuarioAutenticado, id: string, dto: EnviarMensagemDto) {
    await this.buscarVisivel(usuario, id);
    return this.registrar(usuario, id, dto.texto);
  }

  private async registrar(usuario: UsuarioAutenticado, conversaId: string, texto: string) {
    const mensagem = await this.mensagens.save(
      this.mensagens.create({
        conversa: { id: conversaId },
        autor: { id: usuario.id },
        texto: texto.trim(),
      }),
    );
    // Quem escreve, obviamente, já leu tudo até aqui.
    await this.conversas.update(conversaId, {
      ultimaMensagemEm: mensagem.enviadaEm,
      ultimaDaEscola: !ehFamilia(usuario),
      ...(ehFamilia(usuario)
        ? { lidaPelaFamiliaEm: mensagem.enviadaEm }
        : { lidaPelaEscolaEm: mensagem.enviadaEm }),
    });
    return this.mensagens.findOneBy({ id: mensagem.id });
  }

  private async buscarVisivel(usuario: UsuarioAutenticado, id: string) {
    const conversa = await this.conversas.findOne({
      where: { id },
      relations: { aluno: { turma: true } },
    });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');

    const visivel = ehFamilia(usuario)
      ? conversa.responsavel.id === usuario.id
      : await this.acesso
          .garantirAcessoAoAluno(usuario, conversa.aluno.id)
          .then(() => true)
          .catch(() => false);
    if (!visivel) throw new NotFoundException('Conversa não encontrada');
    return conversa;
  }

  /** Não lida = a última mensagem veio do outro lado e é posterior à minha leitura. */
  private naoLida(c: Conversa, usuario: UsuarioAutenticado) {
    const familia = ehFamilia(usuario);
    if (c.ultimaDaEscola !== familia) return false;
    const lidaEm = familia ? c.lidaPelaFamiliaEm : c.lidaPelaEscolaEm;
    return !lidaEm || lidaEm < c.ultimaMensagemEm;
  }
}
