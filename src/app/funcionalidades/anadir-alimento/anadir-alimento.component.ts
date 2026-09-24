import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/angular';

import { EscanerCodigoBarras } from '../../nucleo/servicios/escaner-codigo-barras';
import { ResolverAlimento } from '../../nucleo/servicios/resolver-alimento';

@Component({
  selector: 'app-anadir-alimento',
  templateUrl: './anadir-alimento.component.html',
  styleUrls: ['./anadir-alimento.component.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class AnadirAlimentoComponent {
  private readonly escanerCodigoBarras = inject(EscanerCodigoBarras);
  private readonly resolverAlimento = inject(ResolverAlimento);
  private readonly router = inject(Router);

  protected readonly mensaje = signal<string | null>(null);

  async escanear(): Promise<void> {
    this.mensaje.set(null);

    try {
      const resultadoEscaneo = await this.escanerCodigoBarras.escanear();
      if (!resultadoEscaneo.escaneado) {
        this.mensaje.set(this.mensajeEscaneo(resultadoEscaneo.motivo));
        return;
      }
      const resolucion = await this.resolverAlimento.obtenerPorCodigoDeBarras(
        resultadoEscaneo.codigo,
      );
      if (!resolucion.encontrado) {
        this.mensaje.set(this.mensajeResolucion(resolucion.motivo));
        return;
      }
      this.router.navigate(['/detalle-alimento', resolucion.alimento.id]);
    } catch (error) {
      this.mensaje.set(`Error inesperado: ${error}`);
    }
  }

  private mensajeEscaneo(
    motivo: 'cancelado' | 'sin_permiso' | 'no_disponible',
  ): string | null {
    switch (motivo) {
      case 'cancelado':
        return null;
      case 'sin_permiso':
        return 'Necesito permiso de cámara para escanear.';
      case 'no_disponible':
        return 'El escáner no está disponible en este dispositivo.';
    }
  }

  private mensajeResolucion(motivo: 'no_encontrado' | 'sin_conexion'): string {
    switch (motivo) {
      case 'no_encontrado':
        return 'Producto no encontrado.';
      case 'sin_conexion':
        return 'Sin conexión. No se puede consultar el producto.';
    }
  }
}
