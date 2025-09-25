import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ConfiguracionSeguridad {
  ultimoCambioPassword: Date;
  sesionesActivas: number;
  autenticacionDosFactor: boolean;
  notificacionesSeguridad: boolean;
  sesionesDispositivos: DispositivoSesion[];
}

interface DispositivoSesion {
  id: string;
  dispositivo: string;
  ubicacion: string;
  fechaUltimoAcceso: Date;
  esActual: boolean;
}

interface CambioPassword {
  passwordActual: string;
  passwordNuevo: string;
  confirmarPassword: string;
}

@Component({
  selector: 'app-user-security',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-security.html',
  styleUrl: './user-security.css'
})
export class UserSecurity {
  @Input() configuracion: any = null;
  @Input() vistaMovil: boolean = false;
  @Output() configuracionActualizada = new EventEmitter<any>();

  mostrarCambioPassword = false;
  cambiandoPassword = false;

  formPassword: CambioPassword = {
    passwordActual: '',
    passwordNuevo: '',
    confirmarPassword: ''
  };

  // Datos de ejemplo para la demostración
  configuracionEjemplo: ConfiguracionSeguridad = {
    ultimoCambioPassword: new Date('2024-01-15'),
    sesionesActivas: 3,
    autenticacionDosFactor: false,
    notificacionesSeguridad: true,
    sesionesDispositivos: [
      {
        id: '1',
        dispositivo: 'Chrome en Windows',
        ubicacion: 'Ciudad de México, México',
        fechaUltimoAcceso: new Date(),
        esActual: true
      },
      {
        id: '2',
        dispositivo: 'Safari en iPhone',
        ubicacion: 'Ciudad de México, México',
        fechaUltimoAcceso: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
        esActual: false
      },
      {
        id: '3',
        dispositivo: 'Chrome en Android',
        ubicacion: 'Guadalajara, México',
        fechaUltimoAcceso: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
        esActual: false
      }
    ]
  };

  ngOnInit() {
    // Usar datos de ejemplo si no se proporcionan datos reales
    if (!this.configuracion) {
      this.configuracion = this.configuracionEjemplo;
    }
  }

  toggleDosFactor(): void {
    if (this.configuracion) {
      this.configuracion.autenticacionDosFactor = !this.configuracion.autenticacionDosFactor;
      this.configuracionActualizada.emit(this.configuracion);
    }
  }

  toggleNotificaciones(): void {
    if (this.configuracion) {
      this.configuracion.notificacionesSeguridad = !this.configuracion.notificacionesSeguridad;
      this.configuracionActualizada.emit(this.configuracion);
    }
  }

  mostrarFormularioCambioPassword(): void {
    this.mostrarCambioPassword = true;
    this.formPassword = {
      passwordActual: '',
      passwordNuevo: '',
      confirmarPassword: ''
    };
  }

  cancelarCambioPassword(): void {
    this.mostrarCambioPassword = false;
  }

  async cambiarPassword(): Promise<void> {
    if (this.formPassword.passwordNuevo !== this.formPassword.confirmarPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (this.formPassword.passwordNuevo.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.cambiandoPassword = true;

    try {
      // Simular cambio de contraseña
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (this.configuracion) {
        this.configuracion.ultimoCambioPassword = new Date();
        this.configuracionActualizada.emit(this.configuracion);
      }

      alert('Contraseña cambiada exitosamente');
      this.mostrarCambioPassword = false;
    } catch (error) {
      alert('Error al cambiar la contraseña');
    } finally {
      this.cambiandoPassword = false;
    }
  }

  cerrarSesion(dispositivoId: string): void {
    if (confirm('¿Estás seguro de que quieres cerrar esta sesión?')) {
      if (this.configuracion) {
        this.configuracion.sesionesDispositivos = this.configuracion.sesionesDispositivos.filter(
          (d: any) => d.id !== dispositivoId
        );
        this.configuracion.sesionesActivas = this.configuracion.sesionesDispositivos.length;
        this.configuracionActualizada.emit(this.configuracion);
      }
    }
  }

  cerrarTodasLasSesiones(): void {
    if (confirm('¿Estás seguro de que quieres cerrar todas las sesiones? Tendrás que iniciar sesión nuevamente.')) {
      if (this.configuracion) {
        // Mantener solo la sesión actual
        this.configuracion.sesionesDispositivos = this.configuracion.sesionesDispositivos.filter(
          (d: any) => d.esActual
        );
        this.configuracion.sesionesActivas = 1;
        this.configuracionActualizada.emit(this.configuracion);
      }
    }
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDispositivoIcono(dispositivo: string): string {
    if (dispositivo.toLowerCase().includes('iphone') || dispositivo.toLowerCase().includes('safari')) {
      return 'pi-mobile';
    } else if (dispositivo.toLowerCase().includes('android')) {
      return 'pi-android';
    } else {
      return 'pi-desktop';
    }
  }

  trackByDispositivo(index: number, dispositivo: DispositivoSesion): string {
    return dispositivo.id;
  }
}
