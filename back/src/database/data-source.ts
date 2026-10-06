/**
 * DataSource usado só pela CLI do TypeORM (scripts `migration:*` do
 * package.json). A API usa a mesma configuração via `typeormOptions`.
 *
 *   npm run migration:generate -- src/database/migrations/NomeDaMudanca
 *   npm run migration:run
 *   npm run migration:revert
 *
 * Para gerar, aponte o .env para um banco que esteja no esquema ANTERIOR à
 * mudança (com DB_SYNC=true o banco local já está atualizado e a CLI não
 * encontraria diferença).
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { typeormOptions } from '../config/typeorm.options';

export default new DataSource({
  ...typeormOptions((k) => process.env[k]),
  synchronize: false,
  migrationsRun: false,
});
