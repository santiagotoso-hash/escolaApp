import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FormaPagamento, TipoCobranca } from '../cobranca.entity';

const DATA = /^\d{4}-\d{2}-\d{2}$/;
/** R$ 1.000.000,00: acima disso é erro de digitação. */
const VALOR_MAXIMO = 100_000_000;

export class CriarCobrancaDto {
  @ApiPropertyOptional({ description: 'Cobrança de um aluno' })
  @IsOptional()
  @IsUUID('4')
  alunoId?: string;

  @ApiPropertyOptional({ description: 'Ou a mesma cobrança para a turma toda' })
  @IsOptional()
  @IsUUID('4')
  turmaId?: string;

  @ApiProperty({ enum: TipoCobranca })
  @IsEnum(TipoCobranca, { message: 'Escolha o tipo da cobrança' })
  tipo: TipoCobranca;

  @ApiPropertyOptional({
    example: 'Camiseta tam. 10',
    description: 'Vazio = nome do tipo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(130)
  descricao?: string;

  @ApiProperty({
    example: 85000,
    description: 'Valor de cada parcela, em centavos',
  })
  @IsInt({ message: 'Valor inválido' })
  @Min(1, { message: 'O valor precisa ser maior que zero' })
  @Max(VALOR_MAXIMO, { message: 'Valor alto demais' })
  valorCentavos: number;

  @ApiProperty({
    example: '2026-03-10',
    description: 'Vencimento da 1ª parcela',
  })
  @Matches(DATA, { message: 'Vencimento inválido' })
  vencimento: string;

  @ApiPropertyOptional({
    example: 12,
    description: 'Parcelas mensais (padrão 1). Ex.: 12 mensalidades.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24, { message: 'No máximo 24 parcelas por lançamento' })
  parcelas?: number;

  @ApiPropertyOptional({ description: 'Anotação interna (a família não vê)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}

export class AtualizarCobrancaDto {
  @ApiPropertyOptional({ enum: TipoCobranca })
  @IsOptional()
  @IsEnum(TipoCobranca)
  tipo?: TipoCobranca;

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

  @ApiPropertyOptional({ description: 'true cancela; false reativa' })
  @IsOptional()
  @IsBoolean()
  cancelada?: boolean;
}

export class RegistrarPagamentoDto {
  @ApiProperty({
    example: '2026-03-08',
    description: 'Dia em que a escola recebeu',
  })
  @Matches(DATA, { message: 'Data do pagamento inválida' })
  pagoEm: string;

  @ApiProperty({ enum: FormaPagamento })
  @IsEnum(FormaPagamento, { message: 'Escolha a forma de pagamento' })
  formaPagamento: FormaPagamento;
}
