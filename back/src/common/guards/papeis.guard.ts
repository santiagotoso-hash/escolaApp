import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PAPEIS_KEY } from '../decorators/papeis.decorator';
import { Papel, PAPEIS_RESTRITOS } from '../enums/papel.enum';

@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const papeis = this.reflector.getAllAndOverride<Papel[]>(PAPEIS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const { user } = context.switchToHttp().getRequest();
    // Papel restrito: só passa onde a rota o cita, mesmo sem @Papeis.
    if (user && PAPEIS_RESTRITOS.includes(user.papel)) {
      return !!papeis?.includes(user.papel);
    }
    if (!papeis?.length) return true;
    return !!user && papeis.includes(user.papel);
  }
}
