import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AcessoService } from '../common/acesso/acesso.service';
import { Papel } from '../common/enums/papel.enum';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';
import { Usuario } from '../usuarios/usuario.entity';
import { AtualizarTurmaDto, CriarTurmaDto } from './dto/turma.dto';
import { Turma } from './turma.entity';

@Injectable()
export class TurmasService {
  constructor(
    @InjectRepository(Turma) private readonly turmas: Repository<Turma>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly acesso: AcessoService,
  ) {}

  async listar(usuario: UsuarioAutenticado) {
    const ids = await this.acesso.turmaIdsVisiveis(usuario);
    if (ids && ids.length === 0) return [];
    return this.turmas.find({
      where: ids ? { id: In(ids) } : {},
      relations: { professores: true },
      order: { anoLetivo: 'DESC', nome: 'ASC' },
    });
  }

  async buscar(usuario: UsuarioAutenticado, id: string) {
    const ids = await this.acesso.turmaIdsVisiveis(usuario);
    if (ids && !ids.includes(id)) {
      throw new NotFoundException('Turma não encontrada');
    }
    const turma = await this.turmas.findOne({
      where: { id },
      relations: { professores: true, alunos: true },
      order: { alunos: { nome: 'ASC' } },
    });
    if (!turma) throw new NotFoundException('Turma não encontrada');
    return turma;
  }

  async criar({ professorIds, ...dados }: CriarTurmaDto) {
    const turma = this.turmas.create({
      ...dados,
      professores: await this.carregarProfessores(professorIds),
    });
    return this.turmas.save(turma);
  }

  async atualizar(id: string, { professorIds, ...dados }: AtualizarTurmaDto) {
    const turma = await this.turmas.findOneBy({ id });
    if (!turma) throw new NotFoundException('Turma não encontrada');
    Object.assign(turma, dados);
    if (professorIds) {
      turma.professores = await this.carregarProfessores(professorIds);
    }
    return this.turmas.save(turma);
  }

  async remover(id: string) {
    const { affected } = await this.turmas.delete(id);
    if (!affected) throw new NotFoundException('Turma não encontrada');
  }

  private async carregarProfessores(ids: string[] = []) {
    if (ids.length === 0) return [];
    const professores = await this.usuarios.findBy({
      id: In(ids),
      papel: Papel.PROFESSOR,
    });
    if (professores.length !== new Set(ids).size) {
      throw new BadRequestException(
        'Algum dos IDs informados não é de um professor',
      );
    }
    return professores;
  }
}
