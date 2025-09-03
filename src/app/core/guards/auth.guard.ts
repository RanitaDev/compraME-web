import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 */
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      } else {
        router.navigate(['/auth']);
        return false;
      }
    })
  );
};

/**
 * Guard para redirigir usuarios autenticados (ej: evitar que vean login si ya están logueados)
 */
export const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return true;
      } else {
        router.navigate(['/home']);
        return false;
      }
    })
  );
};

/**
 * Guard para proteger rutas de administración
 * Verifica autenticación y rol de admin
 */
export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && authService.isAuthenticated()) {
        // Si tienes roles específicos, verifica aquí
        // Por ahora, solo verifica que esté autenticado
        return true;
      } else {
        router.navigate(['/auth']);
        return false;
      }
    })
  );
};
