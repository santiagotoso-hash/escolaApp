import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Comunicado } from './comunicado.entity';

/** Registro de que um responsável leu e confirmou um comunicado. */
@Entity('ciencias_comunicado')
@Unique(['comunicado', 'usuario'])
export class CienciaComunicado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Comunicado, (c) => c.ciencias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comunicado_id' })
  comunicado: Comunicado;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'confirmado_em' })
  confirmadoEm: Date;
}
