// src/app/core/interceptors/api.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { timeout } from 'rxjs/operators';

function joinUrl(base: string, path: string): string {
  if (!base) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // No tocar URLs absolutas (http/https) ni assets
  const isAbsolute = /^https?:\/\//i.test(req.url);
  const isAsset = req.url.startsWith('assets/') || req.url.startsWith('/assets/');
  const finalUrl = (isAbsolute || isAsset) ? req.url : joinUrl(environment.apiUrl, req.url);

  const cloned = req.clone({
    url: finalUrl,
    // Si usas cookies/sesiones en el back, déjalo en true.
    // Si usas puro Bearer, puede quedar en true sin problema o cambiar a false si prefieres.
    withCredentials: true,
  });

  // Aplica timeout global (configurable en el environment)
  return next(cloned).pipe(timeout(environment.apiTimeout ?? 30000));
};
