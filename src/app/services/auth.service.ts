import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { IUser, IAuthResponse, ILoginRequest, IRegisterRequest } from '../interfaces/auth.interface';
import { SessionService } from '../core/services/session.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  // BehaviorSubject para mantener el estado de autenticación
  private currentUserSubject = new BehaviorSubject<IUser | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private sessionService: SessionService
  ) {
    // Verificar si el token sigue siendo válido al inicializar el servicio
    this.checkTokenValidity();

    // Escuchar eventos de timeout de sesión
    window.addEventListener('session-timeout', () => {
      this.handleSessionTimeout();
    });

    // Exponer métodos de debug en desarrollo (solo para depuración)
    if (typeof window !== 'undefined') {
      (window as any).authDebug = {
        sessionInfo: () => this.debugSessionInfo(),
        sessionService: () => this.sessionService.debugSessionInfo(),
        forceLogout: () => this.clearSession(),
        getToken: () => this.getToken(),
        isValid: () => this.hasValidToken()
      };
    }
  }

  /**
   * Registro de nuevo usuario
   */
  public register(registerData: IRegisterRequest): Observable<IAuthResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const { confirmPassword, ...dataToSend } = registerData;
    console.log('DATA TO SEND', dataToSend);

    return this.http.post<any>(`${this.apiUrl}/register`, dataToSend, { headers })
      .pipe(
        map(response => {
          this.setSession(response.access_token, response.user, true); // Recordarme por defecto en registro
          // También guardar refresh_token si existe
          if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Inicio de sesión
   */
  login(loginData: ILoginRequest): Observable<IAuthResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const { rememberMe, ...loginPayload } = loginData;

    return this.http.post<IAuthResponse>(`${this.apiUrl}/login`, loginPayload, { headers })
      .pipe(
        map(response => {
          if (response.access_token && response.user) {
            this.setSession(response.access_token, response.user, rememberMe);
            // También guardar refresh_token si existe
            if (response.refresh_token) {
              localStorage.setItem('refresh_token', response.refresh_token);
            }
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.clearSession();
  }

  /**
   * Forzar cierre de sesión (sin llamada al servidor)
   */
  forceLogout(): void {
    this.clearSession();
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtener el token actual
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // MÉTODOS PRIVADOS

  /**
   * Establecer la sesión del usuario
   */
  private setSession(token: string, user: IUser, rememberMe?: boolean): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));

    // Configurar sesión según preferencias del usuario
    const rememberMeValue = rememberMe !== undefined ? rememberMe : true; // Por defecto true
    this.sessionService.configureSession({
      rememberMe: rememberMeValue
    });

    console.log('✅ Sesión establecida:', {
      usuario: user.email,
      recordarme: rememberMeValue,
      token: token.substring(0, 20) + '...'
    });

    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);

    // Manejar redirección después del login
    this.handlePostLoginRedirect();
  }

  /**
   * Manejar redirección después del login
   */
  private handlePostLoginRedirect(): void {
    const redirectUrl = localStorage.getItem('redirect_after_login');
    const purchaseIntent = localStorage.getItem('purchase_intent');

    // Limpiar storage
    localStorage.removeItem('redirect_after_login');
    localStorage.removeItem('purchase_intent');

    if (purchaseIntent) {
      try {
        const intent = JSON.parse(purchaseIntent);
        if (intent.action === 'buy_now' && intent.productId) {
          // El usuario viene de una intención de compra
          console.log('🛒 Redirigiendo a compra después del login');
          // La redirección la manejará el componente que detecte el login
          return;
        }
      } catch (error) {
        console.error('Error procesando purchase_intent:', error);
      }
    }

    if (redirectUrl && redirectUrl !== '/auth') {
      this.router.navigate([redirectUrl]);
    }
  }

  /**
   * Limpiar la sesión del usuario
   */
  private clearSession(): void {
    console.log('🧹 Limpiando sesión...');

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('refresh_token');

    // Limpiar configuración de sesión
    this.sessionService.clearSessionConfig();

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    // Redirigir al login
    this.router.navigate(['/auth']);
  }

  /**
   * Manejar timeout de sesión
   */
  private handleSessionTimeout(): void {
    console.log('⏰ Sesión expirada por timeout');
    this.clearSession();
    // Aquí podrías mostrar un toast informando al usuario
  }

  /**
   * Verificar si existe un token válido
   */
  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      return false;
    }

    // Si está configurado "Recordarme", no validar expiración
    if (this.sessionService.shouldPersistSession()) {
      return true;
    }

    // Verificar si el token ha expirado (si está en formato JWT)
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        // No es un JWT válido, pero permitir por ahora
        return true;
      }

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < currentTime) {
        console.log('🚨 Token expirado:', new Date(payload.exp * 1000));
        this.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      // Si hay error decodificando, asumir válido pero loggear el error
      console.warn('Error validando token JWT:', error);
      return true;
    }
  }

  /**
   * Obtener usuario desde localStorage
   */
  private getUserFromStorage(): IUser | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Verificar validez del token al inicializar (menos agresivo)
   */
  private checkTokenValidity(): void {
    const token = this.getToken();
    if (!token) {
      return;
    }

    // Solo verificar si no está configurado "Recordarme"
    if (!this.sessionService.shouldPersistSession()) {
      if (!this.hasValidToken()) {
        console.log('🔄 Token inválido, limpiando sesión...');
        this.clearSession();
      }
    } else {
      console.log('💾 Sesión persistente activa, saltando validación de token');
    }
  }

  /**
   * Obtener headers con autorización
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Manejar errores HTTP
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Ha ocurrido un error inesperado';

    console.error('🚨 Error en AuthService:', error);
    console.error('📊 Status:', error.status);
    console.error('📝 Error body:', error.error);

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor

      // Priorizar el mensaje del backend si existe
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else {
        // Fallback a mensajes por código de estado
        switch (error.status) {
          case 400:
            errorMessage = 'Datos inválidos - Verifica los campos';
            break;
          case 401:
            errorMessage = 'Credenciales inválidas';
            this.forceLogout();
            break;
          case 403:
            errorMessage = 'Acceso denegado';
            break;
          case 404:
            errorMessage = 'Servicio no encontrado';
            break;
          case 409:
            errorMessage = 'El usuario ya existe';
            break;
          case 422:
            errorMessage = 'Error de validación - Verifica los datos ingresados';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
          default:
            errorMessage = `Error del servidor (${error.status})`;
        }
      }

      // Si es un array de errores de validación (como de class-validator)
      if (error.error?.message && Array.isArray(error.error.message)) {
        errorMessage = error.error.message.join(', ');
      }
    }

    return throwError(() => new Error(errorMessage));
  };

  /**
   * Generar token temporal cuando el backend no devuelve uno
   */
  private generateTempToken(userData: any): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: userData._id || userData.id || 'temp-id',
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    };

    // Generar un JWT básico (no es seguro, solo para desarrollo)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = 'temp-signature';

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Método de diagnóstico - Solo para desarrollo
   */
  public debugSessionInfo(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();
    const sessionConfig = this.sessionService.getSessionConfig();

    console.log('🔍 DEBUG - Estado de sesión:', {
      hasToken: !!token,
      tokenStart: token ? token.substring(0, 20) + '...' : 'No token',
      user: user ? { email: user.email, nombre: user.nombre } : 'No user',
      sessionConfig,
      isAuthenticated: this.isAuthenticated(),
      tokenValid: token ? this.hasValidToken() : false
    });

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp ? new Date(payload.exp * 1000) : null;
          console.log('🗂️ Token payload:', {
            exp: exp ? exp.toLocaleString() : 'No expiry',
            timeUntilExp: exp ? Math.floor((exp.getTime() - Date.now()) / 1000 / 60) + ' minutos' : 'N/A'
          });
        }
      } catch (error) {
        console.log('❌ Error decodificando token:', error);
      }
    }
  }
}
