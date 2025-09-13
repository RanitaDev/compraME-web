// src/app/core/interceptors/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Log global (puedes reemplazar por un ToastService, etc.)
      console.error('[HTTP ERROR]', {
        url: req.url,
        method: req.method,
        status: err.status,
        error: err.error,
      });

      // Manejar diferentes tipos de errores
      switch (err.status) {
        case 401:
          // NO hacer logout automático aquí - dejar que AuthService lo maneje
          console.warn('🚨 Error 401 detectado - AuthService debe manejar esto');
          break;
        case 403:
          console.warn('⛔ Acceso denegado (403)');
          break;
        case 500:
          console.error('💥 Error interno del servidor (500)');
          break;
      }

      return throwError(() => err);
    })
  );
};
