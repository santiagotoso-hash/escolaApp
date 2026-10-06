import { Papel } from './enums/papel.enum';

/** O que vai no JWT e chega em cada request autenticada. */
export interface UsuarioAutenticado {
  id: string;
  email: string;
  papel: Papel;
}
