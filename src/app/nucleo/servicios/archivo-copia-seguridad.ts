import { inject, Service } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { CopiaSeguridad } from '../modelos/copia-seguridad.model';
import { COPIA_SEGURIDAD_REPOSITORY } from '../repositorios/copia-seguridad.repository';
import { validarCopia } from '../utilidades/copia-seguridad';
import { fechaLocal } from '../utilidades/fecha';

export type ResultadoExportacion =
  | { estado: 'ok' }
  | { estado: 'cancelado' }
  | { estado: 'error'; mensaje: string };

@Service()
export class ArchivoCopiaSeguridad {
  private readonly repositorio = inject(COPIA_SEGURIDAD_REPOSITORY);

  async exportar(): Promise<ResultadoExportacion> {
    try {
      const copia = await this.repositorio.exportar();
      const contenido = JSON.stringify(copia);
      const nombre = `appfit-copia-${fechaLocal()}.json`;
      if (!Capacitor.isNativePlatform()) {
        this.descargar(nombre, contenido);
        return { estado: 'ok' };
      }
      const escrito = await Filesystem.writeFile({
        path: nombre,
        data: contenido,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({
        title: 'Copia de seguridad AppFit',
        dialogTitle: 'Guardar copia de seguridad',
        files: [escrito.uri],
      });
      return { estado: 'ok' };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      if (/cancel/i.test(mensaje)) {
        return { estado: 'cancelado' };
      }
      return { estado: 'error', mensaje };
    }
  }

  async leer(archivo: File): Promise<CopiaSeguridad> {
    const texto = await archivo.text();
    let datos: unknown;
    try {
      datos = JSON.parse(texto);
    } catch {
      throw new Error('El archivo no es un JSON válido.');
    }
    return validarCopia(datos);
  }

  private descargar(nombre: string, contenido: string): void {
    const url = URL.createObjectURL(
      new Blob([contenido], { type: 'application/json' }),
    );
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }
}
