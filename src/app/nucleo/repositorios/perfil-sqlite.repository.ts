import { inject, Service } from '@angular/core';
import { Perfil } from '../modelos/perfil.model';
import { NuevoPerfil, PerfilRepository } from './perfil.repository';
import { BaseDatos } from '../base-datos/base-datos';
import { PerfilActual } from '../servicios/perfil-actual';

interface FilaPerfil {
  id: number;
  nombre: string;
  color_avatar: string;
  es_ultimo_usado: number;
  sexo: Perfil['sexo'];
  fecha_nacimiento: string;
  altura_cm: number;
  nivel_actividad: Perfil['nivelActividad'];
  objetivo: Perfil['objetivo'];
  ritmo_semanal_kg: number;
  fecha_alta: string;
}

function filaAPerfil(fila: FilaPerfil): Perfil {
  return {
    id: fila.id,
    nombre: fila.nombre,
    colorAvatar: fila.color_avatar,
    esUltimoUsado: fila.es_ultimo_usado === 1,
    sexo: fila.sexo,
    fechaNacimiento: fila.fecha_nacimiento,
    alturaCm: fila.altura_cm,
    nivelActividad: fila.nivel_actividad,
    objetivo: fila.objetivo,
    ritmoSemanalKg: fila.ritmo_semanal_kg,
    fechaAlta: fila.fecha_alta,
  };
}

@Service()
export class PerfilSqlite implements PerfilRepository {
  private readonly baseDatos = inject(BaseDatos);

  async crear(perfil: NuevoPerfil): Promise<Perfil> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.run(
      `INSERT INTO perfil
        (nombre, color_avatar, es_ultimo_usado, sexo, fecha_nacimiento, altura_cm, nivel_actividad, objetivo, ritmo_semanal_kg, fecha_alta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        perfil.nombre,
        perfil.colorAvatar,
        perfil.esUltimoUsado ? 1 : 0,
        perfil.sexo,
        perfil.fechaNacimiento,
        perfil.alturaCm,
        perfil.nivelActividad,
        perfil.objetivo,
        perfil.ritmoSemanalKg,
        perfil.fechaAlta,
      ],
    );
    const id = resultado.changes?.lastId;
    if (id === undefined) {
      throw new Error('No se pudo obtener el id del perfil recien creado');
    }
    return { ...perfil, id };
  }

  async actualizar(perfil: Perfil): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    await db.run(
      `UPDATE perfil SET
        nombre = ?, color_avatar = ?, es_ultimo_usado = ?, sexo = ?, fecha_nacimiento = ?,
        altura_cm = ?, nivel_actividad = ?, objetivo = ?, ritmo_semanal_kg = ?, fecha_alta = ?
       WHERE id = ?`,
      [
        perfil.nombre,
        perfil.colorAvatar,
        perfil.esUltimoUsado ? 1 : 0,
        perfil.sexo,
        perfil.fechaNacimiento,
        perfil.alturaCm,
        perfil.nivelActividad,
        perfil.objetivo,
        perfil.ritmoSemanalKg,
        perfil.fechaAlta,
        perfil.id,
      ],
      true,
      'no',
      false,
    );
  }
  async eliminar(id: number): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    await db.run('DELETE FROM perfil WHERE id = ?', [id], true, 'no', false);
  }

  async obtenerPorId(id: number): Promise<Perfil | null> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM perfil WHERE id = ?',
      [id],
      false,
    );
    const fila = resultado.values?.[0] as FilaPerfil | undefined;
    return fila ? filaAPerfil(fila) : null;
  }

  async obtenerUltimoUsado(): Promise<Perfil | null> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM perfil WHERE es_ultimo_usado = 1 LIMIT 1',
      [],
      false,
    );
    const fila = resultado.values?.[0] as FilaPerfil | undefined;
    return fila ? filaAPerfil(fila) : null;
  }

  async listar(): Promise<Perfil[]> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM perfil ORDER BY nombre',
      [],
      false,
    );
    return ((resultado.values ?? []) as FilaPerfil[]).map(filaAPerfil);
  }

  async marcarComoUltimoUsado(id: number): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    await db.run(
      'UPDATE perfil SET es_ultimo_usado = CASE WHEN id = ? THEN 1 ELSE 0 END',
      [id],
      true,
      'no',
      false,
    );
  }
}
