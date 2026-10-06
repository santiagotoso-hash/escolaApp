import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class EnviarMensagemDto {
  @ApiProperty({ example: 'Bom dia! O Lucas vai sair mais cedo hoje.' })
  @IsString()
  @MinLength(1, { message: 'Escreva uma mensagem' })
  @MaxLength(4000)
  texto: string;
}

export class IniciarConversaDto extends EnviarMensagemDto {
  @ApiProperty()
  @IsUUID('4')
  alunoId: string;

  @ApiProperty({ example: 'Saída antecipada' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  assunto: string;

  @ApiPropertyOptional({
    description:
      'Obrigatório quando quem inicia é a escola: para qual responsável do aluno',
  })
  @IsOptional()
  @IsUUID('4')
  responsavelId?: string;
}
