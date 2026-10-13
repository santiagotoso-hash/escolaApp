import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Despesas da escola com categorias editáveis, e o valor recebido de fato
 * nas cobranças dos alunos.
 */
export class Despesas1791800000000 implements MigrationInterface {
  name = 'Despesas1791800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "categorias_despesa" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nome" character varying(60) NOT NULL,
                "ativa" boolean NOT NULL DEFAULT true,
                "criada_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_6f018a2cf79e4146381d4e17c94" UNIQUE ("nome"),
                CONSTRAINT "PK_fe9b9871c3f92fddd902397581b" PRIMARY KEY ("id")
            )
        `);
    // As categorias com que toda escola começa (CATEGORIAS_PADRAO).
    await queryRunner.query(`
            INSERT INTO "categorias_despesa" ("nome")
            VALUES ('Aluguel'), ('Energia'), ('Manutenção'), ('Internet'), ('Outros')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."despesas_forma_pagamento_enum" AS ENUM(
                'pix',
                'boleto',
                'cartao',
                'dinheiro',
                'transferencia'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "despesas" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "categoria_id" uuid NOT NULL,
                "descricao" character varying(150) NOT NULL,
                "valor_centavos" integer NOT NULL,
                "vencimento" date NOT NULL,
                "pago_em" date,
                "valor_pago_centavos" integer,
                "forma_pagamento" "public"."despesas_forma_pagamento_enum",
                "observacao" text,
                "lancada_por_id" uuid,
                "criada_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_e56af303d820f51a6e6a007b380" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_49ede9dcf9c8b92802a61fe5b6" ON "despesas" ("vencimento")
        `);
    await queryRunner.query(`
            ALTER TABLE "cobrancas"
            ADD "valor_pago_centavos" integer
        `);
    await queryRunner.query(`
            ALTER TABLE "despesas"
            ADD CONSTRAINT "FK_09ac33dcad7a16504745913777a" FOREIGN KEY ("categoria_id") REFERENCES "categorias_despesa"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "despesas"
            ADD CONSTRAINT "FK_e4298f311d9ee7983ffe2b598c0" FOREIGN KEY ("lancada_por_id") REFERENCES "usuarios"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "despesas" DROP CONSTRAINT "FK_e4298f311d9ee7983ffe2b598c0"
        `);
    await queryRunner.query(`
            ALTER TABLE "despesas" DROP CONSTRAINT "FK_09ac33dcad7a16504745913777a"
        `);
    await queryRunner.query(`
            ALTER TABLE "cobrancas" DROP COLUMN "valor_pago_centavos"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_49ede9dcf9c8b92802a61fe5b6"
        `);
    await queryRunner.query(`
            DROP TABLE "despesas"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."despesas_forma_pagamento_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "categorias_despesa"
        `);
  }
}
