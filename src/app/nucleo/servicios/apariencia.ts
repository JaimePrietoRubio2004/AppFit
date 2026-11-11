import { Service, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type PreferenciaApariencia = 'automatica' | 'claro' | 'oscuro';

const CLAVE = 'apariencia';

@Service()
export class Apariencia {
  readonly preferencia = signal<PreferenciaApariencia>('automatica');
  readonly oscuro = signal(false);
  private readonly consulta = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.consulta.addEventListener('change', () => this.aplicar());
  }

  async iniciar(): Promise<void> {
    const { value } = await Preferences.get({ key: CLAVE });
    if (value === 'automatica' || value === 'claro' || value === 'oscuro') {
      this.preferencia.set(value);
    }
    this.aplicar();
  }

  async elegir(preferencia: PreferenciaApariencia): Promise<void> {
    this.preferencia.set(preferencia);
    await Preferences.set({ key: CLAVE, value: preferencia });
    this.aplicar();
  }

  private aplicar(): void {
    const oscuro =
      this.preferencia() === 'oscuro' ||
      (this.preferencia() === 'automatica' && this.consulta.matches);
    document.documentElement.classList.toggle('ion-palette-dark', oscuro);
    this.oscuro.set(oscuro);
  }
}
