import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderDataService } from '../../../services/order-data.service';
import { PayPalService } from '../../../services/paypal.service';
import { BankService } from '../../../services/bank.service';
import { CartService } from '../../../services/cart.service';
import { DirectPurchaseService } from '../../../services/direct-purchase.service';
import { ToastService } from '../../../core/services/toast.service';
import { BankPaymentComponent } from '../bank-payment.component/bank-payment.component';
import { IOrderConfirmation } from '../../../interfaces/order-confirmation.interface';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, BankPaymentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css']
})
export class OrderConfirmationComponent implements OnInit {
  orderId?: string;

  orderData = signal<IOrderConfirmation | null>(null);
  isProcessing = signal(false);
  isSuccess = signal(false);
  isDirectPurchase = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderDataService: OrderDataService,
    private paypalService: PayPalService,
    private bankService: BankService,
    private cartService: CartService,
    private directPurchaseService: DirectPurchaseService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.orderId = params.get('orderId') || undefined;
    });

    this.route.queryParams.subscribe(params => {
      this.isDirectPurchase.set(params['type'] === 'direct');
    });

    this.loadOrderData();
  }

  private loadOrderData() {
    if (!this.orderId) {
      console.error('No se proporcionó un ID de orden');
      this.router.navigate(['/checkout']);
      return;
    }

    // Intentar cargar datos reales del servicio
    const realOrderData = this.orderDataService.getOrderData(this.orderId);

    if (realOrderData) {
      this.orderData.set(realOrderData);
      console.log('Datos de orden cargados exitosamente:', realOrderData);
    } else {
      console.error('No se encontraron datos para la orden:', this.orderId);
      // Redirigir al checkout si no hay datos de orden
      this.router.navigate(['/checkout']);
    }
  }

  async processPurchase() {
    if (this.isProcessing() || this.isSuccess()) return;

    const orderData = this.orderData();
    console.log('Iniciando proceso de compra para la orden:', orderData);
    if (!orderData) {
      console.error('No hay datos de orden disponibles');
      return;
    }

    // Detectar tipo de método de pago
    const paymentType = orderData.metodoPago.tipo;
    const isBankPayment = paymentType === 'deposito' || paymentType === 'transferencia' || paymentType === 'oxxo';
    const isPayPal = paymentType === 'paypal';

    this.isProcessing.set(true);

    try {
      const orderId = orderData.ordenId;
      if (!orderId) {
        throw new Error('No se encontró el ID de la orden');
      }

      if (isPayPal) {
        await this.processPayPalPayment(orderId);
      } else if (isBankPayment) {
        this.isProcessing.set(false);
        // El flujo bancario se maneja en el template con el componente BankPaymentComponent
      } else {
        // Flujo normal para otros métodos de pago (tarjeta, etc)
        const result = await this.orderDataService.processPayment(orderId);

        if (result.success) {
          this.clearCartAfterPayment();
          this.isSuccess.set(true);
          this.isProcessing.set(false);

          setTimeout(() => {
            this.router.navigate(['/checkout/purchase-success', orderId]);
          }, 2000);
        } else {
          this.isProcessing.set(false);
          this.toastService.error('Error al procesar pago', result.error || 'Error desconocido al procesar el pago');
        }
      }
    } catch (error) {
      this.isProcessing.set(false);
      console.error('Error en processPurchase:', error);
      this.toastService.error('Error inesperado', 'Por favor, intenta nuevamente');
    }
  }

  onBankPaymentCompleted(success: boolean) {
    if (success) {
      this.clearCartAfterPayment();
      this.isSuccess.set(true);
      const orderData = this.orderData();
      if (orderData?.ordenId) {
        setTimeout(() => {
          this.router.navigate(['/checkout/purchase-success', orderData.ordenId]);
        }, 2000);
      }
    }
  }

  private clearCartAfterPayment() {
    if (!this.isDirectPurchase()) {
      this.cartService.clearCart().then(success => {
        // Carrito vaciado exitosamente después del pago
      }).catch(error => {
        console.error('Error vaciando carrito:', error);
      });
    } else {
      this.directPurchaseService.clearDirectPurchase();
    }
  }

  private async processPayPalPayment(orderId: string): Promise<void> {
    try {
      const orderData = this.orderData();
      if (!orderData) {
        throw new Error('No hay datos de orden disponibles');
      }

      console.log('Iniciando proceso PayPal para orden:', orderId);

      // Verificar si PayPal está configurado
      if (!this.paypalService.isPayPalConfigured()) {
        console.warn('PayPal no está configurado. Usando simulación temporal.');
        // Fallback a simulación temporal
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.clearCartAfterPayment();
        this.isSuccess.set(true);
        this.isProcessing.set(false);
        setTimeout(() => {
          this.router.navigate(['/checkout/purchase-success', orderId]);
        }, 2000);
        return;
      }

      // Preparar datos para PayPal
      const paypalOrderData = {
        orderId: orderId,
        amount: orderData.resumen.total,
        items: orderData.productos.map(producto => ({
          name: producto.nombre,
          quantity: producto.cantidad,
          price: producto.precio
        })),
        shipping: {
          name: orderData.direccionEntrega.nombreCompleto,
          address: orderData.direccionEntrega.direccionCompleta
        }
      };

      // Procesar pago con PayPal
      const result = await this.paypalService.processPayPalPayment(paypalOrderData);

      if (result.success && result.approvalUrl) {
        // Redirigir al usuario a PayPal para aprobar el pago
        window.location.href = result.approvalUrl;
      } else {
        this.isProcessing.set(false);
        console.error('Error en PayPal:', result.error);
        this.toastService.error('Error PayPal', result.error || 'Error al procesar el pago con PayPal. Por favor, intenta nuevamente.');
      }

    } catch (error) {
      console.error('Error en processPayPalPayment:', error);
      this.isProcessing.set(false);
      throw error;
    }
  }  getTotalItems(): number {
    return this.orderData()?.productos.reduce((total, producto) => total + producto.cantidad, 0) || 0;
  }

  getBankPaymentType(): 'deposito' | 'transferencia' | 'oxxo' {
    const orderData = this.orderData();
    const tipo = orderData?.metodoPago.tipo;
    return (tipo === 'deposito' || tipo === 'transferencia' || tipo === 'oxxo') ? tipo : 'transferencia';
  }

  goBackToCheckout() {
    const queryParams = this.isDirectPurchase() ? { type: 'direct' } : {};
    this.router.navigate(['/checkout'], { queryParams });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
}
