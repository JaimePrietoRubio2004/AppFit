import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Arranque } from '../servicios/arranque';
import { PERFIL_REPOSITORY } from '../repositorios/perfil.repository';

export const ArranqueGuards: CanActivateFn = async () => {
  const arranque = inject(Arranque);
  const router = inject(Router);
  const perfilRepository = inject(PERFIL_REPOSITORY);

  if (arranque.yaVerificado()) {
    return true;
  }
  arranque.marcarVerificado();

  const perfiles = await perfilRepository.listar();

  if (perfiles.length === 0) {
    return router.createUrlTree(['/configuracion-inicial']);
  }

  if (perfiles.length === 1) {
    if (!perfiles[0].esUltimoUsado) {
      await perfilRepository.marcarComoUltimoUsado(perfiles[0].id);
    }
    return true;
  }

  return router.createUrlTree(['/seleccion-perfil']);
};
