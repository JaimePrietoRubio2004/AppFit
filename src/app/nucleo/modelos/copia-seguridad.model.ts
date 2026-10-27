export const VERSION_COPIA = 1;

export const TABLAS_COPIA = [
  'perfil',
  'alimento',
  'registro_consumo',
  'registro_peso',
  'perfil_alimento',
  'plantilla_comida',
  'plantilla_comida_linea',
] as const;

export type FilaCopia = Record<string, string | number | null>;

export interface CopiaSeguridad {
  app: 'appfit';
  version: number;
  exportadoEn: string;
  tablas: Record<string, FilaCopia[]>;
}
