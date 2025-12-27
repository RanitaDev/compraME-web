import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  IUsuario,
  IDireccionUsuario,
  IPedidoUsuario,
  IConfiguracionSeguridad,
  IEstadisticasUsuario
} from '../interfaces/users.interface';
import { IOrders } from '../interfaces/orders.interface';

// Interface para todos los datos del usuario (optimización)
export interface IDatosCompletoUsuario {
  usuario: IUsuario;
  direcciones: IDireccionUsuario[];
  pedidosRecientes: IOrders[];
  estadisticas: IEstadisticasUsuario;
  configuracionSeguridad: IConfiguracionSeguridad;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  // Cache para evitar múltiples consultas
  private datosUsuarioCache = new BehaviorSubject<IDatosCompletoUsuario | null>(null);
  public datosUsuario$ = this.datosUsuarioCache.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los datos del usuario de una sola vez (optimización)
   * Esta función se llama una sola vez al abrir la modal
   */
  obtenerDatosCompletos(userId: string): Observable<IDatosCompletoUsuario> {
    const datosEnCache = this.datosUsuarioCache.value;
    if (datosEnCache) {
      return of(datosEnCache);
    }
    // Si no hay cache, hacemos una sola consulta que trae todo
    return this.http.get<IDatosCompletoUsuario>(`${this.apiUrl}/resumen/${userId}`)
      .pipe(
        tap(datos => this.datosUsuarioCache.next(datos)),
        catchError(error => {
          console.error('Error obteniendo datos completos del usuario:', error);
          throw error;
        })
      );
  }

  /**
   * Actualiza información básica del usuario
   */
  actualizarInformacionBasica(userId: string, datosUsuario: Partial<IUsuario>): Observable<IUsuario> {
    return this.http.put<IUsuario>(`${this.apiUrl}/${userId}/informacion`, datosUsuario)
      .pipe(
        tap(usuarioActualizado => {
          // Actualizar cache
          const datosActuales = this.datosUsuarioCache.value;
          if (datosActuales) {
            datosActuales.usuario = usuarioActualizado;
            this.datosUsuarioCache.next(datosActuales);
          }
        }),
        catchError(error => {
          console.error('Error actualizando información del usuario:', error);
          return of(datosUsuario as IUsuario);
        })
      );
  }

  /**
   * Agrega o actualiza una dirección
   */
  gestionarDireccion(userId: string, direccion: IDireccionUsuario): Observable<IDireccionUsuario[]> {
    const url = direccion.id ?
      `${this.apiUrl}/${userId}/direcciones/${direccion.id}` :
      `${this.apiUrl}/${userId}/direcciones`;

    const metodo = direccion.id ? this.http.put<IDireccionUsuario[]> : this.http.post<IDireccionUsuario[]>;

    return metodo.call(this.http, url, direccion)
      .pipe(
        tap(direccionesActualizadas => {
          // Actualizar cache
          const datosActuales = this.datosUsuarioCache.value;
          if (datosActuales) {
            datosActuales.direcciones = direccionesActualizadas;
            this.datosUsuarioCache.next(datosActuales);
          }
        }),
        catchError(error => {
          console.error('Error gestionando dirección:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene historial completo de pedidos (solo cuando se solicite)
   */
  obtenerHistorialCompleto(userId: string): Observable<IPedidoUsuario[]> {
    return this.http.get<IPedidoUsuario[]>(`${this.apiUrl}/${userId}/pedidos/historial`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo historial de pedidos:', error);
          return of([]);
        })
      );
  }

  /**
   * Actualiza configuración de seguridad
   */
  actualizarConfiguracionSeguridad(userId: string, config: IConfiguracionSeguridad): Observable<IConfiguracionSeguridad> {
    return this.http.put<IConfiguracionSeguridad>(`${this.apiUrl}/${userId}/seguridad`, config)
      .pipe(
        tap(configActualizada => {
          // Actualizar cache
          const datosActuales = this.datosUsuarioCache.value;
          if (datosActuales) {
            datosActuales.configuracionSeguridad = configActualizada;
            this.datosUsuarioCache.next(datosActuales);
          }
        }),
        catchError(error => {
          console.error('Error actualizando configuración de seguridad:', error);
          return of(config);
        })
      );
  }

  /**
   * Obtiene todos los usuarios (solo para admin)
   */
  obtenerTodosUsuarios(rolId?: string): Observable<IUsuario[]> {
    const url = rolId ? `${this.apiUrl}/getAll?rolId=${rolId}` : `${this.apiUrl}/getAll`;
    return this.http.get<IUsuario[]>(url)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo usuarios:', error);
          return of([]);
        })
      );
  }

  /**
   * Elimina un usuario
   */
  eliminarUsuario(userId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${userId}`)
      .pipe(
        tap(() => {
          const datosActuales = this.datosUsuarioCache.value;
          if (datosActuales && datosActuales.usuario.id === userId) {
            this.limpiarCache();
          }
        }),
        catchError(error => {
          console.error('Error eliminando usuario:', error);
          return of({ success: false });
        })
      );
  }

  /**
   * Limpia el cache (útil al cerrar sesión)
   */
  limpiarCache(): void {
    this.datosUsuarioCache.next(null);
  }
}
