import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PAPEIS_KEY } from '../decorators/papeis.decorator';
import { Papel } from '../enums/papel.enum';

@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const papeis = this.reflector.getAllAndOverride<Papel[]>(PAPEIS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!papeis?.length) return true;
    const { user } = context.switchToHttp().getRequest();
    return !!user && papeis.includes(user.papel);
  }
}
