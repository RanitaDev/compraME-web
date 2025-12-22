import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Subject, takeUntil } from 'rxjs';
import { IOrders, EstadoPedido } from '../../../interfaces/orders.interface';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';

interface ChangeStatusData {
  orden: IOrders;
}

interface StatusOption {
  value: EstadoPedido;
  label: string;
  description: string;
  icon: string;
  color: string;
  disabled: boolean;
}

@Component({
  selector: 'app-change-order-status',
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf, FormsModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './change-order-status.component.html',
  styleUrls: ['./change-order-status.component.css']
})
export class ChangeOrderStatusComponent implements OnInit, OnDestroy {
  // Inyecciones
  private dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  private confirmationService = inject(ConfirmationService);
  private confirmService = inject(ConfirmService);

  private destroy$ = new Subject<void>();

  // Propiedades
  public orden: IOrders | null = null;
  public selectedStatus: EstadoPedido | null = null;
  public notasAdmin = '';
  public razonCancelacion = '';
  public isLoading = false;
  public statusOptions: StatusOption[] = [];

  // Flujo de estados permitidos
  private readonly statusFlow: { [key in EstadoPedido]: EstadoPedido[] } = {
    [EstadoPedido.PENDING]: [EstadoPedido.PROOF_UPLOADED, EstadoPedido.PAID, EstadoPedido.CANCELED, EstadoPedido.EXPIRED],
    [EstadoPedido.PROOF_UPLOADED]: [EstadoPedido.PAID, EstadoPedido.PENDING, EstadoPedido.CANCELED, EstadoPedido.EXPIRED],
    [EstadoPedido.PAID]: [EstadoPedido.SHIPPED, EstadoPedido.CANCELED],
    [EstadoPedido.SHIPPED]: [EstadoPedido.DELIVERED, EstadoPedido.CANCELED],
    [EstadoPedido.DELIVERED]: [],
    [EstadoPedido.CANCELED]: [],
    [EstadoPedido.EXPIRED]: []
  };

