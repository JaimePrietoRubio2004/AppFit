const DENSIDAD_ETANOL_G_ML = 0.789;
const KCAL_POR_G_ETANOL = 7;

// kcal de alcohol por 100 ml y por cada 1 % vol (≈ 5,52)
export const KCAL_ALCOHOL_POR_GRADO = DENSIDAD_ETANOL_G_ML * KCAL_POR_G_ETANOL;

export function kcalAlcoholDesdeGrados(grados: number): number {
  return grados * KCAL_ALCOHOL_POR_GRADO;
}

export function gradosDesdeKcalAlcohol(kcalAlcohol100: number): number {
  return Math.round((kcalAlcohol100 / KCAL_ALCOHOL_POR_GRADO) * 10) / 10;
}
