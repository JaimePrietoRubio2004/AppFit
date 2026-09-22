import { Service } from '@angular/core';
import {
  BarcodeFormat,
  BarcodeScanner,
} from '@capacitor-mlkit/barcode-scanning';

export type ResultadoEscaneado =
  | { escaneado: true; codigo: string }
  | { escaneado: false; motivo: 'cancelado' | 'sin_permiso' | 'no_disponible' };

const FORMATOS_ALIMENTOS = [
  BarcodeFormat.Ean13,
  BarcodeFormat.Ean8,
  BarcodeFormat.UpcA,
  BarcodeFormat.UpcE,
];

@Service()
export class EscanerCodigoBarras {
  async escanear(): Promise<ResultadoEscaneado> {
    const tienePermiso = await this.asegurarPermiso();
    if (!tienePermiso) {
      return { escaneado: false, motivo: 'sin_permiso' };
    }
    const { available } =
      await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!available) {
      return { escaneado: false, motivo: 'no_disponible' };
    }
    const { barcodes } = await BarcodeScanner.scan({
      formats: FORMATOS_ALIMENTOS,
    });
    const primero = barcodes[0];
    if (!primero) {
      return { escaneado: false, motivo: 'cancelado' };
    }
    return {
      escaneado: true,
      codigo: primero.rawValue ?? primero.displayValue,
    };
  }

  private async asegurarPermiso(): Promise<boolean> {
    const estado = await BarcodeScanner.checkPermissions();
    if (estado.camera === 'granted') {
      return true;
    }
    const solicitado = await BarcodeScanner.requestPermissions();
    return solicitado.camera === 'granted';
  }
}
