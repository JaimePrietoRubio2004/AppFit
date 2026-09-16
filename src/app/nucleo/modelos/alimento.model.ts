export type UnidadOrigen = 'openfoodfacts' | 'manual';

export type TipoMedida = 'solido' | 'liquido';

export type OrigenAlimento = 'semilla' | 'openfoodfacts' | 'ocr' | 'manual';

export interface Alimento {
  id: number;
  codigoBarra: string | null;
  nombre: string;
  marca: string | null;

  kcal100g: number;
  proteina100g: number;
  grasas100g: number;
  carbohidrato100g: number;

  azucares100g: number;
  saturados100g: number;
  fibras100g: number;
  sal100g: number;

  nombreUnidad: string | null;
  gramosPorUnidad: number | null;
  unidadOrigen: UnidadOrigen | null;

  tipoMedida: TipoMedida;
  kcalAlcohol100: number | null;

  esEstivado: boolean;
  origen: OrigenAlimento;
  fechaCqahce: string | null;
}
