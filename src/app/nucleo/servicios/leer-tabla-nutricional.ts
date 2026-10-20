import { Service } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Camera, MediaTypeSelection } from '@capacitor/camera';
import { Script, TextRecognition } from '@capacitor-mlkit/text-recognition';
import {
  LineaOcr,
  TablaNutricional,
  interpretarTabla,
} from '../utilidades/tabla-nutricional';

export type FuenteImagen = 'camara' | 'galeria';

export type ResultadoLectura =
  | { estado: 'leido'; tabla: TablaNutricional; texto: string }
  | { estado: 'no_disponible' }
  | { estado: 'cancelado' }
  | { estado: 'error'; mensaje: string };

@Service()
export class LeerTablaNutricional {
  async leer(fuente: FuenteImagen): Promise<ResultadoLectura> {
    if (!Capacitor.isNativePlatform()) {
      return { estado: 'no_disponible' };
    }
    try {
      const uri = await this.obtenerImagen(fuente);
      if (uri === null) {
        return { estado: 'cancelado' };
      }
      const resultado = await TextRecognition.processImage({
        path: this.conEsquema(uri),
        script: Script.Latin,
      });
      const lineas = this.aLineas(resultado.blocks.flatMap((b) => b.lines));
      return {
        estado: 'leido',
        tabla: interpretarTabla(lineas),
        texto: lineas.map((linea) => linea.texto).join('\n'),
      };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      if (/cancel/i.test(mensaje)) {
        return { estado: 'cancelado' };
      }
      return { estado: 'error', mensaje };
    }
  }

  private async obtenerImagen(fuente: FuenteImagen): Promise<string | null> {
    if (fuente === 'camara') {
      const foto = await Camera.takePhoto({ quality: 90 });
      return foto.uri ?? null;
    }
    const elegidas = await Camera.chooseFromGallery({
      mediaType: MediaTypeSelection.Photo,
      allowMultipleSelection: false,
    });
    return elegidas.results[0]?.uri ?? null;
  }

  private conEsquema(ruta: string): string {
    return ruta.startsWith('/') ? `file://${ruta}` : ruta;
  }

  private aLineas(
    lineas: {
      text: string;
      boundingBox?: {
        left: number;
        top: number;
        right: number;
        bottom: number;
      };
    }[],
  ): LineaOcr[] {
    const todasConCaja = lineas.every(
      (linea) => linea.boundingBox !== undefined,
    );
    return lineas.map((linea, i) => {
      const caja = linea.boundingBox;
      if (todasConCaja && caja) {
        return {
          texto: linea.text,
          izquierda: caja.left,
          derecha: caja.right,
          arriba: caja.top,
          abajo: caja.bottom,
        };
      }
      return {
        texto: linea.text,
        izquierda: 0,
        derecha: 1000,
        arriba: i * 40,
        abajo: i * 40 + 30,
      };
    });
  }
}
