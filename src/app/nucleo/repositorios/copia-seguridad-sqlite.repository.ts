import { inject, Service } from '@angular/core';
import { CopiaSeguridadRepository } from './copia-seguridad.repository';
import {
  CopiaSeguridad,
  FilaCopia,
  TABLAS_COPIA,
  VERSION_COPIA,
} from '../modelos/copia-seguridad.model';
import { BaseDatos } from '../base-datos/base-datos';

@Service()
export class CopiaSeguridadSqlite implements CopiaSeguridadRepository {
  private readonly baseDatos = inject(BaseDatos);

  async exportar(): Promise<CopiaSeguridad> {
    const db = await this.baseDatos.obtenerConexion();
    const tablas: Record<string, FilaCopia[]> = {};
    for (const tabla of TABLAS_COPIA) {
      const resultado = await db.query(`SELECT * FROM ${tabla}`, [], false);
      tablas[tabla] = (resultado.values ?? []) as FilaCopia[];
    }
    return {
      app: 'appfit',
      version: VERSION_COPIA,
      exportadoEn: new Date().toISOString(),
      tablas,
    };
  }
  async importar(copia: CopiaSeguridad): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    const sentencias: {
      statement: string;
      values: (string | number | null)[];
    }[] = [];
    for (const tabla of [...TABLAS_COPIA].reverse()) {
      sentencias.push({ statement: `DELETE FROM ${tabla}`, values: [] });
    }
    for (const tabla of TABLAS_COPIA) {
      for (const fila of copia.tablas[tabla]) {
        const columnas = Object.keys(fila);
        sentencias.push({
          statement: `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`,
          values: columnas.map((columna) => fila[columna]),
        });
      }
    }
    await db.executeSet(sentencias, true, 'no', false);
  }
}
