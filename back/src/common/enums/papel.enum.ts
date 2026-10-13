/** Papel do usuário na escola. */
export enum Papel {
  /** Direção / secretaria: gerencia tudo. */
  ADMIN = 'admin',
  PROFESSOR = 'professor',
  /** Pai, mãe ou responsável legal de um ou mais alunos. */
  RESPONSAVEL = 'responsavel',
  /** Setor financeiro: cobranças dos alunos, e nada da vida escolar. */
  FINANCEIRO = 'financeiro',
}

/** Equipe da escola (quem publica comunicados e responde famílias). */
export const EQUIPE = [Papel.ADMIN, Papel.PROFESSOR];

/** Quem lança cobranças e dá baixa. */
export const FINANCAS = [Papel.ADMIN, Papel.FINANCEIRO];

/** Para rotas de todo mundo que os papéis restritos também usam (perfil). */
export const TODOS_OS_PAPEIS = Object.values(Papel);

/**
 * Papéis bloqueados por padrão: só entram nas rotas que os citam em
 * @Papeis. Sem isso, uma rota sem @Papeis (aberta a qualquer login)
 * mostraria mensagens, boletim e saúde ao financeiro.
 */
export const PAPEIS_RESTRITOS: Papel[] = [Papel.FINANCEIRO];
