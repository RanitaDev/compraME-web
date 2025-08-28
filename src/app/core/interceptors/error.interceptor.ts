// src/app/core/interceptors/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Log global (puedes reemplazar por un ToastService, etc.)
      console.error('[HTTP ERROR]', {
        url: req.url,
        method: req.method,
        status: err.status,
        error: err.error,
      });

      // Ejemplos de acciones típicas:
      // if (err.status === 401) { /* logout/redirect a /login */ }
      // if (err.status === 403) { /* mostrar "sin permisos" */ }

      return throwError(() => err);
    })
  );
};
