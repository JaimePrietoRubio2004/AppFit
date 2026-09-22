import { inject, Inject, Service } from '@angular/core';
import { RegistroConsumo, TipoComida } from '../modelos/registro-consumo.model';
import {
  NuevoRegistroConsumo,
  RegistroConsumoRepository,
} from './registro-consumo.repository';
import { BaseDatos } from '../base-datos/base-datos';

interface FilaRegistroConsumo {
  id: number;
  perfil_id: number;
  fecha: string;
  tipo_comida: TipoComida;
  alimento_id: number;
  gramos: number;
  cantidad_introducida: number;
  unidad_introducida: string;
  kcal: number;
  proteina_g: number;
  grasa_g: number;
  carbohidrato_g: number;
  plantilla_id: number | null;
  creado_en: string;
}

function filaARegistroConsumo(fila: FilaRegistroConsumo): RegistroConsumo {
  return {
    id: fila.id,
    perfilId: fila.perfil_id,
    fecha: fila.fecha,
    tipoComida: fila.tipo_comida,
    alimentoId: fila.alimento_id,
    gramos: fila.gramos,
    cantidadIntroducida: fila.cantidad_introducida,
    unidadIntroducida: fila.unidad_introducida,
    kcal: fila.kcal,
    proteinaG: fila.proteina_g,
    grasaG: fila.grasa_g,
    carboHidratoG: fila.carbohidrato_g,
    plantillaId: fila.plantilla_id,
    creadoEn: fila.creado_en,
  };
}

@Service()
export class RegistroConsumoSqlite implements RegistroConsumoRepository {
  private readonly baseDatos = inject(BaseDatos);
  async guardar(registro: NuevoRegistroConsumo): Promise<RegistroConsumo> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.run(
      `INSERT INTO registro_consumo
        (perfil_id, fecha, tipo_comida, alimento_id, gramos, cantidad_introducida, unidad_introducida,
         kcal, proteina_g, grasa_g, carbohidrato_g, plantilla_id, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.perfilId,
        registro.fecha,
        registro.tipoComida,
        registro.alimentoId,
        registro.gramos,
        registro.cantidadIntroducida,
        registro.unidadIntroducida,
        registro.kcal,
        registro.proteinaG,
        registro.grasaG,
        registro.carboHidratoG,
        registro.plantillaId,
        registro.creadoEn,
      ],
      true,
      'no',
      false,
    );
    const id = resultado.changes?.lastId;
    if (id === undefined) {
      throw new Error(
        'No se pudo obtener el id del registro de consumo recien creado',
      );
    }
    return { ...registro, id };
  }
  async obtenerPorDia(
    perfilId: number,
    fecha: string,
  ): Promise<RegistroConsumo[]> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM registro_consumo  WHERE perfil_id = ? AND  fecha = ? ORDER BY creado_en',
      [perfilId, fecha],
      false,
    );
    return ((resultado.values ?? []) as FilaRegistroConsumo[]).map(
      filaARegistroConsumo,
    );
  }

  async obtenerRango(
    perfilId: number,
    desde: string,
    hasta: string,
  ): Promise<RegistroConsumo[]> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM registro_consumo  WHERE perfil_id = ? AND  fecha BETWEEN ? AND ? ORDER BY fecha, creado_en',
      [perfilId, desde, hasta],
      false,
    );
    return ((resultado.values ?? []) as FilaRegistroConsumo[]).map(
      filaARegistroConsumo,
    );
  }
  async eliminar(id: number): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    await db.run(
      'DELETE FROM registro_consumo WHERE  id = ?',
      [id],
      true,
      'no',
      false,
    );
  }
}
