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
import { IAddress } from '../../../interfaces/checkout.interface';
import { PrimeNgModule } from '../../../primeng.module';
import { UserInfoComponent } from './user-info/user-info';
import { UserOrders } from './user-orders/user-orders';
import { UserAddresses } from './user-addresses/user-addresses';
import { UserSecurity } from './user-security/user-security';
import { UserHistory } from './user-history/user-history';
import { ConfirmationService } from '../../../services/utils/confirmation.service';
import { IUser } from '../../../interfaces/auth.interface';

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
  datosUsuario: IDatosCompletoUsuario = {} as IDatosCompletoUsuario;
  cargandoDatos = false;

  // Estado del componente
  opcionActiva = 'informacion';
  cerrandoSesion = false;
  mostrandoFormularioDireccion = false;

  // Historial completo (se carga bajo demanda)
  historialCompleto: IPedidoUsuario[] = [];
  cargandoHistorial = false;

  public currentUser: IUser | null = null;
  public isAuthenticated = false;

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
    }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private confirmacionService: ConfirmationService
  ) {}

  /**
   * Maneja errores de carga de imagen y establece un fallback local.
   * Intenta primero '/assets/layout.png' y si también falla usa '/assets/placeholderImage.webp'.
   *
   * @param event - Evento de error del elemento img
   */
  onImageError(event: Event): void {
    const img = event?.target as HTMLImageElement | null;
    if (!img) return;

    // Evitar bucle infinito: revisar si ya usamos el fallback final
    const current = img.src || '';

    // Si ya es el placeholder final, no hacer nada
    if (current.includes('placeholderImage.webp')) return;

    // Si no contiene layout.png, probar con layout.png como primer fallback
    if (!current.includes('layout.png')) {
      img.src = '/assets/layout.png';
      return;
    }

    // Si ya probamos layout.png, usar el placeholder final
    img.src = '/assets/placeholderImage.webp';
  }

  /**
   * Inicializa el componente y carga datos si está abierto
   */
  ngOnInit() {
    if (this.isOpen) {
      this.cargarDatosUsuario();
    }
  }

  /**
   * Maneja el proceso de cerrar sesión con confirmación
   */
  cerrarSesion(): void {
    this.confirmacionService.confirmar({
      titulo: 'Cerrar sesión',
      descripcion: '¿Estás seguro de que deseas cerrar sesión?',
      textoConfirmar: 'Sí, cerrar sesión',
    }).subscribe((resultado) => {
      if (resultado.confirmado) {
        this.authService.cerrarSesion()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.usuarioCerroSesion.emit();
              this.cerrarModal();
            },
            error: (error) => {
              console.error('Error cerrando sesión:', error);
            }
          });
      }
    });
  }

  /**
   * Destruye el componente y limpia subscripciones
   */
  ngOnDestroy(): void {
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
    this.datosUsuario = {} as IDatosCompletoUsuario;
    this.historialCompleto = [];
    this.cargandoDatos = false;
    this.cargandoHistorial = false;
    this.cerrandoSesion = false;
    this.mostrandoFormularioDireccion = false;
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
  onDireccionesActualizadas(direccionesActualizadas: IAddress[]): void {
    if (this.datosUsuario) {
      this.datosUsuario.direcciones = this.convertirIAddressAIDireccionUsuario(direccionesActualizadas);
      this.mostrandoFormularioDireccion = false;
    }
  }

  /**
   * Convierte IAddress[] a IDireccionUsuario[]
   */
  private convertirIAddressAIDireccionUsuario(addresses: IAddress[]): IDireccionUsuario[] {
    return addresses.map(address => ({
      id: address._id.toString(),
      alias: address.alias,
      nombreCompleto: address.nombreCompleto,
      telefono: address.telefono,
      calle: address.calle,
      numeroExterior: address.numeroExterior,
      numeroInterior: address.numeroInterior,
      colonia: address.colonia,
      ciudad: address.ciudad,
      estado: address.estado,
      codigoPostal: address.codigoPostal,
      referencias: address.referencias,
      esPrincipal: address.esPrincipal
    }));
  }

  /**
   * Convierte IDireccionUsuario[] a IAddress[]
   */
  private convertirIDireccionUsuarioAIAddress(direcciones: IDireccionUsuario[]): IAddress[] {
    return direcciones.map(direccion => ({
      _id: direccion.id,
      alias: direccion.alias,
      nombreCompleto: direccion.nombreCompleto,
      telefono: direccion.telefono,
      calle: direccion.calle,
      numeroExterior: direccion.numeroExterior,
      numeroInterior: direccion.numeroInterior,
      colonia: direccion.colonia,
      ciudad: direccion.ciudad,
      estado: direccion.estado,
      codigoPostal: direccion.codigoPostal,
      referencias: direccion.referencias,
      esPrincipal: direccion.esPrincipal
    }));
  }

  /**
   * Obtiene las direcciones como IAddress[]
   */
  getDireccionesComoIAddress(): IAddress[] {
    return this.datosUsuario?.direcciones
      ? this.convertirIDireccionUsuarioAIAddress(this.datosUsuario.direcciones)
      : [];
  }

  /**
   * Maneja cuando se actualiza la configuración de seguridad
   */
  onConfiguracionActualizada(configActualizada: IConfiguracionSeguridad): void {
    if (this.datosUsuario) {
      this.datosUsuario.configuracionSeguridad = configActualizada;
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

  /**
   * Muestra el formulario para agregar una nueva dirección
   */
  mostrarFormularioDireccion(): void {
    this.mostrandoFormularioDireccion = true;
  }

  /**
   * Cierra el modal y redirige al inicio para ver productos
   */
  irAInicio(): void {
    this.cerrarModal();
    window.location.href = '/';
  }
}
