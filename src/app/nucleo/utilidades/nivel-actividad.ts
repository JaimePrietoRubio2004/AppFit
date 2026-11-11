import { NivelActividad } from '../modelos/perfil.model';

export interface OpcionActividad {
  valor: NivelActividad;
  nombre: string;
  descripcion: string;
}

export const NIVELES_ACTIVIDAD: OpcionActividad[] = [
  {
    valor: 'sedentario',
    nombre: 'Sedentario',
    descripcion: 'Trabajo sentado y casi nada de ejercicio.',
  },
  {
    valor: 'ligero',
    nombre: 'Ligero',
    descripcion: 'Ejercicio suave o caminar, de 1 a 3 días por semana.',
  },
  {
    valor: 'moderado',
    nombre: 'Moderado',
    descripcion: 'Entrenas de 3 a 5 días por semana.',
  },
  {
    valor: 'alto',
    nombre: 'Alto',
    descripcion: 'Entrenas casi todos los días (6 o 7), o tu trabajo es físico.',
  },
  {
    valor: 'muy_alto',
    nombre: 'Muy alto',
    descripcion: 'Entrenamiento intenso a diario, o trabajo físico muy duro.',
  },
];
