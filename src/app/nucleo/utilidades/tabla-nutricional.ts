export interface LineaOcr {
  texto: string;
  izquierda: number;
  derecha: number;
  arriba: number;
  abajo: number;
}

export interface TablaNutricional {
  kcal100g: number | null;
  proteina100g: number | null;
  grasa100g: number | null;
  carbohidrato100g: number | null;
  azucares100g: number | null;
  saturadas100g: number | null;
  fibra100g: number | null;
  sal100g: number | null;
}

interface Valor {
  numero: number;
  unidad: string | null;
  x: number;
}

type Campo = keyof TablaNutricional;

const ETIQUETAS: { campo: Campo; patron: RegExp }[] = [
  { campo: 'saturadas100g', patron: /(?<!in)saturad/ },
  { campo: 'azucares100g', patron: /azucar/ },
  {
    campo: 'carbohidrato100g',
    patron: /hidratos?\s+de\s+carbono|carbohidrato/,
  },
  { campo: 'fibra100g', patron: /fibra/ },
  { campo: 'proteina100g', patron: /proteina/ },
  { campo: 'sal100g', patron: /\bsal\b/ },
  { campo: 'kcal100g', patron: /energ/ },
  { campo: 'grasa100g', patron: /\bgrasas?\b/ },
];

const LIMITE: Record<Campo, number> = {
  kcal100g: 900,
  proteina100g: 100,
  grasa100g: 100,
  carbohidrato100g: 100,
  azucares100g: 100,
  saturadas100g: 100,
  fibra100g: 100,
  sal100g: 100,
};

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function extraerValores(linea: LineaOcr, desde: number): Valor[] {
  const texto = normalizar(linea.texto);
  const ancho = Math.max(texto.length, 1);
  const valores: Valor[] = [];
  const patron = /(\d+(?:[.,]\d+)?)\s*(kj|kcal|mg|g)?\b/g;
  patron.lastIndex = desde;
  let coincidencia: RegExpExecArray | null;
  while ((coincidencia = patron.exec(texto)) !== null) {
    let bruto = coincidencia[1];
    const unidad = coincidencia[2] ?? null;
    if (
      (unidad === 'kj' || unidad === 'kcal') &&
      /^\d{1,3}\.\d{3}$/.test(bruto)
    ) {
      bruto = bruto.replace('.', '');
    }
    const numero = Number(bruto.replace(',', '.'));
    if (!Number.isFinite(numero)) {
      continue;
    }
    const posicion = (coincidencia.index + coincidencia[0].length / 2) / ancho;
    valores.push({
      numero,
      unidad,
      x: linea.izquierda + posicion * (linea.derecha - linea.izquierda),
    });
  }
  return valores;
}

function centroY(linea: LineaOcr): number {
  return (linea.arriba + linea.abajo) / 2;
}

function posicionesCabecera(lineas: LineaOcr[], patron: RegExp): number[] {
  const posiciones: number[] = [];
  for (const linea of lineas) {
    const texto = normalizar(linea.texto);
    const ancho = Math.max(texto.length, 1);
    const coincidencia = patron.exec(texto);
    if (coincidencia) {
      const posicion =
        (coincidencia.index + coincidencia[0].length / 2) / ancho;
      posiciones.push(
        linea.izquierda + posicion * (linea.derecha - linea.izquierda),
      );
    }
  }
  return posiciones;
}

function convertir(campo: Campo, valor: Valor): number | null {
  if (campo === 'kcal100g') {
    if (valor.unidad === 'kcal') {
      return valor.numero;
    }
    if (valor.unidad === 'kj') {
      return Math.round(valor.numero / 4.184);
    }
    return null;
  }
  if (valor.unidad === 'kj' || valor.unidad === 'kcal') {
    return null;
  }
  return valor.unidad === 'mg' ? valor.numero / 1000 : valor.numero;
}

export function interpretarTabla(lineas: LineaOcr[]): TablaNutricional {
  const resultado: TablaNutricional = {
    kcal100g: null,
    proteina100g: null,
    grasa100g: null,
    carbohidrato100g: null,
    azucares100g: null,
    saturadas100g: null,
    fibra100g: null,
    sal100g: null,
  };

  const x100 = posicionesCabecera(lineas, /100\s?(?:g|ml)\b/);
  const xRacion = posicionesCabecera(lineas, /racion|porcion/);
  const referencia100 = x100.length > 0 ? Math.min(...x100) : null;
  const referenciaRacion = xRacion.length > 0 ? Math.min(...xRacion) : null;

  for (const etiqueta of ETIQUETAS) {
    if (resultado[etiqueta.campo] !== null) {
      continue;
    }
    for (const linea of lineas) {
      const texto = normalizar(linea.texto);
      const coincidencia = etiqueta.patron.exec(texto);
      if (!coincidencia) {
        continue;
      }
      if (
        etiqueta.campo === 'grasa100g' &&
        /(?<!in)saturad|insaturad/.test(texto)
      ) {
        continue;
      }
      const alto = Math.max(linea.abajo - linea.arriba, 1);
      const fila = [
        ...extraerValores(linea, coincidencia.index + coincidencia[0].length),
        ...lineas
          .filter(
            (otra) =>
              otra !== linea &&
              otra.izquierda >= linea.derecha - alto &&
              Math.abs(centroY(otra) - centroY(linea)) <= alto * 0.6,
          )
          .flatMap((otra) => extraerValores(otra, 0)),
      ]
        .map((valor) => ({
          valor,
          convertido: convertir(etiqueta.campo, valor),
        }))
        .filter((par) => par.convertido !== null);
      if (fila.length === 0) {
        continue;
      }
      let elegido = fila[0];
      if (fila.length > 1) {
        if (referencia100 !== null) {
          elegido = fila.reduce((mejor, par) =>
            Math.abs(par.valor.x - referencia100) <
            Math.abs(mejor.valor.x - referencia100)
              ? par
              : mejor,
          );
        } else if (referenciaRacion !== null) {
          elegido = fila.reduce((mejor, par) =>
            Math.abs(par.valor.x - referenciaRacion) >
            Math.abs(mejor.valor.x - referenciaRacion)
              ? par
              : mejor,
          );
        }
      }
      const numero = elegido.convertido as number;
      if (numero >= 0 && numero <= LIMITE[etiqueta.campo]) {
        resultado[etiqueta.campo] = Math.round(numero * 100) / 100;
        break;
      }
    }
  }

  if (
    resultado.saturadas100g !== null &&
    resultado.grasa100g !== null &&
    resultado.saturadas100g > resultado.grasa100g
  ) {
    resultado.saturadas100g = null;
  }
  if (
    resultado.azucares100g !== null &&
    resultado.carbohidrato100g !== null &&
    resultado.azucares100g > resultado.carbohidrato100g
  ) {
    resultado.azucares100g = null;
  }
  return resultado;
}
