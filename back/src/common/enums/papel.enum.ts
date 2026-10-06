/** Papel do usuário na escola. */
export enum Papel {
  /** Direção / secretaria: gerencia tudo. */
  ADMIN = 'admin',
  PROFESSOR = 'professor',
  /** Pai, mãe ou responsável legal de um ou mais alunos. */
  RESPONSAVEL = 'responsavel',
}

/** Equipe da escola (quem publica comunicados e responde famílias). */
export const EQUIPE = [Papel.ADMIN, Papel.PROFESSOR];
