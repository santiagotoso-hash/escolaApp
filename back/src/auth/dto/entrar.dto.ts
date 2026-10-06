import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class EntrarDto {
  @ApiProperty({ example: 'diretora@escola.com.br' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(6, { message: 'A senha tem pelo menos 6 caracteres' })
  senha: string;
}
