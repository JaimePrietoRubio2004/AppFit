export type TipoComida =
  'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena' | 'otro';

export interface RegistroConsumo {
  id: number;
  perfilId: number;
  fecha: string;
  tipoComida: TipoComida;
  alimentoId: number;

  gramos: number;
  cantidadIntroducida: number;
  unidadIntroducida: string;

  kcal: number;
  proteinasG: number;
  grasasG: number;
  carboHidratosG: number;

  plantillaId: number | null;
  creadoEn: string;
}
