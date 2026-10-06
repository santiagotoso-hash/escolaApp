import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Turno } from '../turma.entity';

export class CriarTurmaDto {
  @ApiProperty({ example: '5º Ano A' })
  @IsString()
  @MaxLength(60)
  nome: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  anoLetivo: number;

  @ApiPropertyOptional({ enum: Turno })
  @IsOptional()
  @IsEnum(Turno)
  turno?: Turno;

  @ApiPropertyOptional({ type: [String], description: 'IDs dos professores' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  professorIds?: string[];
}

export class AtualizarTurmaDto extends PartialType(CriarTurmaDto) {}
