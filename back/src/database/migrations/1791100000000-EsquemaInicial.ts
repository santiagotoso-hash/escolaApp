import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema completo como estava quando o projeto passou a usar migrations.
 * Bancos que já existiam (criados com DB_SYNC=true) já têm as tabelas:
 * nesse caso não faz nada e só fica registrada como aplicada.
 */
export class EsquemaInicial1791100000000 implements MigrationInterface {
  name = 'EsquemaInicial1791100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('usuarios')) return;
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
            CREATE TYPE "public"."turmas_turno_enum" AS ENUM('manha', 'tarde', 'integral', 'noite')
        `);
    await queryRunner.query(`
            CREATE TABLE "turmas" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nome" character varying(60) NOT NULL,
                "ano_letivo" integer NOT NULL,
                "turno" "public"."turmas_turno_enum" NOT NULL DEFAULT 'manha',
                "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_dc45a711f2b6358996a1ab1be6f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "alunos" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nome" character varying(120) NOT NULL,
                "data_nascimento" date,
                "matricula" character varying(30),
                "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
                "turma_id" uuid,
                CONSTRAINT "UQ_6e0968af8b901a2773bf17aa366" UNIQUE ("matricula"),
                CONSTRAINT "PK_0090f2d8573e71e8e4e274db905" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."usuarios_papel_enum" AS ENUM('admin', 'professor', 'responsavel')
        `);
    await queryRunner.query(`
            CREATE TABLE "usuarios" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nome" character varying(120) NOT NULL,
                "email" character varying NOT NULL,
                "senha_hash" character varying NOT NULL,
                "papel" "public"."usuarios_papel_enum" NOT NULL DEFAULT 'responsavel',
                "telefone" character varying(30),
                "ativo" boolean NOT NULL DEFAULT true,
                "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"),
                CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "ciencias_comunicado" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "confirmado_em" TIMESTAMP NOT NULL DEFAULT now(),
                "comunicado_id" uuid,
                "usuario_id" uuid,
                CONSTRAINT "UQ_0fe1ea092932bb51fd65a88cc85" UNIQUE ("comunicado_id", "usuario_id"),
                CONSTRAINT "PK_834491e57d03225e0ac177ca29b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."comunicados_categoria_enum" AS ENUM(
                'geral',
                'pedagogico',
                'evento',
                'financeiro',
                'urgente'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "comunicados" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "titulo" character varying(150) NOT NULL,
                "conteudo" text NOT NULL,
                "categoria" "public"."comunicados_categoria_enum" NOT NULL DEFAULT 'geral',
                "exige_ciencia" boolean NOT NULL DEFAULT false,
                "publicado_em" TIMESTAMP NOT NULL DEFAULT now(),
                "autor_id" uuid,
                "turma_id" uuid,
                CONSTRAINT "PK_b7c8a872410a60e4f5aec4d6121" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."eventos_tipo_enum" AS ENUM(
                'reuniao',
                'prova',
                'passeio',
                'feriado',
                'festa',
                'outro'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "eventos" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "titulo" character varying(150) NOT NULL,
                "descricao" text,
                "tipo" "public"."eventos_tipo_enum" NOT NULL DEFAULT 'outro',
                "inicio" TIMESTAMP WITH TIME ZONE NOT NULL,
                "fim" TIMESTAMP WITH TIME ZONE,
                "local" character varying(150),
                "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
                "turma_id" uuid,
                CONSTRAINT "PK_40d4a3c6a4bfd24280cb97a509e" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "mensagens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "texto" text NOT NULL,
                "enviada_em" TIMESTAMP NOT NULL DEFAULT now(),
                "conversa_id" uuid,
                "autor_id" uuid,
                CONSTRAINT "PK_c2ba5218f1bff3363548479d2f3" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "conversas" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "assunto" character varying(150) NOT NULL,
                "ultima_mensagem_em" TIMESTAMP WITH TIME ZONE NOT NULL,
                "ultima_da_escola" boolean NOT NULL DEFAULT false,
                "lida_pela_familia_em" TIMESTAMP WITH TIME ZONE,
                "lida_pela_escola_em" TIMESTAMP WITH TIME ZONE,
                "criada_em" TIMESTAMP NOT NULL DEFAULT now(),
                "aluno_id" uuid,
                "responsavel_id" uuid,
                CONSTRAINT "PK_437d17a2367997521e4f46cb5ab" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "turma_professores" (
                "turma_id" uuid NOT NULL,
                "professor_id" uuid NOT NULL,
                CONSTRAINT "PK_9d169399f01aecec80488abc318" PRIMARY KEY ("turma_id", "professor_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_006b65369e36eb0f6bb984df53" ON "turma_professores" ("turma_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_008003b6aed3c38df687847c46" ON "turma_professores" ("professor_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "aluno_responsaveis" (
                "aluno_id" uuid NOT NULL,
                "responsavel_id" uuid NOT NULL,
                CONSTRAINT "PK_fd40d7e820e5259463d2770f9a5" PRIMARY KEY ("aluno_id", "responsavel_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f3c954296b0205d3cfe35e935a" ON "aluno_responsaveis" ("aluno_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_49ac5fd48203710206b9736fd0" ON "aluno_responsaveis" ("responsavel_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "alunos"
            ADD CONSTRAINT "FK_4ee7c1c2fd1b049876c1667aaf2" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "ciencias_comunicado"
            ADD CONSTRAINT "FK_6f54a53e6a728cb872e82a5d760" FOREIGN KEY ("comunicado_id") REFERENCES "comunicados"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "ciencias_comunicado"
            ADD CONSTRAINT "FK_9e7d98edcfaeb538b58b381525e" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "comunicados"
            ADD CONSTRAINT "FK_f2e9a4dd370b23ed0ac778dd84b" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "comunicados"
            ADD CONSTRAINT "FK_545e3817a1a2e108d3a9e383e73" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "eventos"
            ADD CONSTRAINT "FK_aaa1bfa1138c439cb3599ce72b9" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "mensagens"
            ADD CONSTRAINT "FK_b05d09a9c8ced1ff697941b8229" FOREIGN KEY ("conversa_id") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "mensagens"
            ADD CONSTRAINT "FK_28bfc4bcb594090f2846477bd53" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "conversas"
            ADD CONSTRAINT "FK_d6d2185e1ffec4b636dfa14b282" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "conversas"
            ADD CONSTRAINT "FK_4cf19362a29351895969820ac51" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "turma_professores"
            ADD CONSTRAINT "FK_006b65369e36eb0f6bb984df530" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "turma_professores"
            ADD CONSTRAINT "FK_008003b6aed3c38df687847c46b" FOREIGN KEY ("professor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "aluno_responsaveis"
            ADD CONSTRAINT "FK_f3c954296b0205d3cfe35e935a1" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "aluno_responsaveis"
            ADD CONSTRAINT "FK_49ac5fd48203710206b9736fd05" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "aluno_responsaveis" DROP CONSTRAINT "FK_49ac5fd48203710206b9736fd05"
        `);
    await queryRunner.query(`
            ALTER TABLE "aluno_responsaveis" DROP CONSTRAINT "FK_f3c954296b0205d3cfe35e935a1"
        `);
    await queryRunner.query(`
            ALTER TABLE "turma_professores" DROP CONSTRAINT "FK_008003b6aed3c38df687847c46b"
        `);
    await queryRunner.query(`
            ALTER TABLE "turma_professores" DROP CONSTRAINT "FK_006b65369e36eb0f6bb984df530"
        `);
    await queryRunner.query(`
            ALTER TABLE "conversas" DROP CONSTRAINT "FK_4cf19362a29351895969820ac51"
        `);
    await queryRunner.query(`
            ALTER TABLE "conversas" DROP CONSTRAINT "FK_d6d2185e1ffec4b636dfa14b282"
        `);
    await queryRunner.query(`
            ALTER TABLE "mensagens" DROP CONSTRAINT "FK_28bfc4bcb594090f2846477bd53"
        `);
    await queryRunner.query(`
            ALTER TABLE "mensagens" DROP CONSTRAINT "FK_b05d09a9c8ced1ff697941b8229"
        `);
    await queryRunner.query(`
            ALTER TABLE "eventos" DROP CONSTRAINT "FK_aaa1bfa1138c439cb3599ce72b9"
        `);
    await queryRunner.query(`
            ALTER TABLE "comunicados" DROP CONSTRAINT "FK_545e3817a1a2e108d3a9e383e73"
        `);
    await queryRunner.query(`
            ALTER TABLE "comunicados" DROP CONSTRAINT "FK_f2e9a4dd370b23ed0ac778dd84b"
        `);
    await queryRunner.query(`
            ALTER TABLE "ciencias_comunicado" DROP CONSTRAINT "FK_9e7d98edcfaeb538b58b381525e"
        `);
    await queryRunner.query(`
            ALTER TABLE "ciencias_comunicado" DROP CONSTRAINT "FK_6f54a53e6a728cb872e82a5d760"
        `);
    await queryRunner.query(`
            ALTER TABLE "alunos" DROP CONSTRAINT "FK_4ee7c1c2fd1b049876c1667aaf2"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_49ac5fd48203710206b9736fd0"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f3c954296b0205d3cfe35e935a"
        `);
    await queryRunner.query(`
            DROP TABLE "aluno_responsaveis"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_008003b6aed3c38df687847c46"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_006b65369e36eb0f6bb984df53"
        `);
    await queryRunner.query(`
            DROP TABLE "turma_professores"
        `);
    await queryRunner.query(`
            DROP TABLE "conversas"
        `);
    await queryRunner.query(`
            DROP TABLE "mensagens"
        `);
    await queryRunner.query(`
            DROP TABLE "eventos"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."eventos_tipo_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "comunicados"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."comunicados_categoria_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "ciencias_comunicado"
        `);
    await queryRunner.query(`
            DROP TABLE "usuarios"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."usuarios_papel_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "alunos"
        `);
    await queryRunner.query(`
            DROP TABLE "turmas"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."turmas_turno_enum"
        `);
  }
}
