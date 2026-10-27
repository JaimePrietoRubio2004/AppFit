export type NivelEstimacion = 'fiable' | 'tendencia' | 'orienta';

export interface LecturaEstimacion {
  nivel: NivelEstimacion;
  texto: string;
}

export function lecturaEstimacion(porcentaje: number): LecturaEstimacion {
  if (porcentaje < 20) {
    return {
      nivel: 'fiable',
      texto:
        'La media es fiable. Si no ves progreso, puedes ajustar las calorías.',
    };
  }
  if (porcentaje <= 50) {
    return {
      nivel: 'tendencia',
      texto: 'Fiable en tendencia. Contrasta varias semanas antes de decidir.',
    };
  }
  return {
    nivel: 'orienta',
    texto:
      'Orienta, pero no mide. Antes de tocar el objetivo, mejora el registro.',
  };
}
