import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EstadoPedido, IOrders } from '../../../interfaces/orders.interface';
import { OrderService } from '../../../services/order.service';
import { OrderCheckoutService } from '../../../services/order-checkout.service';
import { CheckoutStateService } from '../../../services/checkout-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';

@Component({
  selector: 'app-upload-payment-proof',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upload-payment-proof.component.html',
  styleUrls: ['./upload-payment-proof.component.css']
})
export class UploadPaymentProofComponent implements OnInit, OnDestroy {
  // Inyecciones
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private orderCheckoutService = inject(OrderCheckoutService);
  private checkoutStateService = inject(CheckoutStateService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);

  private destroy$ = new Subject<void>();

  // Propiedades
  public orden: IOrders | null = null;
  public proofForm!: FormGroup;
  public isLoading = false;
  public isSubmitting = false;
  public selectedFile: File | null = null;
  public filePreview: string | ArrayBuffer | null = null;
  public fileError: string | null = null;

  // Constantes
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  private readonly ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  private readonly FILE_TYPE_LABELS: { [key: string]: string } = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'application/pdf': 'PDF'
  };

  // Métodos de pago con instrucciones
  private readonly PAYMENT_METHOD_INFO: { [key: string]: any } = {
    'transferencia': {
      nombre: 'Transferencia SPEI',
      icono: 'pi-bank',
      instrucciones: [
        'Realiza la transferencia a la cuenta proporcionada',
        'Copia el código de referencia mostrado arriba',
        'Toma screenshot de la confirmación',
        'Sube el comprobante aquí'
      ],
      fields: ['transactionCode', 'paymentDate', 'paymentTime']
    },
    'deposito': {
      nombre: 'Depósito Bancario',
      icono: 'pi-wallet',
      instrucciones: [
        'Ve a tu banco y realiza un depósito',
        'Utiliza el código de referencia de la orden',
        'Toma una foto del comprobante',
        'Sube el comprobante aquí'
      ],
      fields: ['transactionCode', 'paymentDate', 'branch']
    },
    'oxxo': {
      nombre: 'OXXO Pay',
      icono: 'pi-shopping-bag',
      instrucciones: [
        'Ve a la tienda OXXO más cercana',
        'Pide pagar con OXXO Pay',
        'Proporciona el código de referencia',
        'Toma foto del recibo y sube aquí'
      ],
      fields: ['transactionCode', 'paymentDate', 'store']
    },
    'tarjeta': {
      nombre: 'Tarjeta de Crédito/Débito',
      icono: 'pi-credit-card',
      instrucciones: [
        'Ingresa los datos de tu tarjeta',
        'Completa el pago',
        'Toma screenshot de la confirmación',
        'Sube el comprobante aquí'
      ],
      fields: ['transactionCode', 'paymentDate', 'last4Digits']
    },
    'paypal': {
      nombre: 'PayPal',
      icono: 'pi-paypal',
      instrucciones: [
        'Inicia sesión en tu cuenta PayPal',
        'Realiza el pago',
        'Copia el ID de transacción',
        'Sube el comprobante aquí'
      ],
      fields: ['transactionCode', 'paymentDate']
    }
  };

  ngOnInit(): void {
    this.loadOrden();
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar datos de la orden desde el servidor
   */
  private loadOrden(): void {
    const ordenId = this.route.snapshot.paramMap.get('ordenId');

    if (!ordenId) {
      this.toastService.error('Error', 'No se proporcionó ID de orden');
      this.router.navigate(['/cart']);
      return;
    }

    this.isLoading = true;
    this.spinnerService.show();

    this.orderService.getOrderById(ordenId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orden) => {
          this.orden = orden;
          this.checkoutStateService.setCurrentOrder(orden);
          this.isLoading = false;
          this.spinnerService.hide();

          // Validar que la orden está en estado correcto
          if (orden.estado !== 'pending' && orden.estado !== 'proof_uploaded') {
            this.toastService.warning(
              'Estado inválido',
              'Esta orden no puede recibir comprobante en estado: ' + orden.estado
            );
            setTimeout(() => {
              this.router.navigate(['/checkout/order-created', ordenId]);
            }, 2000);
          }
        },
        error: (error) => {
          console.error('Error cargando orden:', error);
          this.isLoading = false;
          this.spinnerService.hide();
          this.toastService.error('Error', 'No se pudo cargar la orden. Intenta nuevamente.');
          setTimeout(() => this.router.navigate(['/cart']), 2000);
        }
      });
  }

  /**
   * Inicializar el formulario reactivo
   */
  private initializeForm(): void {
    this.proofForm = this.formBuilder.group({
      metodoPago: [{ value: '', disabled: true }],
      numeroOrden: [{ value: '', disabled: true }],
      montoTotal: [{ value: '', disabled: true }],
      referencia: ['', [Validators.required, Validators.minLength(3)]],
      archivo: ['', Validators.required],
      paymentDate: ['', Validators.required],
      paymentTime: [''],
      transactionCode: ['', [Validators.required, Validators.minLength(3)]],
      bancoBranch: [''], // Para depósito
      tiendaOxxo: [''], // Para OXXO
      ultimosCuatroDigitos: [''], // Para tarjeta
      notas: ['', Validators.maxLength(500)]
    });
  }

  /**
   * Manejar selección de archivo
   */
  public onFileSelected(event: any): void {
    const file = event.target.files?.[0];

    if (!file) {
      this.fileError = null;
      this.selectedFile = null;
      this.filePreview = null;
      this.proofForm.patchValue({ archivo: '' });
      return;
    }

    // Validar tipo de archivo
    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      this.fileError = `Tipo de archivo no permitido. Acepta: ${this.ALLOWED_FILE_TYPES.map(t => this.FILE_TYPE_LABELS[t]).join(', ')}`;
      this.selectedFile = null;
      this.filePreview = null;
      this.proofForm.patchValue({ archivo: '' });
      return;
    }

    // Validar tamaño de archivo
    if (file.size > this.MAX_FILE_SIZE) {
      this.fileError = `El archivo es demasiado grande. Máximo: 5 MB, Tu archivo: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
      this.selectedFile = null;
      this.filePreview = null;
      this.proofForm.patchValue({ archivo: '' });
      return;
    }

    this.selectedFile = file;
    this.fileError = null;
    this.proofForm.patchValue({ archivo: file.name });

    // Mostrar preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.filePreview = e.target?.result || null;
      };
      reader.readAsDataURL(file);
    } else {
      this.filePreview = null;
    }
  }

  /**
   * Eliminar archivo seleccionado
   */
  public removeFile(): void {
    this.selectedFile = null;
    this.filePreview = null;
    this.fileError = null;
    this.proofForm.patchValue({ archivo: '' });
  }

  /**
   * Obtener información del método de pago
   */
  public getPaymentMethodInfo(): any {
    if (!this.orden) return null;
    return this.PAYMENT_METHOD_INFO[this.orden.metodoPago] || null;
  }

  /**
   * Enviar comprobante de pago
   */
  public subirComprobante(): void {
    if (!this.proofForm.valid || !this.selectedFile || !this.orden) {
      this.toastService.warning('Formulario incompleto', 'Por favor completa todos los campos requeridos');
      return;
    }

    // Marcar todos los campos como tocados para mostrar errores
    Object.keys(this.proofForm.controls).forEach(key => {
      this.proofForm.get(key)?.markAsTouched();
    });

    if (!this.proofForm.valid) {
      return;
    }

    this.isSubmitting = true;
    this.spinnerService.show();

    // Preparar datos del comprobante
    const proofData = {
      numeroReferencia: this.proofForm.getRawValue().referencia,
      monto: this.orden.total || 0,
      metodoPago: this.orden.metodoPago,
      fechaTransaccion: new Date(`${this.proofForm.getRawValue().paymentDate}T${this.proofForm.getRawValue().paymentTime || '00:00'}:00`),
      archivo: this.selectedFile
    };

    this.orderCheckoutService.uploadPaymentProof(this.orden._id, proofData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.spinnerService.hide();

          if (response.success) {
            this.toastService.success(
              '¡Comprobante enviado!',
              'Tu comprobante ha sido subido exitosamente. El administrador lo revisará pronto.'
            );

            // Actualizar estado en servicio
            if (this.orden) {
              this.orden.estado = EstadoPedido.PROOF_UPLOADED;
              this.orden.comprobanteUrl = response.proofUrl;
              this.checkoutStateService.setCurrentOrder(this.orden);
            }

            // Redirigir a la orden después de 2 segundos
            setTimeout(() => {
              this.router.navigate(['/checkout/order-created', this.orden?._id]);
            }, 2000);
          } else {
            this.toastService.error(
              'Error al subir',
              response.message || 'No se pudo subir el comprobante. Intenta nuevamente.'
            );
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.spinnerService.hide();
          console.error('Error uploading proof:', error);

          const errorMessage = error?.error?.message || 'Error al subir el comprobante';
          this.toastService.error('Error de conexión', errorMessage);
        }
      });
  }

  /**
   * Volver a la orden sin guardar
   */
  public cancelar(): void {
    if (this.proofForm.dirty) {
      if (confirm('¿Descartar cambios sin guardar?')) {
        this.router.navigate(['/checkout/order-created', this.orden?._id]);
      }
    } else {
      this.router.navigate(['/checkout/order-created', this.orden?._id]);
    }
  }

  /**
   * Verificar si la orden ha expirado
   */
  public hasExpired(): boolean {
    if (!this.orden?.fechaLimitePago) return false;
    return new Date() > new Date(this.orden.fechaLimitePago);
  }

  /**
   * Obtener el tiempo restante formateado
   */
  public getTimeRemaining(): string {
    if (!this.orden?.fechaLimitePago) return '';

    const now = new Date();
    const deadline = new Date(this.orden.fechaLimitePago);
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) return 'Expirado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m restantes`;
  }

  /**
   * Obtener clases para el campo según validación
   */
  public getFieldClass(fieldName: string): string {
    const control = this.proofForm.get(fieldName);
    const baseClass = 'form-control';

    if (!control) return baseClass;

    if (control.invalid && control.touched) {
      return `${baseClass} is-invalid`;
    }

    if (control.valid && control.touched) {
      return `${baseClass} is-valid`;
    }

    return baseClass;
  }

  /**
   * Obtener mensaje de error para un campo
   */
  public getFieldError(fieldName: string): string {
    const control = this.proofForm.get(fieldName);

    if (!control?.errors || !control?.touched) return '';

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }

    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    return 'Campo inválido';
  }
}
