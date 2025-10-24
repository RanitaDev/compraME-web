import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankService } from '../../../services/bank.service';
import { ToastService } from '../../../core/services/toast.service';
import { IBankInstructions, IBankPaymentData, IPaymentProof } from '../../../interfaces/bank-payment.interface';

@Component({
  selector: 'app-bank-payment',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bank-payment.component.html',
  styleUrls: ['./bank-payment.component.css']
})
export class BankPaymentComponent {
  @Input() orderId: string = '';
  @Input() amount: number = 0;
  @Input() paymentType: 'deposito' | 'transferencia' | 'oxxo' = 'transferencia';
  @Output() paymentCompleted = new EventEmitter<boolean>();
  @Output() goBack = new EventEmitter<void>();

  instructions = signal<IBankInstructions | null>(null);
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  uploadProgress = signal(0);
  showSuccess = signal(false);

  constructor(
    private bankService: BankService,
    private toastService: ToastService
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      const validation = this.bankService.validatePaymentProof(file);
      if (!validation.valid) {
        this.toastService.warning('Archivo inválido', validation.error || '');
        return;
      }

      this.selectedFile.set(file);
    }
  }

  removeFile() {
    this.selectedFile.set(null);
  }

  async submitPayment() {
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

  onGoBack() {
    this.goBack.emit();
  }
}
