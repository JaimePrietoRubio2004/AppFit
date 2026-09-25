export type Sexo = 'hombre' | 'mujer';

export type NivelActividad =
  'sedentario' | 'ligero' | 'moderado' | 'alto' | 'muy_alto';

export type ObjetivoCorporal = 'ganar_masa' | 'perder_grasa' | 'recomposicion';

export interface Perfil {
  id: number;
  nombre: string;
  colorAvatar: string;
  esUltimoUsado: boolean;
  sexo: Sexo;
  fechaNacimiento: string;
  alturaCm: number;
  nivelActividad: NivelActividad;
  objetivo: ObjetivoCorporal;
  ritmoSemanalKg: number;
  fechaAlta: string;
}
