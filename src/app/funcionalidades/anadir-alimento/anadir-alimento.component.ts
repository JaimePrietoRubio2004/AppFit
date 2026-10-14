import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  ViewWillEnter,
} from '@ionic/angular';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/alimento.repository';
import { Alimento } from '../../nucleo/modelos/alimento.model';
import { EscanerCodigoBarras } from '../../nucleo/servicios/escaner-codigo-barras';
import { ResolverAlimento } from '../../nucleo/servicios/resolver-alimento';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { PERFIL_ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/perfil-alimento.repository';

@Component({
  selector: 'app-anadir-alimento',
  templateUrl: './anadir-alimento.component.html',
  styleUrls: ['./anadir-alimento.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    DecimalPipe,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    NgTemplateOutlet,
  ],
})
export class AnadirAlimentoComponent implements OnInit, ViewWillEnter {
  private readonly escanerCodigoBarras = inject(EscanerCodigoBarras);
  private readonly resolverAlimento = inject(ResolverAlimento);
  private readonly router = inject(Router);
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly perfilAlimentoRepository = inject(
    PERFIL_ALIMENTO_REPOSITORY,
  );

  protected readonly textoBusqueda = signal('');
  protected readonly resultados = signal<Alimento[]>([]);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly favoritos = signal<Alimento[]>([]);
  protected readonly masUsados = signal<Alimento[]>([]);

  async ionViewWillEnter(): Promise<void> {
    await this.cargarListas();
  }

  async ngOnInit(): Promise<void> {
    await this.cargarListas();
  }

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

  async buscar(valor: string | null | undefined): Promise<void> {
    const texto = (valor ?? '').trim();
    this.textoBusqueda.set(texto);
    if (texto === '') {
      this.resultados.set([]);
      return;
    }
    const encontrados = await this.alimentoRepository.buscarPorTexto(texto);
    if (this.textoBusqueda() === texto) {
      this.resultados.set(encontrados);
    }
  }

  abrir(alimento: Alimento): void {
    this.router.navigate(['/detalle-alimento', alimento.id]);
  }

  private async cargarListas(): Promise<void> {
    const perfil = await this.perfilRepository.obtenerUltimoUsado();
    if (!perfil) {
      return;
    }
    const favoritos = await this.perfilAlimentoRepository.listarFavorito(
      perfil.id,
    );
    const idsFavoritos = new Set(favoritos.map((a) => a.id));
    const masUsados = await this.perfilAlimentoRepository.listarMasUsado(
      perfil.id,
      10,
    );
    this.favoritos.set(favoritos);
    this.masUsados.set(masUsados.filter((a) => !idsFavoritos.has(a.id)));
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
