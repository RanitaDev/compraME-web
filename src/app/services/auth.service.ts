import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { IUser, IAuthResponse, ILoginRequest, IRegisterRequest } from '../interfaces/auth.interface';   

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl || 'http://localhost:3010';
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  // BehaviorSubject para mantener el estado de autenticación
  private currentUserSubject = new BehaviorSubject<IUser | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Verificar si el token sigue siendo válido al inicializar el servicio
    this.checkTokenValidity();
    console.log('🔧 AuthService configurado con URL:', this.apiUrl);
  }

  /**
   * Registro de nuevo usuario
   */
  register(registerData: IRegisterRequest): Observable<IAuthResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Remover confirmPassword antes de enviar (el backend no lo acepta)
    const { confirmPassword, ...dataToSend } = registerData;
    
    console.log('📤 AuthService - Datos enviados:', dataToSend);
    console.log('🔗 AuthService - URL:', `${this.apiUrl}/auth/register`);

    return this.http.post<any>(`${this.apiUrl}/auth/register`, dataToSend, { headers })
      .pipe(
        map(response => {
          console.log('✅ AuthService - Respuesta recibida:', response);
          
          // Crear respuesta compatible con IAuthResponse
          const authResponse: IAuthResponse = {
            token: this.generateTempToken(response),
            user: {
              id: response._id || response.id || 'temp-id',
              email: response.email,
              name: response.name,
              role: response.role || 'user'
            },
            message: 'Usuario registrado exitosamente'
          };
          
          this.setSession(authResponse.token, authResponse.user);
          return authResponse;
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

    return this.http.post<IAuthResponse>(`${this.apiUrl}/auth/login`, loginData, { headers })
      .pipe(
        map(response => {
          if (response.token && response.user) {
            this.setSession(response.token, response.user);
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
  private setSession(token: string, user: IUser): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Limpiar la sesión del usuario
   */
  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('refresh_token');
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Redirigir al login
    this.router.navigate(['/auth']);
  }

  /**
   * Verificar si existe un token válido
   */
  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      return false;
    }

    // Verificar si el token ha expirado (si está en formato JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        this.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      // Si no es un JWT válido, asumir que es válido por ahora
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
   * Verificar validez del token al inicializar
   */
  private checkTokenValidity(): void {
    const token = this.getToken();
    if (token && !this.hasValidToken()) {
      this.clearSession();
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
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Datos inválidos - Verifica los campos';
          console.error('❌ Error 400 - Detalles:', error.error);
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
          errorMessage = error.error?.message || 'El usuario ya existe';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = error.error?.message || `Error: ${error.status}`;
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
}