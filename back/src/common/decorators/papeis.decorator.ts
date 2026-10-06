import { SetMetadata } from '@nestjs/common';
import { Papel } from '../enums/papel.enum';

export const PAPEIS_KEY = 'papeis';
export const Papeis = (...papeis: Papel[]) => SetMetadata(PAPEIS_KEY, papeis);
