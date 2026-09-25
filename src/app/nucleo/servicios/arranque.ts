import { Service, signal } from '@angular/core';

@Service()
export class Arranque {
  private readonly verificado = signal(false);

  yaVerificado(): boolean {
    return this.verificado();
  }

  marcarVerificado(): void {
    this.verificado.set(true);
  }
}
