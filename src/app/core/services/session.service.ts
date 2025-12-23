import { Injectable } from '@angular/core';

export interface SessionConfig {
  rememberMe: boolean;
  sessionTimeout: number; // en minutos
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly SESSION_CONFIG_KEY = 'session_config';
  private readonly DEFAULT_SESSION_TIMEOUT = 480; // 8 horas (más tiempo por defecto)
  private sessionTimer: any;

  constructor() {
    this.initSessionTimer();
  }

  /**
   * Configurar sesión con opciones
   */
  configureSession(config: Partial<SessionConfig>): void {
    const currentConfig = this.getSessionConfig();
    const newConfig = { ...currentConfig, ...config };

    localStorage.setItem(this.SESSION_CONFIG_KEY, JSON.stringify(newConfig));

    if (!newConfig.rememberMe) {
      this.startSessionTimer(newConfig.sessionTimeout);
    }
  }

  /**
   * Obtener configuración de sesión
   */
  getSessionConfig(): SessionConfig {
    const stored = localStorage.getItem(this.SESSION_CONFIG_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return this.getDefaultConfig();
      }
    }
    return this.getDefaultConfig();
  }

  /**
   * Iniciar timer de sesión
   */
  private startSessionTimer(timeoutMinutes: number): void {
    this.clearSessionTimer();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeoutMs);
  }

  /**
   * Limpiar timer de sesión
   */
  private clearSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Manejar timeout de sesión
   */
  private handleSessionTimeout(): void {
    // Emitir evento para que AuthService limpie la sesión
    window.dispatchEvent(new CustomEvent('session-timeout'));
  }

  /**
   * Inicializar timer de sesión al cargar la página
   */
  private initSessionTimer(): void {
    const config = this.getSessionConfig();

    if (!config.rememberMe) {
      // Verificar si hay una sesión activa
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.startSessionTimer(config.sessionTimeout);
      }
    }
  }

  /**
   * Resetear timer de sesión (llamar en actividad del usuario)
   */
  resetSessionTimer(): void {
    const config = this.getSessionConfig();

    if (!config.rememberMe) {
      this.startSessionTimer(config.sessionTimeout);
    }
  }

  /**
   * Limpiar configuración de sesión
   */
  clearSessionConfig(): void {
    localStorage.removeItem(this.SESSION_CONFIG_KEY);
    this.clearSessionTimer();
  }

  /**
   * Verificar si la sesión debe persistir
   */
  shouldPersistSession(): boolean {
    return this.getSessionConfig().rememberMe;
  }

  /**
   * Configuración por defecto
   */
  private getDefaultConfig(): SessionConfig {
    return {
      rememberMe: true, // Cambiar a true por defecto para mejor UX
      sessionTimeout: this.DEFAULT_SESSION_TIMEOUT
    };
  }

  /**
   * Obtener tiempo restante de sesión en minutos
   */
  getSessionTimeRemaining(): number {
    // Esta funcionalidad se puede implementar más adelante si es necesaria
    return 0;
  }
}
