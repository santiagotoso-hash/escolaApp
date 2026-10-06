import type { DataSourceOptions } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Turma } from '../turmas/turma.entity';
import { Aluno } from '../alunos/aluno.entity';
import { Comunicado } from '../comunicados/comunicado.entity';
import { CienciaComunicado } from '../comunicados/ciencia-comunicado.entity';
import { Evento } from '../eventos/evento.entity';
import { Conversa } from '../mensagens/conversa.entity';
import { Mensagem } from '../mensagens/mensagem.entity';

export const ENTIDADES = [
  Usuario,
  Turma,
  Aluno,
  Comunicado,
  CienciaComunicado,
  Evento,
  Conversa,
  Mensagem,
];

type Env = (key: string) => string | undefined;

/** Mesma configuração para a API e para o script de seed. */
export function typeormOptions(env: Env): DataSourceOptions {
  const ssl = env('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false;
  const conexao = env('DATABASE_URL')
    ? { url: env('DATABASE_URL') }
    : {
        host: env('DB_HOST'),
        port: Number(env('DB_PORT') ?? 5432),
        username: env('DB_USERNAME'),
        password: env('DB_PASSWORD'),
        database: env('DB_NAME'),
      };
  return {
    type: 'postgres',
    ...conexao,
    ssl,
    entities: ENTIDADES,
    synchronize: env('DB_SYNC') === 'true',
  };
}
