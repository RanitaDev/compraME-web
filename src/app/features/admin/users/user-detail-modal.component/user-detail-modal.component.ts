import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { UserService } from '../../../../services/user.service';
import { IUsuario, IEstadisticasUsuario } from '../../../../interfaces/users.interface';
import { finalize } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../services/utils/confirmation.service';

@Component({
  selector: 'app-user-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-detail-modal.component.html',
  styleUrls: ['./user-detail-modal.component.css']
})
export class UserDetailModalComponent implements OnInit {
  usuario: IUsuario | null = null;
  estadisticas: IEstadisticasUsuario | null = null;
  activeTab: 'info' | 'pedidos' = 'info';
  isDeleting = false;

  constructor(
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private userService: UserService,
    private toastService: ToastService,
    private confirmacionService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const userId = this.config.data?.userId;
    if (userId) {
      this.loadUserData(userId);
    }
  }

  private loadUserData(userId: string): void {
    this.userService.obtenerDatosCompletos(userId)
      .pipe(finalize(() => {}))
      .subscribe({
        next: (datos) => {
          this.usuario = datos.usuario;
          this.estadisticas = datos.estadisticas;
        },
        error: (error) => {
          console.error('Error cargando datos del usuario:', error);
          this.toastService.error?.('Error al cargar los datos del usuario');
        }
      });
  }

  onDeleteUser(): void {
    if (!this.usuario) return;

    this.confirmacionService.confirmar({
      titulo: 'Eliminar usuario',
      descripcion: `¿Estás seguro de que deseas eliminar a ${this.usuario.nombre} ${this.usuario.apellidos}? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Cancelar',
      tipoConfirmacion: 'danger'
    }).subscribe((resultado) => {
      if (resultado.confirmado && this.usuario) {
        this.isDeleting = true;

        this.userService.eliminarUsuario(this.usuario.id)
          .pipe(finalize(() => this.isDeleting = false))
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.toastService.success('Usuario eliminado exitosamente');
                this.ref.close({ success: true, action: 'deleted' });
              } else {
                this.toastService.error?.('No fue posible eliminar el usuario');
              }
            },
            error: () => {
              this.toastService.error?.('Error al eliminar el usuario');
            }
          });
      }
    });
  }

  closeModal(): void {
    this.ref.close({ success: false, action: 'cancelled' });
  }

  getInitials(): string {
    if (!this.usuario) return '';
    const firstInitial = this.usuario.nombre?.charAt(0).toUpperCase() || '';
    const lastInitial = this.usuario.apellidos?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  getRolBadgeClass(rolId: string): string {
    const classes: { [key: string]: string } = {
      'admin': 'bg-purple-100 text-purple-800',
      'cliente': 'bg-blue-100 text-blue-800'
    };
    return classes[rolId] || 'bg-gray-100 text-gray-800';
  }

  getRolText(rolId: string): string {
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'cliente': 'Cliente'
    };
    return roles[rolId] || 'Desconocido';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'No disponible';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(dateObj);
  }
}
