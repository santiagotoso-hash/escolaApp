import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UsuarioAutenticado } from '../usuario-autenticado';

export const UsuarioAtual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioAutenticado =>
    ctx.switchToHttp().getRequest().user,
);
