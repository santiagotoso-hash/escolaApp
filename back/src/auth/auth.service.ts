import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { EntrarDto } from './dto/entrar.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly jwt: JwtService,
  ) {}

  async entrar({ email, senha }: EntrarDto) {
    const usuario = await this.usuarios
      .createQueryBuilder('u')
      .addSelect('u.senhaHash')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .getOne();

    // Mesma mensagem para e-mail inexistente e senha errada: não revela
    // quais e-mails estão cadastrados.
    const ok = usuario && (await bcrypt.compare(senha, usuario.senhaHash));
    if (!usuario || !ok) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }
    if (!usuario.ativo) {
      throw new UnauthorizedException(
        'Sua conta está desativada. Fale com a secretaria da escola.',
      );
    }

    const token = await this.jwt.signAsync({ sub: usuario.id });
    const { senhaHash: _, ...dados } = usuario;
    return { token, usuario: dados };
  }
}
