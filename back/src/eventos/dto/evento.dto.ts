import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TipoEvento } from '../evento.entity';

export class CriarEventoDto {
  @ApiProperty({ example: 'Festa Junina' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  titulo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ enum: TipoEvento })
  @IsOptional()
  @IsEnum(TipoEvento)
  tipo?: TipoEvento;

  @ApiProperty({ example: '2026-06-20T14:00:00-03:00' })
  @IsDateString({}, { message: 'Data de início inválida' })
  inicio: string;

  @ApiPropertyOptional({ example: '2026-06-20T18:00:00-03:00' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de término inválida' })
  fim?: string;

  @ApiPropertyOptional({ example: 'Quadra da escola' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  local?: string;

  @ApiPropertyOptional({ description: 'Vazio = escola inteira' })
  @IsOptional()
  @IsUUID('4')
  turmaId?: string;
}
