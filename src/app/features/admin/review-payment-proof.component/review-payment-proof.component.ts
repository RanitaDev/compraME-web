import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
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
