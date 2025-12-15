import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Subject, takeUntil } from 'rxjs';
import { EstadoPedido, IOrders } from '../../../interfaces/orders.interface';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';

interface ProofReviewData {
  orden: IOrders;
}

@Component({
  selector: 'app-review-payment-proof',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-payment-proof.component.html',
  styleUrls: ['./review-payment-proof.component.css']
})
export class ReviewPaymentProofComponent implements OnInit, OnDestroy {
  // Inyecciones
  private dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);

  private destroy$ = new Subject<void>();

  // Propiedades
  public orden: IOrders | null = null;
  public isLoading = false;
  public zoomLevel = 1;
  public razonRechazo = '';
  public showRejectReason = false;

  // Notas del admin
  public notasAdmin = '';

  ngOnInit(): void {
    const data: ProofReviewData = this.config.data;
    if (data?.orden) {
      this.orden = data.orden;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Aprobar el comprobante de pago
   */
  public aprobarComprobante(): void {
    if (!this.orden) return;

    if (!confirm('¿Estás seguro de que deseas aprobar este comprobante? La orden pasará a estado PAGADO.')) {
      return;
    }

    this.isLoading = true;
    this.spinnerService.show();

    this.orderService.updateOrderStatus(this.orden._id, EstadoPedido.PAID, this.notasAdmin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.spinnerService.hide();

          if (response.success) {
            this.toastService.success(
              'Comprobante Aprobado',
              `La orden ${this.orden?.numeroOrden} ha sido marcada como PAGADA`
            );
            this.dialogRef.close({ approved: true, orden: this.orden });
          } else {
            this.toastService.error('Error', response.message || 'No se pudo aprobar el comprobante');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.spinnerService.hide();
          console.error('Error approving proof:', error);
          this.toastService.error('Error', 'Ocurrió un error al aprobar el comprobante');
        }
      });
  }

  /**
   * Rechazar el comprobante de pago
   */
  public rechazarComprobante(): void {
    if (!this.orden) return;

    if (!this.razonRechazo.trim()) {
      this.toastService.warning('Razón requerida', 'Debes proporcionar una razón para rechazar el comprobante');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas rechazar este comprobante? La orden volverá a estado PENDIENTE.')) {
      return;
    }

    this.isLoading = true;
    this.spinnerService.show();

    const notaCompleta = `RECHAZADO: ${this.razonRechazo}${this.notasAdmin ? '\n' + this.notasAdmin : ''}`;

    this.orderService.updateOrderStatus(this.orden._id, EstadoPedido.PENDING, notaCompleta)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.spinnerService.hide();

          if (response.success) {
            this.toastService.success(
              'Comprobante Rechazado',
              `La orden ${this.orden?.numeroOrden} ha vuelto a estado PENDIENTE`
            );
            this.dialogRef.close({ approved: false, rejected: true, orden: this.orden });
          } else {
            this.toastService.error('Error', response.message || 'No se pudo rechazar el comprobante');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.spinnerService.hide();
          console.error('Error rejecting proof:', error);
          this.toastService.error('Error', 'Ocurrió un error al rechazar el comprobante');
        }
      });
  }

  /**
   * Mostrar/ocultar campo de razón de rechazo
   */
  public toggleRejectReason(): void {
    this.showRejectReason = !this.showRejectReason;
    if (!this.showRejectReason) {
      this.razonRechazo = '';
    }
  }

  /**
   * Cerrar el modal sin hacer cambios
   */
  public cerrar(): void {
    this.dialogRef.close({ approved: false });
  }

  /**
   * Zoom in en la imagen
   */
  public zoomIn(): void {
    if (this.zoomLevel < 3) {
      this.zoomLevel += 0.25;
    }
  }

  /**
   * Zoom out en la imagen
   */
  public zoomOut(): void {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel -= 0.25;
    }
  }

  /**
   * Reset zoom
   */
  public resetZoom(): void {
    this.zoomLevel = 1;
  }

  /**
   * Abrir imagen en nueva ventana
   */
  public abrirEnNuevaVentana(): void {
    if (this.orden?.comprobanteUrl) {
      window.open(this.orden.comprobanteUrl, '_blank');
    }
  }

  /**
   * Descargar comprobante
   */
  public descargarComprobante(): void {
    if (!this.orden?.comprobanteUrl) return;

    const link = document.createElement('a');
    link.href = this.orden.comprobanteUrl;
    link.download = `comprobante-${this.orden.numeroOrden}.jpg`;
    link.click();
  }

  /**
   * Verificar si el comprobante es una imagen
   */
  public esImagen(): boolean {
    if (!this.orden?.comprobanteUrl) return false;
    const ext = this.orden.comprobanteUrl.toLowerCase();
    return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png');
  }

  /**
   * Verificar si el comprobante es un PDF
   */
  public esPDF(): boolean {
    if (!this.orden?.comprobanteUrl) return false;
    return this.orden.comprobanteUrl.toLowerCase().endsWith('.pdf');
  }

  /**
   * Obtener información del método de pago
   */
  public getMetodoPagoInfo(): string {
    if (!this.orden) return '';

    const metodos: { [key: string]: string } = {
      'transferencia': 'Transferencia SPEI',
      'deposito': 'Depósito Bancario',
      'oxxo': 'OXXO Pay',
      'tarjeta': 'Tarjeta de Crédito/Débito',
      'paypal': 'PayPal'
    };

    return metodos[this.orden.metodoPago] || this.orden.metodoPago;
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
}
