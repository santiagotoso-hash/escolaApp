import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aluno } from '../../alunos/aluno.entity';
import { Turma } from '../../turmas/turma.entity';
import { Papel } from '../enums/papel.enum';
import type { UsuarioAutenticado } from '../usuario-autenticado';

/**
 * Regra única de "quem enxerga o quê", usada por todos os módulos:
 *  - ADMIN: tudo.
 *  - PROFESSOR: as turmas em que dá aula e os alunos delas.
 *  - RESPONSAVEL: os próprios filhos e as turmas deles.
 */
@Injectable()
export class AcessoService {
  constructor(
    @InjectRepository(Turma) private readonly turmas: Repository<Turma>,
    @InjectRepository(Aluno) private readonly alunos: Repository<Aluno>,
  ) {}

  /** IDs das turmas visíveis. `null` significa "todas" (admin). */
  async turmaIdsVisiveis(usuario: UsuarioAutenticado): Promise<string[] | null> {
    if (usuario.papel === Papel.ADMIN) return null;

    if (usuario.papel === Papel.PROFESSOR) {
      const turmas = await this.turmas
        .createQueryBuilder('t')
        .innerJoin('t.professores', 'p', 'p.id = :id', { id: usuario.id })
        .select('t.id', 'id')
        .getRawMany<{ id: string }>();
      return turmas.map((t) => t.id);
    }

    const filhos = await this.alunos
      .createQueryBuilder('a')
      .innerJoin('a.responsaveis', 'r', 'r.id = :id', { id: usuario.id })
      .select('DISTINCT a.turma_id', 'id')
      .where('a.turma_id IS NOT NULL')
      .getRawMany<{ id: string }>();
    return filhos.map((f) => f.id);
  }

  /** Lança 404/403 se o usuário não pode ver o aluno. */
  async garantirAcessoAoAluno(
    usuario: UsuarioAutenticado,
    alunoId: string,
  ): Promise<Aluno> {
    const aluno = await this.alunos.findOne({
      where: { id: alunoId },
      relations: { turma: true, responsaveis: true },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    if (usuario.papel === Papel.ADMIN) return aluno;

    if (usuario.papel === Papel.RESPONSAVEL) {
      if (aluno.responsaveis.some((r) => r.id === usuario.id)) return aluno;
    } else {
      const turmaIds = await this.turmaIdsVisiveis(usuario);
      if (aluno.turma && turmaIds?.includes(aluno.turma.id)) return aluno;
    }
    throw new ForbiddenException('Você não tem acesso a este aluno');
  }
}
