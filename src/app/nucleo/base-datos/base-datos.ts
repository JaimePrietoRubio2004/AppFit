import { Service } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';

const NOMBRE_DB = 'appfit';
const VERSION_ESQUEMA = 1;

const ESQUEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS perfil (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  color_avatar TEXT NOT NULL,
  es_ultimo_usado INTEGER NOT NULL DEFAULT 0,
  sexo TEXT NOT NULL CHECK (sexo IN ('hombre', 'mujer')),
  fecha_nacimiento TEXT NOT NULL,
  altura_cm INTEGER NOT NULL,
  nivel_actividad TEXT NOT NULL CHECK (nivel_actividad IN ('sedentario', 'ligero', 'moderado', 'alto', 'muy_alto')),
  objetivo TEXT NOT NULL CHECK (objetivo IN ('ganar_masa', 'perder_grasa', 'recomposicion')),
  ritmo_semanal_kg REAL NOT NULL,
  fecha_alta TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alimento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_barras TEXT,
  nombre TEXT NOT NULL,
  marca TEXT,
  kcal_100g REAL NOT NULL,
  proteina_100g REAL NOT NULL,
  grasa_100g REAL NOT NULL,
  carbohidrato_100g REAL NOT NULL,
  azucares_100g REAL NOT NULL,
  saturadas_100g REAL NOT NULL,
  fibra_100g REAL NOT NULL,
  sal_100g REAL NOT NULL,
  nombre_unidad TEXT,
  gramos_por_unidad REAL,
  unidad_origen TEXT CHECK (unidad_origen IN ('openfoodfacts', 'manual')),
  tipo_medida TEXT NOT NULL CHECK (tipo_medida IN ('solido', 'liquido')),
  kcal_alcohol_100 REAL,
  es_estimado INTEGER NOT NULL DEFAULT 0,
  origen TEXT NOT NULL CHECK (origen IN ('semilla', 'openfoodfacts', 'ocr', 'manual')),
  fecha_cache TEXT
);

CREATE TABLE IF NOT EXISTS registro_consumo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  perfil_id INTEGER NOT NULL REFERENCES perfil(id),
  fecha TEXT NOT NULL,
  tipo_comida TEXT NOT NULL CHECK (tipo_comida IN ('desayuno', 'almuerzo', 'comida', 'merienda', 'cena', 'otro')),
  alimento_id INTEGER NOT NULL REFERENCES alimento(id),
  gramos REAL NOT NULL,
  cantidad_introducida REAL NOT NULL,
  unidad_introducida TEXT NOT NULL,
  kcal REAL NOT NULL,
  proteina_g REAL NOT NULL,
  grasa_g REAL NOT NULL,
  carbohidrato_g REAL NOT NULL,
  plantilla_id INTEGER,
  creado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_registro_consumo_perfil_fecha ON registro_consumo (perfil_id, fecha);
`;

@Service()
export class BaseDatos {
  private readonly sqlite = new SQLiteConnection(CapacitorSQLite);
  private conexionPromesa: Promise<SQLiteDBConnection> | null = null;
  private webListo: Promise<void> | null = null;
  private noEncriptado: string = 'no-encryption';

  obtenerConexion(): Promise<SQLiteDBConnection> {
    if (!this.conexionPromesa) {
      this.conexionPromesa = this.crearConexion();
    }
    return this.conexionPromesa;
  }

  private async crearConexion(): Promise<SQLiteDBConnection> {
    if (Capacitor.getPlatform() === 'web') {
      await this.asegurarWebStore();
    }
    const yaAbierta = (await this.sqlite.isConnection(NOMBRE_DB, false)).result;
    const conexion = yaAbierta
      ? await this.sqlite.retrieveConnection(NOMBRE_DB, false)
      : await this.sqlite.createConnection(
          NOMBRE_DB,
          false,
          this.noEncriptado,
          VERSION_ESQUEMA,
          false,
        );
    await conexion.open();
    await conexion.execute(ESQUEMA, true, false);
    return conexion;
  }

  private asegurarWebStore(): Promise<void> {
    if (!this.webListo) {
      this.webListo = customElements
        .whenDefined('jeep-sqlite')
        .then(() => this.sqlite.initWebStore());
    }
    return this.webListo;
  }
}
