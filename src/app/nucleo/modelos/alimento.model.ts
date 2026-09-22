export type UnidadOrigen = 'openfoodfacts' | 'manual';

export type TipoMedida = 'solido' | 'liquido';

export type OrigenAlimento = 'semilla' | 'openfoodfacts' | 'ocr' | 'manual';

export interface Alimento {
  id: number;
  codigoBarras: string | null;
  nombre: string;
  marca: string | null;

  kcal100g: number;
  proteina100g: number;
  grasa100g: number;
  carbohidrato100g: number;

  azucares100g: number;
  saturadas100g: number;
  fibra100g: number;
  sal100g: number;

  nombreUnidad: string | null;
  gramosPorUnidad: number | null;
  unidadOrigen: UnidadOrigen | null;

  tipoMedida: TipoMedida;
  kcalAlcohol100: number | null;

  esEstimado: boolean;
  origen: OrigenAlimento;
  fechaCache: string | null;
}
