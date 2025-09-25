import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UserService, IDatosCompletoUsuario } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import {
  IUsuario,
  IDireccionUsuario,
  IPedidoUsuario,
  IConfiguracionSeguridad
} from '../../../interfaces/users.interface';
import { PrimeNgModule } from '../../../primeng.module';
import { UserInfoComponent } from './user-info/user-info';
import { UserOrders } from './user-orders/user-orders';
import { UserAddresses } from './user-addresses/user-addresses';
import { UserSecurity } from './user-security/user-security';
import { UserHistory } from './user-history/user-history';

// Interfaces para las opciones del menú
interface OpcionMenu {
  id: string;
  label: string;
  labelCorto?: string; // Para vista móvil
  icono: string;
}

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    PrimeNgModule,
    UserInfoComponent,
    UserOrders,
    UserAddresses,
    UserSecurity,
    UserHistory
  ],
  templateUrl: './user-profile-modal.component.html',
  styleUrls: ['./user-profile-modal.component.css']
})
export class UserProfileModalComponent implements OnInit, OnDestroy {

  @Input() isOpen = false;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() usuarioCerroSesion = new EventEmitter<void>();

  // Datos del usuario
  datosUsuario: IDatosCompletoUsuario | null = null;
  cargandoDatos = false;

  // Estado del componente
  opcionActiva = 'informacion';
  cerrandoSesion = false;

  // Historial completo (se carga bajo demanda)
  historialCompleto: IPedidoUsuario[] = [];
  cargandoHistorial = false;

  // Subject para manejar unsubscripciones
  private destroy$ = new Subject<void>();

  // Opciones del menú lateral
  opcionesMenu: OpcionMenu[] = [
    {
      id: 'informacion',
      label: 'Información Personal',
      labelCorto: 'Info',
      icono: 'pi pi-user'
    },
    {
      id: 'compras',
      label: 'Mis Compras',
      labelCorto: 'Compras',
      icono: 'pi pi-shopping-bag'
    },
    {
      id: 'direcciones',
      label: 'Direcciones',
      labelCorto: 'Direcciones',
      icono: 'pi pi-map-marker'
    },
    {
      id: 'seguridad',
      label: 'Seguridad',
      labelCorto: 'Seguridad',
      icono: 'pi pi-shield'
    },
    {
      id: 'historial',
      label: 'Historial Completo',
      labelCorto: 'Historial',
      icono: 'pi pi-history'
    },
    {
      id: 'cerrar-sesion',
      label: 'Cerrar Sesión',
      labelCorto: 'Salir',
      icono: 'pi pi-sign-out'
    }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.isOpen) {
      this.cargarDatosUsuario();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga todos los datos del usuario de una sola vez (optimización)
   */
  private cargarDatosUsuario(): void {
    const usuarioActual = this.authService.getCurrentUser();

    if (!usuarioActual?.id) {
      console.error('No hay usuario autenticado');
      return;
    }

    this.cargandoDatos = true;

    this.userService.obtenerDatosCompletos(usuarioActual.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (datos) => {
          this.datosUsuario = datos;
          this.cargandoDatos = false;
        },
        error: (error) => {
          console.error('Error cargando datos del usuario:', error);
          this.cargandoDatos = false;
        }
      });
  }

  /**
   * Selecciona una opción del menú
   */
  seleccionarOpcion(opcionId: string): void {
    this.opcionActiva = opcionId;

    // Si selecciona historial y no está cargado, cargarlo
    if (opcionId === 'historial' && this.historialCompleto.length === 0) {
      this.cargarHistorialCompleto();
    }
  }

  /**
   * Obtiene el título de la opción actual
   */
  obtenerTituloOpcion(opcionId: string): string {
    const opcion = this.opcionesMenu.find(op => op.id === opcionId);
    return opcion?.label || 'Mi Cuenta';
  }

  /**
   * TrackBy function para la lista de opciones
   */
  trackByOpcion(index: number, opcion: OpcionMenu): string {
    return opcion.id;
  }

  /**
   * Carga el historial completo de pedidos
   */
  private cargarHistorialCompleto(): void {
    const usuarioActual = this.authService.getCurrentUser();

    if (!usuarioActual?.id) return;

    this.cargandoHistorial = true;

    this.userService.obtenerHistorialCompleto(usuarioActual.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (historial) => {
          this.historialCompleto = historial;
          this.cargandoHistorial = false;
        },
        error: (error) => {
          console.error('Error cargando historial completo:', error);
          this.cargandoHistorial = false;
        }
      });
  }

  /**
   * Confirma y ejecuta el cerrar sesión
   */
  confirmarCerrarSesion(): void {
    this.cerrandoSesion = true;

    this.authService.cerrarSesion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cerrandoSesion = false;
          this.userService.limpiarCache();
          this.usuarioCerroSesion.emit();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error cerrando sesión:', error);
          this.cerrandoSesion = false;
        }
      });
  }

  /**
   * Cierra la modal
   */
  cerrarModal(): void {
    this.isOpen = false;
    this.modalClosed.emit();
    this.resetearEstado();
  }

  /**
   * Maneja clics en el backdrop
   */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }

  /**
   * Resetea el estado del componente
   */
  private resetearEstado(): void {
    this.opcionActiva = 'informacion';
    this.datosUsuario = null;
    this.historialCompleto = [];
    this.cargandoDatos = false;
    this.cargandoHistorial = false;
    this.cerrandoSesion = false;
  }

  // === Handlers de eventos de los componentes hijos ===

  /**
   * Maneja cuando se actualizan los datos del usuario
   */
  onDatosActualizados(datosActualizados: Partial<IUsuario>): void {
    if (this.datosUsuario) {
      this.datosUsuario.usuario = { ...this.datosUsuario.usuario, ...datosActualizados };
    }
  }

  /**
   * Maneja cuando se actualizan las direcciones
   */
  onDireccionesActualizadas(direccionesActualizadas: any[]): void {
    if (this.datosUsuario) {
      this.datosUsuario.direcciones = direccionesActualizadas as IDireccionUsuario[];
    }
  }

  /**
   * Maneja cuando se actualiza la configuración de seguridad
   */
  onConfiguracionActualizada(configActualizada: any): void {
    if (this.datosUsuario) {
      this.datosUsuario.configuracionSeguridad = configActualizada as IConfiguracionSeguridad;
    }
  }

  /**
   * Maneja cuando se solicita ver el historial completo
   */
  onVerHistorialCompleto(): void {
    this.seleccionarOpcion('historial');
  }

  // === Métodos públicos para ser llamados desde el componente padre ===

  /**
   * Abre la modal (método público)
   */
  abrirModal(): void {
    this.isOpen = true;
    this.cargarDatosUsuario();
  }

  /**
   * Cambia a una opción específica (método público)
   */
  navegarAOpcion(opcionId: string): void {
    if (this.opcionesMenu.find(op => op.id === opcionId)) {
      this.seleccionarOpcion(opcionId);
    }
  }
}
