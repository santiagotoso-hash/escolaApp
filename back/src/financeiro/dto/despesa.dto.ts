import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const DATA = /^\d{4}-\d{2}-\d{2}$/;
/** R$ 1.000.000,00: acima disso é erro de digitação. */
const VALOR_MAXIMO = 100_000_000;

export class CriarCategoriaDto {
  @ApiProperty({ example: 'Material de limpeza' })
  @IsString()
  @MinLength(2, { message: 'Informe o nome da categoria' })
  @MaxLength(60)
  nome: string;
}

export class AtualizarCategoriaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Informe o nome da categoria' })
  @MaxLength(60)
  nome?: string;

  @ApiPropertyOptional({ description: 'false tira da lista ao lançar' })
  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}

export class CriarDespesaDto {
  @ApiProperty()
  @IsUUID('4', { message: 'Escolha a categoria' })
  categoriaId: string;

  @ApiPropertyOptional({
    example: 'Conserto do portão',
    description: 'Vazio = nome da categoria',
  })
  @IsOptional()
  @IsString()
  @MaxLength(130)
  descricao?: string;

  @ApiProperty({ example: 350000, description: 'Em centavos' })
  @IsInt({ message: 'Valor inválido' })
  @Min(1, { message: 'O valor precisa ser maior que zero' })
  @Max(VALOR_MAXIMO, { message: 'Valor alto demais' })
  valorCentavos: number;

  @ApiProperty({ example: '2026-03-05', description: 'Vencimento (o 1º)' })
  @Matches(DATA, { message: 'Vencimento inválido' })
  vencimento: string;

  @ApiPropertyOptional({
    example: 12,
    description: 'Repete todo mês por N meses (padrão 1). Ex.: o aluguel.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24, { message: 'No máximo 24 meses por lançamento' })
  meses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}

export class AtualizarDespesaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'Escolha a categoria' })
  categoriaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  descricao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'Valor inválido' })
  @Min(1, { message: 'O valor precisa ser maior que zero' })
  @Max(VALOR_MAXIMO, { message: 'Valor alto demais' })
  valorCentavos?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATA, { message: 'Vencimento inválido' })
  vencimento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}
