import { SetMetadata } from '@nestjs/common';

export const PUBLICO_KEY = 'publico';
/** Libera a rota do JWT (o guard global exige login em todo o resto). */
export const Publico = () => SetMetadata(PUBLICO_KEY, true);
