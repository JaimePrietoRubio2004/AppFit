import { ObjetivoCorporal } from '../modelos/perfil.model';

const ETIQUETA_OBJETIVO: Record<ObjetivoCorporal, string> = {
  ganar_masa: 'Ganar masa',
  perder_grasa: 'Perder grasa',
  recomposicion: 'Recomposición',
};

export function etiquetaObjetivo(objetivo: ObjetivoCorporal): string {
  return ETIQUETA_OBJETIVO[objetivo];
}
