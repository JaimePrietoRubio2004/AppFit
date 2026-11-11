const TEXTO_LIMITE: Record<string, string> = {
  deficit_maximo: 'el déficit no puede superar el 25 % de tu gasto',
  suelo_absoluto: 'las calorías no bajan del mínimo diario',
  metabolismo_basal: 'las calorías no bajan de tu metabolismo basal',
  superavit_maximo: 'el superávit no puede superar el 15 % de tu gasto',
};

export function textoLimite(limite: string): string {
  return TEXTO_LIMITE[limite] ?? limite;
}
