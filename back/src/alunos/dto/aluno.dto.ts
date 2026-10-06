import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CriarAlunoDto {
  @ApiProperty({ example: 'Lucas Souza' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome: string;

  @ApiPropertyOptional({ example: '2016-03-14' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de nascimento inválida' })
  dataNascimento?: string;

  @ApiPropertyOptional({ example: '2026-0042' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  matricula?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  turmaId?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs dos responsáveis' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  responsavelIds?: string[];
}

export class AtualizarAlunoDto extends PartialType(CriarAlunoDto) {}
