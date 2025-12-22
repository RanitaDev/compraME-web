import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';
import { BankService } from '../../../services/bank.service';
import { OrderMonitorService } from '../../../services/order-monitor.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../services/utils/confirmation.service';
import { IBankInstructions, IBankPaymentData, IPaymentProof } from '../../../interfaces/bank-payment.interface';

@Component({
  selector: 'app-bank-payment',
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf, FileUploadModule],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './bank-payment.component.html',
  styleUrls: ['./bank-payment.component.css']
})
export class BankPaymentComponent {
  @Input() orderId: string = '';
  @Input() amount: number = 0;
  @Input() paymentType: 'deposito' | 'transferencia' | 'oxxo' = 'transferencia';
  @Input() isFromCart: boolean = false; // Para saber si debe limpiar el carrito
  @Output() paymentCompleted = new EventEmitter<boolean>();
  @Output() goBack = new EventEmitter<void>();

  instructions = signal<IBankInstructions | null>(null);
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  uploadProgress = signal(0);
  showSuccess = signal(false);
  isCanceling = signal(false);

  constructor(
    private bankService: BankService,
    private orderMonitorService: OrderMonitorService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadInstructions();
  }

  private loadInstructions() {
    this.bankService.generatePaymentInstructions(this.orderId, this.amount, this.paymentType)
      .subscribe({
        next: (instructions) => {
          this.instructions.set(instructions);
        },
        error: (error) => {
          this.toastService.error('Error', 'No se pudieron cargar las instrucciones de pago');
        }
      });
  }

onFileSelected(event: any) {
    const file = event.files[0];
    console.log('File selected via PrimeNG:', file);

    if (!file) return;

    const validation = this.bankService.validatePaymentProof(file);
    if (!validation.valid) {
      console.log('Validation failed:', validation.error);
      this.toastService.warning('Archivo inválido', validation.error || '');
      return;
    }

    this.selectedFile.set(file);
    console.log('File set in signal:', this.selectedFile());
    this.toastService.quickSuccess(`Archivo "${file.name}" seleccionado`);
  }

  removeFile() {
    console.log('removeFile called');
    this.selectedFile.set(null);
  }

  async submitPayment() {
    console.log('INICIAMOS EL PROCESO');
    const file = this.selectedFile();
    const instructionsData = this.instructions();

    if (!file || !instructionsData) {
      this.toastService.warning('Información faltante', 'Por favor selecciona un comprobante');
      return;
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    const paymentProof: IPaymentProof = {
      archivo: file,
      numeroReferencia: instructionsData.numeroReferencia,
      fechaTransaccion: new Date(),
      monto: this.amount,
      metodoPago: this.paymentType
    };

    const paymentData: IBankPaymentData = {
      orderId: this.orderId,
      cuentaDestino: instructionsData.cuenta,
      numeroReferencia: instructionsData.numeroReferencia,
      monto: this.amount,
      comprobante: paymentProof
    };

    this.simulateUploadProgress();

    this.bankService.uploadPaymentProof(paymentData).subscribe({
      next: (result) => {
        this.isUploading.set(false);
        if (result.success) {
          this.showSuccess.set(true);
          this.toastService.success('¡Comprobante enviado!', 'Tu pago está siendo verificado');
          this.orderMonitorService.startMonitoring(this.orderId, this.isFromCart);

          setTimeout(() => {
            this.paymentCompleted.emit(true);
          }, 2000);
        } else {
          this.toastService.error('Error', result.error || 'Error al procesar el comprobante');
        }
      },
      error: (error) => {
        this.isUploading.set(false);
        this.toastService.error('Error de conexión', 'Verifica tu internet e intenta nuevamente');
      }
    });
  }

  private simulateUploadProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 95) {
        progress = 95;
      }
      this.uploadProgress.set(progress);

      if (progress >= 95) {
        clearInterval(interval);
      }
    }, 200);

    setTimeout(() => {
      this.uploadProgress.set(100);
      clearInterval(interval);
    }, 1800);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.quickSuccess('Copiado al portapapeles');
    });
  }

  cancelOrder() {
    const descripcion = this.isFromCart
      ? 'Esta orden se cancelará y los productos del carrito se borrarán. El producto dejará de estar apartado para ti, ¿continuar?'
      : 'Esta orden se cancelará, el producto dejará de estar apartado para ti, ¿continuar?';

    this.confirmationService.confirmar({
      titulo: 'Cancelar Orden',
      descripcion: descripcion,
      textoConfirmar: 'Sí, cancelar',
      textoCancelar: 'No, volver',
      tipoConfirmacion: 'warning'
    }).subscribe(resultado => {
      if (!resultado.confirmado) {
        return;
      }

      this.isCanceling.set(true);

      this.bankService.cancelOrder(this.orderId).subscribe({
        next: (result) => {
          this.isCanceling.set(false);
          if (result.success) {
            this.toastService.success('Orden cancelada', 'El stock ha sido liberado correctamente');
            this.orderMonitorService.stopMonitoring(this.orderId);

            this.paymentCompleted.emit(false);
          } else {
            this.toastService.error('Error', result.message || 'No se pudo cancelar la orden');
          }
        },
        error: (error) => {
          this.isCanceling.set(false);
          this.toastService.error('Error', 'Ocurrió un error al cancelar la orden');
        }
      });
    });
  }

  private preguntarRestaurarCarrito() {
    const cartBackup = localStorage.getItem('cart_backup_before_order');

    if (!cartBackup || !this.isFromCart) {
      this.paymentCompleted.emit(false);
      return;
    }

    this.confirmationService.confirmar({
      titulo: '¿Restaurar carrito?',
      descripcion: 'Tienes productos guardados de tu sesión anterior. ¿Deseas recuperarlos para seguir comprando?',
      textoConfirmar: 'Sí, restaurar',
      textoCancelar: 'No, ir a inicio',
      tipoConfirmacion: 'info'
    }).subscribe(resultado => {
      if (resultado.confirmado) {
        this.restaurarCarritoDesdeBackup();
      } else {
        localStorage.removeItem('cart_backup_before_order');
        this.paymentCompleted.emit(false);
      }
    });
  }

  private async restaurarCarritoDesdeBackup() {
    const cartBackupStr = localStorage.getItem('cart_backup_before_order');

    if (!cartBackupStr) {
      this.paymentCompleted.emit(false);
      return;
    }

    try {
      const cartBackup = JSON.parse(cartBackupStr);
      const items = cartBackup.items || [];

      if (items.length === 0) {
        localStorage.removeItem('cart_backup_before_order');
        this.paymentCompleted.emit(false);
        return;
      }

      let successCount = 0;
      for (const item of items) {
        const producto = {
          _id: item.idProducto,
          nombre: item.nombre,
          precio: item.precio,
          descripcion: '',
          stock: 999,
          imagenes: [],
          activo: true,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
          color: '',
          destacado: false
        };

        const success = await this.bankService.agregarAlCarrito(producto, item.cantidad);
        if (success) {
          successCount++;
        }
      }

      localStorage.removeItem('cart_backup_before_order');

      if (successCount > 0) {
        this.toastService.success('Carrito restaurado', `Se restauraron ${successCount} productos`);
      }

      this.paymentCompleted.emit(false);
    } catch (error) {
      localStorage.removeItem('cart_backup_before_order');
      this.toastService.error('Error', 'No se pudo restaurar el carrito');
      this.paymentCompleted.emit(false);
    }
  }

  onGoBack() {
    this.goBack.emit();
  }
}
