import { inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Guard para redirigir la ruta raíz al home
 * Si alguien accede a localhost:4200 (sin ruta específica), lo redirige a /home
 */
export const rootRedirectGuard = () => {
  const router = inject(Router);

  // Verificar si la URL actual es exactamente la raíz
  if (router.url === '/' || router.url === '') {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
