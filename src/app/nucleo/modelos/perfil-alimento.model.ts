export interface PerfilAlimento {
  perfilId: number;
  alimentoId: number;
  esFavorito: boolean;
  vecesUsado: number;
  ultimaCantidad: number | null;
  ultimaUnidad: string | null;
}
