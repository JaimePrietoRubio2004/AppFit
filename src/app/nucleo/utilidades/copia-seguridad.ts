import {
  CopiaSeguridad,
  TABLAS_COPIA,
  VERSION_COPIA,
} from '../modelos/copia-seguridad.model';

const NOMBRE_COLUMNA = /^[a-z][a-z0-9_]*$/;

export function validarCopia(datos: unknown): CopiaSeguridad {
  if (typeof datos !== 'object' || datos === null) {
    throw new Error('El archivo no es una copia de seguridad de AppFit.');
  }
  const copia = datos as Partial<CopiaSeguridad>;
  if (copia.app !== 'appfit') {
    throw new Error('El archivo no es una copia de seguridad de AppFit.');
  }
  if (typeof copia.version !== 'number' || copia.version < 1) {
    throw new Error('La versión de la copia no es válida.');
  }
  if (copia.version > VERSION_COPIA) {
    throw new Error(
      'La copia es de una versión más nueva de la app. Actualiza AppFit antes de importarla.',
    );
  }
  if (typeof copia.tablas !== 'object' || copia.tablas === null) {
    throw new Error('La copia no contiene datos.');
  }
  for (const tabla of TABLAS_COPIA) {
    const filas = copia.tablas[tabla];
    if (!Array.isArray(filas)) {
      throw new Error(`Falta la tabla «${tabla}» en la copia.`);
    }
    for (const fila of filas) {
      if (typeof fila !== 'object' || fila === null || Array.isArray(fila)) {
        throw new Error(`Hay una fila no válida en «${tabla}».`);
      }
      for (const [columna, valor] of Object.entries(fila)) {
        if (!NOMBRE_COLUMNA.test(columna)) {
          throw new Error(`Columna no válida «${columna}» en «${tabla}».`);
        }
        if (
          valor !== null &&
          typeof valor !== 'string' &&
          typeof valor !== 'number'
        ) {
          throw new Error(`Valor no válido en «${tabla}.${columna}».`);
        }
      }
    }
  }
  return copia as CopiaSeguridad;
}
