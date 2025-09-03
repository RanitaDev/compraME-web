// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'auth_token'; // Coincide con AuthService

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    // Evita sobreescribir si ya viene un Authorization explícito
    const alreadyHasAuth = req.headers.has('Authorization');
    const authReq = alreadyHasAuth
      ? req
      : req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

    return next(authReq);
  }

  return next(req);
};
