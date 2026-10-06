import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CategoriaComunicado } from '../comunicado.entity';

export class CriarComunicadoDto {
  @ApiProperty({ example: 'Reunião de pais do 1º bimestre' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  titulo: string;

  @ApiProperty({ example: 'Convidamos as famílias para a reunião...' })
  @IsString()
  @MinLength(3)
  conteudo: string;

  @ApiPropertyOptional({ enum: CategoriaComunicado })
  @IsOptional()
  @IsEnum(CategoriaComunicado)
  categoria?: CategoriaComunicado;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  exigeCiencia?: boolean;

  @ApiPropertyOptional({
    description: 'Vazio = escola inteira (só a direção pode)',
  })
  @IsOptional()
  @IsUUID('4')
  turmaId?: string;
}
