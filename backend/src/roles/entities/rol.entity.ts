import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RolEnum } from '../../common/enums';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    unique: true,
  })
  nombre: RolEnum;

  @Column('text')
  descripcion: string;
}

