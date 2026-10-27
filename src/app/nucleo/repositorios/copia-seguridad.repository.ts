import { InjectionToken } from '@angular/core';
import { CopiaSeguridad } from '../modelos/copia-seguridad.model';

export interface CopiaSeguridadRepository {
  exportar(): Promise<CopiaSeguridad>;

  importar(copia: CopiaSeguridad): Promise<void>;
}

export const COPIA_SEGURIDAD_REPOSITORY =
  new InjectionToken<CopiaSeguridadRepository>('CopiaSeguridadRepository');
