import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { Subject, takeUntil, catchError, of, switchMap } from 'rxjs';
import { EstadoPedido, IOrders } from '../../../interfaces/orders.interface';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { environment } from '../../../../environments/environment';

interface ProofReviewData {
  orden: IOrders;
}

@Component({
  selector: 'app-review-payment-proof',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TooltipModule],
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
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  private confirmationService = inject(ConfirmationService);

  private destroy$ = new Subject<void>();

  // Propiedades
  public orden: IOrders | null = null;
  public isLoading = false;
  public zoomLevel = 1;
  public razonRechazo = '';
  public showRejectReason = false;
  public pdfUrl: SafeResourceUrl | null = null;
  public pdfBlobUrl: string | null = null;
  public cargandoPDF = false;
  public errorCargaPDF = false;
  public vistaPrevia = false;

  // Notas del admin
  public notasAdmin = '';

  ngOnInit(): void {
    const data: ProofReviewData = this.config.data;
    console.log('Datos recibidos en ReviewPaymentProofComponent:', data);
    if (data?.orden) {
      this.orden = data.orden;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Liberar el blob URL si existe
    if (this.pdfBlobUrl) {
      window.URL.revokeObjectURL(this.pdfBlobUrl);
    }
  }

  /**
   * Cargar PDF como blob para visualización local
   */
  private async cargarPDFComoBlob(): Promise<void> {
    if (!this.orden?.comprobanteUrl) return;

    this.cargandoPDF = true;
    this.errorCargaPDF = false;

    try {
      const response = await fetch(this.orden.comprobanteUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'application/pdf,*/*'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar el PDF');
      }

      const blob = await response.blob();

      // Crear URL local del blob
      this.pdfBlobUrl = window.URL.createObjectURL(blob);

      // Sanitizar para uso en iframe
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl);

      console.log('PDF cargado como blob exitosamente');
    } catch (error) {
      console.error('Error cargando PDF:', error);
      this.errorCargaPDF = true;
    } finally {
      this.cargandoPDF = false;
    }
  }

  /**
   * Mostrar vista previa del comprobante
   */
  public async mostrarVistaPrevia(): Promise<void> {
    if (!this.orden?.comprobanteUrl) return;

    this.vistaPrevia = true;

    // Si es PDF y aún no se ha cargado, cargarlo ahora
    if (this.esPDF() && !this.pdfUrl && !this.cargandoPDF) {
      this.cargarPDFComoBlob();
    }

    // Si es imagen, también crear blob local para evitar problemas CORS
    if (this.esImagen() && !this.pdfBlobUrl) {
      try {
        this.cargandoPDF = true; // Reusar flag para mostrar loader

        const response = await fetch(this.orden.comprobanteUrl, {
          mode: 'cors'
        });
        const blob = await response.blob();

        // Crear URL local del blob
        this.pdfBlobUrl = window.URL.createObjectURL(blob);

        console.log('Imagen cargada como blob exitosamente');
      } catch (error) {
        console.error('Error cargando imagen:', error);
        // Si falla, usar URL directa
      } finally {
        this.cargandoPDF = false;
      }
    }
  }

  /**
   * Ocultar vista previa del comprobante
   */
  public ocultarVistaPrevia(): void {
    this.vistaPrevia = false;
  }

  /**
   * Aprobar el comprobante de pago
   */
  public aprobarComprobante(): void {
    if (!this.orden) return;

    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas aprobar este comprobante?<br><br>La orden <strong>${this.orden.numeroOrden}</strong> pasará a estado <strong>PAGADO</strong>.`,
      header: 'Confirmar Aprobación',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, Aprobar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-outlined',
      accept: () => {
        this.ejecutarAprobacion();
      }
    });
  }

  /**
   * Ejecutar la aprobación del comprobante
   */
  private ejecutarAprobacion(): void {
    if (!this.orden) return;

    this.isLoading = true;
    this.spinnerService.show();

    // Primero actualizar el estado a PAID
    this.orderService.updateOrderStatus(this.orden._id, EstadoPedido.PAID, this.notasAdmin)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((response) => {
          if (response.success) {
            // Enviar notificación al usuario
            return this.enviarNotificacion(
              this.orden!.usuarioId,
              'Pago Confirmado ✓',
              `Tu pago para la orden ${this.orden!.numeroOrden} ha sido verificado y aprobado. Comenzaremos a preparar tu pedido.`,
              'success',
              'payment',
              `/orders/order-detail?orderId=${this.orden!._id}`
            );
          }
          return of(response);
        }),
        catchError((error) => {
          console.error('Error approving proof:', error);
          return of({ success: false, message: 'Error al aprobar el comprobante' });
        })
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.spinnerService.hide();

          if (response.success !== false) {
            this.toastService.success(
              'Comprobante Aprobado',
              `La orden ${this.orden?.numeroOrden} ha sido marcada como PAGADA y el usuario ha sido notificado`
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

    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas rechazar este comprobante?<br><br>La orden <strong>${this.orden.numeroOrden}</strong> volverá a estado <strong>PENDIENTE</strong> y el usuario será notificado con la razón del rechazo.`,
      header: 'Confirmar Rechazo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Rechazar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-outlined',
      accept: () => {
        this.ejecutarRechazo();
      }
    });
  }

  /**
   * Ejecutar el rechazo del comprobante
   */
  private ejecutarRechazo(): void {
    if (!this.orden) return;

    this.isLoading = true;
    this.spinnerService.show();

    const notaCompleta = `RECHAZADO: ${this.razonRechazo}${this.notasAdmin ? '\n' + this.notasAdmin : ''}`;

    // Primero limpiar el comprobante y volver a PENDING
    this.http.put(`${environment.apiUrl}/orders/${this.orden._id}/reject-proof`, {
      razon: this.razonRechazo
    })
      .pipe(
        takeUntil(this.destroy$),
        switchMap((response: any) => {
          if (response.success) {
            // Enviar notificación al usuario
            return this.enviarNotificacion(
              this.orden!.usuarioId,
              'Comprobante Rechazado',
              `El comprobante de pago para la orden ${this.orden!.numeroOrden} fue rechazado. Motivo: ${this.razonRechazo}. Por favor, sube un comprobante válido.`,
              'warning',
              'payment',
              `/orders/order-detail?orderId=${this.orden!._id}`
            );
          }
          return of(response);
        }),
        catchError((error) => {
          console.error('Error rejecting proof:', error);
          return of({ success: false, message: 'Error al rechazar el comprobante' });
        })
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.spinnerService.hide();

          if (response.success !== false) {
            this.toastService.success(
              'Comprobante Rechazado',
              `La orden ${this.orden?.numeroOrden} ha vuelto a PENDIENTE y el usuario ha sido notificado`
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
   * Enviar notificación al usuario
   */
  private enviarNotificacion(
    userId: string,
    titulo: string,
    descripcion: string,
    tipo: 'info' | 'success' | 'warning' | 'error' | 'payment',
    notificationType: 'payment' | 'order_status',
    actionUrl?: string
  ) {
    return this.http.post(`${environment.apiUrl}/notifications`, {
      usuarioId: userId,
      title: titulo,
      description: descripcion,
      type: notificationType,
      actionUrl: actionUrl,
      actionLabel: 'Ver Orden'
    });
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
   * Abrir imagen/PDF en nueva ventana
   */
  public async abrirEnNuevaVentana(): Promise<void> {
    if (!this.orden?.comprobanteUrl) return;

    try {
      const response = await fetch(this.orden.comprobanteUrl);
      const blob = await response.blob();

      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);

      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Error abriendo PDF', err);
    }
  }


  /**
   * Descargar comprobante
   */
  public async descargarComprobante(): Promise<void> {
    if (!this.orden?.comprobanteUrl) return;

    try {
      // Determinar la extensión basándose en el tipo de archivo detectado
      let extension = '.file';

      if (this.esPDF()) {
        extension = '.pdf';
      } else if (this.esImagen()) {
        // Para imágenes, intentar detectar el tipo desde la URL
        const url = this.orden.comprobanteUrl.toLowerCase();
        if (url.includes('.png')) extension = '.png';
        else if (url.includes('.webp')) extension = '.webp';
        else if (url.includes('.gif')) extension = '.gif';
        else extension = '.jpg'; // Default para imágenes
      }

      const filename = `comprobante-${this.orden.numeroOrden}${extension}`;

      // Mostrar spinner durante la descarga
      this.spinnerService.show();

      // Descargar el archivo desde Cloudinary
      const response = await fetch(this.orden.comprobanteUrl, {
        mode: 'cors',
        headers: {
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }

      const blob = await response.blob();

      // Crear URL del blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Crear link temporal y hacer click
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      this.spinnerService.hide();
      this.toastService.success('Descarga completada', `Archivo: ${filename}`);

    } catch (error) {
      this.spinnerService.hide();
      console.error('Error descargando archivo:', error);
      this.toastService.error('Error', 'No se pudo descargar el comprobante. Intenta abrirlo en nueva ventana.');
    }
  }

  /**
   * Verificar si el comprobante es una imagen
   */
  public esImagen(): boolean {
    if (!this.orden?.comprobanteUrl) return false;
    const url = this.orden.comprobanteUrl.toLowerCase();

    // Verificar por extensión o por tipo de resource en Cloudinary
    const esImagenPorExtension = url.includes('.jpg') || url.includes('.jpeg') ||
                                  url.includes('.png') || url.includes('.webp');
    const esImagenPorCloudinary = url.includes('/image/upload/');

    // Si contiene /raw/upload/ es definitivamente un PDF o archivo raw
    if (url.includes('/raw/upload/')) return false;

    return esImagenPorExtension || esImagenPorCloudinary;
  }

  /**
   * Verificar si el comprobante es un PDF
   */
  public esPDF(): boolean {
    if (!this.orden?.comprobanteUrl) return false;
    const url = this.orden.comprobanteUrl.toLowerCase();

    // Es PDF si tiene extensión .pdf O si está en la carpeta /raw/upload/ de Cloudinary
    return url.includes('.pdf') || url.includes('/raw/upload/');
  }

  /**
   * Obtener la extensión del archivo desde la URL
   */
  private getFileExtension(): string {
    if (!this.orden?.comprobanteUrl) return '.jpg';

    const url = this.orden.comprobanteUrl.toLowerCase();

    // Si es de Cloudinary y contiene /raw/upload/, es un PDF
    if (url.includes('/raw/upload/')) {
      return '.pdf';
    }

    // Intentar extraer extensión de la URL (buscar antes de ? o # si existen)
    const urlWithoutParams = url.split('?')[0].split('#')[0];
    const parts = urlWithoutParams.split('/');
    const filename = parts[parts.length - 1];

    // Buscar extensión en el nombre del archivo
    const match = filename.match(/\.([a-z0-9]+)$/i);
    if (match && match[1]) {
      return `.${match[1]}`;
    }

    // Si contiene /image/upload/, asumir que es JPG
    if (url.includes('/image/upload/')) {
      return '.jpg';
    }

    // Por defecto
    return '.jpg';
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
