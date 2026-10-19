import { RegistroConsumo, TipoComida } from '../modelos/registro-consumo.model';

export const ORDEN_COMIDAS: TipoComida[] = [
  'desayuno',
  'almuerzo',
  'comida',
  'merienda',
  'cena',
  'otro',
];

export interface GrupoComida {
  tipo: TipoComida;
  registros: RegistroConsumo[];
}

export function agruparPorComida(registro: RegistroConsumo[]): GrupoComida[] {
  return ORDEN_COMIDAS.map((tipo) => ({
    tipo,
    registros: registro.filter((registro) => registro.tipoComida === tipo),
  })).filter((grupo) => grupo.registros.length > 0);
}

export function etiquetaComida(tipo: TipoComida): string {
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}
