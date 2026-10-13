import { MigrationInterface, QueryRunner } from 'typeorm';

/** Papel financeiro e as cobranças dos alunos. */
export class Financeiro1791700000000 implements MigrationInterface {
  name = 'Financeiro1791700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."cobrancas_tipo_enum" AS ENUM(
                'matricula',
                'mensalidade',
                'uniforme',
                'livros',
                'outro'
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."cobrancas_forma_pagamento_enum" AS ENUM(
                'pix',
                'boleto',
                'cartao',
                'dinheiro',
                'transferencia'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "cobrancas" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "aluno_id" uuid NOT NULL,
                "tipo" "public"."cobrancas_tipo_enum" NOT NULL,
                "descricao" character varying(150) NOT NULL,
                "valor_centavos" integer NOT NULL,
                "vencimento" date NOT NULL,
                "pago_em" date,
                "forma_pagamento" "public"."cobrancas_forma_pagamento_enum",
                "cancelada" boolean NOT NULL DEFAULT false,
                "observacao" text,
                "lancada_por_id" uuid,
                "criada_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d8ede1a6cc9b521260c4481643b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0f9f18ccab48c260274e8ba792" ON "cobrancas" ("aluno_id")
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."usuarios_papel_enum"
            ADD VALUE 'financeiro'
        `);
    await queryRunner.query(`
            ALTER TABLE "cobrancas"
            ADD CONSTRAINT "FK_0f9f18ccab48c260274e8ba7926" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "cobrancas"
            ADD CONSTRAINT "FK_65c7458a7dcb7bcc3895b927bf3" FOREIGN KEY ("lancada_por_id") REFERENCES "usuarios"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "cobrancas" DROP CONSTRAINT "FK_65c7458a7dcb7bcc3895b927bf3"
        `);
    await queryRunner.query(`
            ALTER TABLE "cobrancas" DROP CONSTRAINT "FK_0f9f18ccab48c260274e8ba7926"
        `);
    // Só desfaz se não houver mais nenhum usuário com o papel financeiro.
    await queryRunner.query(`
            CREATE TYPE "public"."usuarios_papel_enum_old" AS ENUM('admin', 'professor', 'responsavel')
        `);
    await queryRunner.query(`
            ALTER TABLE "usuarios" ALTER COLUMN "papel" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "usuarios"
            ALTER COLUMN "papel" TYPE "public"."usuarios_papel_enum_old" USING "papel"::"text"::"public"."usuarios_papel_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."usuarios_papel_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."usuarios_papel_enum_old"
            RENAME TO "usuarios_papel_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "usuarios" ALTER COLUMN "papel" SET DEFAULT 'responsavel'
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0f9f18ccab48c260274e8ba792"
        `);
    await queryRunner.query(`
            DROP TABLE "cobrancas"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."cobrancas_forma_pagamento_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."cobrancas_tipo_enum"
        `);
  }
}
