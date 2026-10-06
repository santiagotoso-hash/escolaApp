# Escola Conecta

Comunicação entre a escola e as famílias dos alunos: **comunicados com confirmação de leitura**, **agenda e calendário escolar** (com os feriados nacionais), **provas**, **boletim**, **ficha de saúde e alergias**, **mensagens diretas** entre responsáveis e professores e **parabéns automáticos no aniversário** do aluno (mensagem para a família e aviso por e-mail aos professores da turma, às 7h).

| Pasta    | Stack                                                        | Porta |
| -------- | ------------------------------------------------------------ | ----- |
| `back/`  | NestJS 12 · TypeORM · PostgreSQL · JWT · Swagger              | 4001  |
| `front/` | Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Lucide | 3001  |

## Papéis

| Papel           | O que faz                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------- |
| **Direção** (`admin`) | Tudo: cadastra usuários, turmas e alunos; publica para a escola inteira; vê quem confirmou cada comunicado; lança notas e edita fichas de saúde; edita a ficha dos professores (com anotações internas). |
| **Professor**   | Vê as suas turmas e alunos; publica comunicados, eventos e provas para as suas turmas; lança notas; consulta alergias; vê o contato dos colegas e edita a própria ficha; responde às famílias. |
| **Responsável** | Vê os filhos, os comunicados, a agenda, as provas e o boletim deles; confirma ciência; preenche a ficha de saúde; conversa com a escola. |

A regra de "quem enxerga o quê" está num só lugar: `back/src/common/acesso/acesso.service.ts`.

## Como rodar

Pré-requisitos: Node 20+ e PostgreSQL.

```bash
# 1. API
cd back
cp .env.example .env        # ajuste DB_PASSWORD e JWT_SECRET
npm install
npm run seed                # cria as tabelas e os dados de demonstração (APAGA o banco!)
npm run start:dev           # http://localhost:4001 · Swagger em http://localhost:4001/api

# 2. Front (outro terminal)
cd front
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3001
```

O banco `escola_conecta` precisa existir antes do seed (`CREATE DATABASE escola_conecta;`).

### Usuários de demonstração

Todos com a senha **`Senha@123`**:

| Papel                         | E-mail                         |
| ----------------------------- | ------------------------------ |
| Direção                       | `direcao@escolaconecta.com.br` |
| Professora do 5º Ano A        | `carla@escolaconecta.com.br`   |
| Professor do 2º Ano B         | `roberto@escolaconecta.com.br` |
| Mãe do Lucas e da Beatriz     | `maria@email.com`              |
| Pai do Lucas e da Beatriz     | `joao@email.com`               |
| Mãe do Gabriel                | `fernanda@email.com`           |

## API (resumo)

Tudo exige `Authorization: Bearer <token>`, exceto `POST /auth/entrar` e `GET /saude`.

| Método | Rota                          | Quem             |
| ------ | ----------------------------- | ---------------- |
| POST   | `/auth/entrar`                | público          |
| GET/PATCH | `/usuarios/eu`             | todos            |
| GET    | `/usuarios?papel=`            | equipe           |
| POST/PATCH | `/usuarios`, `/usuarios/:id` | direção       |
| GET    | `/turmas`, `/alunos`          | todos (filtrado) |
| POST/PATCH/DELETE | `/turmas`, `/alunos` | direção          |
| GET    | `/comunicados`                | todos (filtrado) |
| POST/DELETE | `/comunicados`           | equipe           |
| POST   | `/comunicados/:id/ciencia`    | responsável      |
| GET    | `/eventos?de=&ate=&tipo=`     | todos (filtrado) |
| POST/DELETE | `/eventos`               | equipe           |
| GET/POST | `/conversas`                | todos (filtrado) |
| GET    | `/conversas/:id` (marca como lida) | participantes |
| POST   | `/conversas/:id/mensagens`    | participantes    |
| PATCH  | `/alunos/:id/saude`, `/alunos/:id/nascimento` | direção, responsável do aluno |
| GET    | `/professores`                | equipe (colegas: só contato) |
| PATCH  | `/professores/:id`            | direção; professor só a própria ficha |
| GET    | `/boletim/disciplinas`        | todos            |
| GET    | `/boletim/alunos/:id?ano=`    | todos (filtrado) |
| GET/PUT | `/boletim/turmas/:id?disciplina=&bimestre=` | equipe (turmas dela) |

## Banco em produção (Supabase, Neon, Render…)

No `back/.env`:

```
DATABASE_URL=postgresql://usuario:senha@host:5432/postgres
DB_SSL=true
DB_SYNC=false
```

Com `DB_SYNC=false`, a API aplica sozinha as migrations pendentes (`back/src/database/migrations`) toda vez que sobe — não é preciso rodar SQL à mão. Num banco vazio, a primeira migration cria todas as tabelas; num banco que já existia (criado com `DB_SYNC=true`), ela não faz nada e só as seguintes são aplicadas.

`DB_SYNC=true` (desenvolvimento) cria/atualiza as tabelas direto a partir das entidades e ignora as migrations.

### Mudou uma entidade? Gere uma migration

1. Aponte o `back/.env` para um banco no esquema **anterior** à mudança (por exemplo, um banco local com `DB_SYNC=false` e `npm run migration:run`).
2. `npm run migration:generate -- src/database/migrations/NomeDaMudanca`
3. Revise o SQL gerado e adicione a classe em `src/database/migrations/index.ts`.

Outros comandos: `npm run migration:show` (o que já foi aplicado), `npm run migration:run`, `npm run migration:revert` (desfaz a última).

## Próximos passos sugeridos

- Recuperação de senha por e-mail (hoje a secretaria redefine).
- Notificações push (o aviso por e-mail já existe).
- Mensagens em tempo real (WebSocket); hoje a conversa aberta atualiza a cada 15 s.
- Anexos em comunicados (PDF, fotos) e autorizações de passeio com assinatura.
- Frequência (chamada).
- Disciplinas configuráveis pela direção (hoje a lista fica em `back/src/common/disciplinas.ts`).
