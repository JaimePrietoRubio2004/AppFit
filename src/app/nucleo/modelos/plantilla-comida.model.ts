import { TipoComida } from './registro-consumo.model';

export interface PlantillaComidaLinea {
  alimentoId: number;
  cantidad: number;
  unidad: string;
}

export interface PlantillaComida {
  id: number;
  perfilId: number;
  nombre: string;
  tipoComidaSugerido: TipoComida;
  vecesUsada: number;
  lineas: PlantillaComidaLinea[];
}
