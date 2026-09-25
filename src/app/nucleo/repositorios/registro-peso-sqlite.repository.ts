import { inject, Service } from '@angular/core';
import { RegistroPeso } from '../modelos/registro-peso.model';
import {
  NuevoRegistroPeso,
  RegistroPesoRepository,
} from './registro-peso.repository';
import { BaseDatos } from '../base-datos/base-datos';

interface FilaRegistroPeso {
  id: number;
  perfil_id: number;
  fecha: string;
  peso_kg: number;
}

function filaARegistrarPeso(fila: FilaRegistroPeso): RegistroPeso {
  return {
    id: fila.id,
    perfilId: fila.perfil_id,
    fecha: fila.fecha,
    pesoKg: fila.peso_kg,
  };
}

@Service()
export class RegistroPesoSqlite implements RegistroPesoRepository {
  private readonly baseDatos = inject(BaseDatos);

  async crear(registro: NuevoRegistroPeso): Promise<RegistroPeso> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.run(
      'INSERT INTO registro_peso (perfil_id, fecha, peso_kg) VALUES (?,?,?)',
      [registro.perfilId, registro.fecha, registro.pesoKg],
      true,
      'no',
      false,
    );
    const id = resultado.changes?.lastId;
    if (id === undefined) {
      throw Error(
        'No se pudo obtener el id del registro de paso recien creado',
      );
    }
    return { ...registro, id };
  }
  async actualizar(registro: RegistroPeso): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    await db.run(
      'UPDATE registro_peso SET peso_kg = ? WHERE id = ?',
      [registro.pesoKg, registro.id],
      true,
      'no',
      false,
    );
  }
  async obtenerPorFecha(
    perfilId: number,
    fecha: String,
  ): Promise<RegistroPeso | null> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM registro_peso WHERE perfil_id = ? AND fecha = ?',
      [perfilId, fecha],
      false,
    );
    const fila = resultado.values?.[0] as FilaRegistroPeso | undefined;
    return fila ? filaARegistrarPeso(fila) : null;
  }
  async obtenerUltimo(perfilId: number): Promise<RegistroPeso | null> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM registro_peso WHERE perfil_id = ? ORDER BY fecha DESC LIMIT 1',
      [perfilId],
      false,
    );
    const fila = resultado.values?.[0] as FilaRegistroPeso | undefined;
    return fila ? filaARegistrarPeso(fila) : null;
  }
}
