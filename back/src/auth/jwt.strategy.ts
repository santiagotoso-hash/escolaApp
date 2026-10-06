import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import type { UsuarioAutenticado } from '../common/usuario-autenticado';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * O papel é lido do banco a cada request (e não do token): assim, mudar o
   * papel ou desativar alguém vale na hora, sem esperar o token expirar.
   */
  async validate(payload: JwtPayload): Promise<UsuarioAutenticado> {
    const usuario = await this.usuarios.findOneBy({ id: payload.sub });
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Sessão inválida');
    }
    return { id: usuario.id, email: usuario.email, papel: usuario.papel };
  }
}