  ngOnInit(): void {
    const data: ChangeStatusData = this.config.data;
    if (data?.orden) {
      this.orden = data.orden;
      this.initializeStatusOptions();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializar opciones de estados
   */
  private initializeStatusOptions(): void {
    if (!this.orden) return;

    const currentStatus = this.orden.estado;
    const allowedStatuses = this.statusFlow[currentStatus] || [];

    const allStatuses: StatusOption[] = [
      {
        value: EstadoPedido.PENDING,
        label: 'Pendiente',
        description: 'Si el comprobante no ha sido subido, está borroso o es inválido, cambia a este estatus para avisar al cliente y subair uno nuevo',
        icon: 'pi-clock',
        color: '#f59e0b',
        disabled: !allowedStatuses.includes(EstadoPedido.PENDING)
      },
      {
        value: EstadoPedido.PROOF_UPLOADED,
        label: 'Comprobante Subido',
        description: 'El cliente ha subido un comprobante de pago y está pendiente de verificación',
        icon: 'pi-upload',
        color: '#3b82f6',
        disabled: !allowedStatuses.includes(EstadoPedido.PROOF_UPLOADED)
      },
      {
        value: EstadoPedido.PAID,
        label: 'Pagado',
        description: 'Tras revisar el comprobante adjunto, selecciona este estatus para confirmar que el pago ha sido recibido. Se notificará al cliente que su pedido está siendo procesado.',
        icon: 'pi-check-circle',
        color: '#10b981',
        disabled: !allowedStatuses.includes(EstadoPedido.PAID)
      },
      {
        value: EstadoPedido.SHIPPED,
        label: 'Enviado',
        description: 'Si el pedido ha sido enviado al cliente, selecciona este estatus para notificarle que su orden está en camino. Se notificará al cliente con los detalles de envío.',
        icon: 'pi-send',
        color: '#8b5cf6',
        disabled: !allowedStatuses.includes(EstadoPedido.SHIPPED)
      },
      {
        value: EstadoPedido.DELIVERED,
        label: 'Completado',
        description: 'Una vez que el cliente haya recibido su pedido, selecciona este estatus para marcar la orden como completada. Se notificará al cliente que su pedido ha sido entregado con éxito.',
        icon: 'pi-verified',
        color: '#059669',
        disabled: !allowedStatuses.includes(EstadoPedido.DELIVERED)
      },
      {
        value: EstadoPedido.CANCELED,
        label: 'Cancelado',
        description: 'Si por alguna razón el pedido debe ser cancelado, selecciona este estatus. Asegúrate de proporcionar una razón para la cancelación en el campo correspondiente.',
        icon: 'pi-times-circle',
        color: '#ef4444',
        disabled: !allowedStatuses.includes(EstadoPedido.CANCELED)
      },
      {
        value: EstadoPedido.EXPIRED,
        label: 'Expirado',
        description: 'Si el cliente no ha subido su comprobante de pago y el sistema no lo inhabilita automáticamente, puedes marcar la orden como expirada para liberar el stock y notificar al cliente.',
        icon: 'pi-ban',
        color: '#6b7280',
        disabled: !allowedStatuses.includes(EstadoPedido.EXPIRED)
      }
    ];

    this.statusOptions = allStatuses;
  }

  /**
   * Cambiar el estado de la orden
   */
  public cambiarEstado(): void {
    if (!this.orden || !this.selectedStatus) {
      this.toastService.warning('Estado requerido', 'Debes seleccionar un estado');
      return;
    }

    // Validación especial para cancelación
    if (this.selectedStatus === EstadoPedido.CANCELED && !this.razonCancelacion.trim()) {
      this.toastService.warning('Razón requerida', 'Debes proporcionar una razón para cancelar la orden');
      return;
    }

    const statusLabel = this.getStatusLabel(this.selectedStatus);

    this.confirmService.confirm({
      message: `¿Estás seguro de cambiar el estado a "${statusLabel}"?`,
      icon: 'pi pi-info-circle',
      acceptLabel: 'Aceptar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.ejecutarCambioEstado(statusLabel);
      }
    });
  }

  private ejecutarCambioEstado(statusLabel: string): void {
    if (!this.orden || !this.selectedStatus) return;

    this.isLoading = true;
    this.spinnerService.show();

    let notaCompleta = this.notasAdmin;
    if (this.selectedStatus === EstadoPedido.CANCELED && this.razonCancelacion) {
      notaCompleta = `CANCELADO: ${this.razonCancelacion}${this.notasAdmin ? '\n' + this.notasAdmin : ''}`;
    }

    this.orderService.updateOrderStatus(this.orden._id, this.selectedStatus, notaCompleta)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.spinnerService.hide();

          if (response.success) {
            this.toastService.success(
              'Estado Actualizado',
              `La orden ${this.orden?.numeroOrden} ha sido actualizada a ${statusLabel}`
            );
            this.dialogRef.close({ updated: true, newStatus: this.selectedStatus, orden: this.orden });
          } else {
            this.toastService.error('Error', response.message || 'No se pudo actualizar el estado');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.spinnerService.hide();
          console.error('Error updating status:', error);
          this.toastService.error('Error', 'Ocurrió un error al actualizar el estado');
        }
      });
  }

  /**
   * Obtener label del estado
   */
  private getStatusLabel(status: EstadoPedido): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  }

  /**
   * Cerrar el modal
   */
  public cerrar(): void {
    this.dialogRef.close({ updated: false });
  }

  /**
   * Verificar si se requiere razón de cancelación
   */
  public requiereCancelacion(): boolean {
    return this.selectedStatus === EstadoPedido.CANCELED;
  }

  /**
   * Formatear fecha
   */
  public formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Formatear precio
   */
  public formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Obtener badge del estado actual
   */
  public getStatusBadge(status: string): { class: string; label: string } {
    const badges: { [key: string]: { class: string; label: string } } = {
      'pending': { class: 'badge-warning', label: 'Pendiente' },
      'proof_uploaded': { class: 'badge-info', label: 'Comprobante Subido' },
      'paid': { class: 'badge-success', label: 'Pagado' },
      'shipped': { class: 'badge-primary', label: 'Enviado' },
      'completed': { class: 'badge-completed', label: 'Completado' },
      'canceled': { class: 'badge-danger', label: 'Cancelado' },
      'expired': { class: 'badge-secondary', label: 'Expirado' }
    };

    return badges[status] || { class: 'badge-secondary', label: status };
  }
}
