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

// Interface para todos los datos del usuario (optimización)
export interface IDatosCompletoUsuario {
  usuario: IUsuario;
  direcciones: IDireccionUsuario[];
  pedidosRecientes: IPedidoUsuario[];
  estadisticas: IEstadisticasUsuario;
  configuracionSeguridad: IConfiguracionSeguridad;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  // Cache para evitar múltiples consultas
  private datosUsuarioCache = new BehaviorSubject<IDatosCompletoUsuario | null>(null);
  public datosUsuario$ = this.datosUsuarioCache.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los datos del usuario de una sola vez (optimización)
   * Esta función se llama una sola vez al abrir la modal
   */
  obtenerDatosCompletos(userId: string): Observable<IDatosCompletoUsuario> {
    // Si ya tenemos los datos en cache, los devolvemos
    const datosEnCache = this.datosUsuarioCache.value;
    if (datosEnCache) {
      return of(datosEnCache);
    }

    // Si no hay cache, hacemos una sola consulta que trae todo
    return this.http.get<IDatosCompletoUsuario>(`${this.apiUrl}/${userId}/completo`)
      .pipe(
        tap(datos => this.datosUsuarioCache.next(datos)),
        catchError(error => {
          console.error('Error obteniendo datos completos del usuario:', error);
          return this.obtenerDatosSimulados(userId);
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
   * Limpia el cache (útil al cerrar sesión)
   */
  limpiarCache(): void {
    this.datosUsuarioCache.next(null);
  }

  /**
   * Datos simulados para desarrollo (mientras no tengas el backend listo)
   */
  private obtenerDatosSimulados(userId: string): Observable<IDatosCompletoUsuario> {
    const datosSimulados: IDatosCompletoUsuario = {
      usuario: {
        id: userId,
        nombre: 'Juan Carlos',
        apellidos: 'Pérez García',
        email: 'juan.perez@email.com',
        telefono: '477-123-4567',
        fechaNacimiento: new Date('1990-05-15'),
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        fechaRegistro: new Date('2023-01-15'),
        activo: true
      },
      direcciones: [
        {
          id: '1',
          alias: 'Casa',
          nombreCompleto: 'Juan Carlos Pérez García',
          telefono: '477-123-4567',
          calle: 'Av. López Mateos',
          numeroExterior: '123',
          numeroInterior: 'Depto 4B',
          colonia: 'Centro',
          ciudad: 'León',
          estado: 'Guanajuato',
          codigoPostal: '37000',
          referencias: 'Casa azul, frente al parque',
          esPrincipal: true
        }
      ],
      pedidosRecientes: [
        {
          id: '1',
          numeroOrden: 'ORD-87654321',
          fecha: new Date('2024-08-15'),
          estado: 'entregado',
          total: 1159.96,
          cantidadProductos: 3,
          direccionEnvio: 'Av. López Mateos 123, León, Gto.',
          metodoPago: 'Tarjeta **** 4242'
        },
        {
          id: '2',
          numeroOrden: 'ORD-87654322',
          fecha: new Date('2024-07-20'),
          estado: 'entregado',
          total: 599.99,
          cantidadProductos: 2,
          direccionEnvio: 'Av. López Mateos 123, León, Gto.',
          metodoPago: 'Tarjeta **** 4242'
        }
      ],
      estadisticas: {
        totalPedidos: 12,
        totalGastado: 8450.50,
        productosFavoritos: 5,
        miembroDesde: new Date('2023-01-15')
      },
      configuracionSeguridad: {
        cambiarPassword: false,
        verificacionDosPasos: false,
        notificacionesEmail: true,
        notificacionesSMS: false
      }
    };

    return of(datosSimulados);
  }
}
