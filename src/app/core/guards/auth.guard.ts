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
        // Verificar si es admin
        if (user.rolId === 'admin') {
          return true;
        } else {
          // Si no es admin, redirigir a home
          router.navigate(['/home']);
          return false;
        }
      } else {
        router.navigate(['/auth']);
        return false;
      }
    })
  );
};

/**
 * Guard para redirigir usuarios admin a panel de administración
 * Si el usuario es admin y está en una ruta que NO es /admin, redirigir a /admin
 */
export const adminRedirectGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && authService.isAuthenticated() && user.rolId === 'admin') {
        // Si es admin y NO está en una ruta de admin, redirigir
        const currentUrl = router.url;
        if (!currentUrl.startsWith('/admin')) {
          router.navigate(['/admin']);
          return false;
        }
      }
      return true;
    })
  );
};

