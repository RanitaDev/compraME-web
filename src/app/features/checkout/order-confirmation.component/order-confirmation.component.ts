import { Component, OnInit, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderDataService } from '../../../services/order-data.service';
import { OrderService } from '../../../services/order.service';
import { OrderMonitorService } from '../../../services/order-monitor.service';
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
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  orderId?: string;

  orderData = signal<IOrderConfirmation | null>(null);
  isProcessing = signal(false);
  isSuccess = signal(false);
  isDirectPurchase = signal(false);

    expandedSections = signal({
      info: true,
      direccion: false,
      productos: false,
      metodoPago: false,
      entrega: false,
      resumen: true
    });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderDataService: OrderDataService,
    private orderService: OrderService,
    private orderMonitorService: OrderMonitorService,
    private paypalService: PayPalService,
    private bankService: BankService,
    private cartService: CartService,
    private directPurchaseService: DirectPurchaseService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const orderIdParam = params.get('orderId');
      this.orderId = orderIdParam || undefined;
    });

    this.route.queryParams.subscribe(params => {
      this.isDirectPurchase.set(params['type'] === 'direct');
    });

    this.loadOrderData();
  }

  ngOnDestroy() {
    // Detener monitoreo cuando el componente se destruye
    if (this.orderId) {
      this.orderMonitorService.stopMonitoring(this.orderId);
    }
  }

  private loadOrderData() {
    if (!this.orderId) {
      this.router.navigate(['/checkout']);
      return;
    }

    const localOrderData = this.orderDataService.getOrderData(this.orderId);

    if (localOrderData) {
      this.orderData.set(localOrderData);
      this.startOrderMonitoring();
    } else {

      this.orderService.getOrderById(this.orderId).subscribe({
        next: (backendOrder) => {

          if (!backendOrder) {
            console.error('Backend retornó undefined o null');
            this.toastService.error('Error', 'No se encontraron datos de la orden.');
            this.router.navigate(['/checkout']);
            return;
          }

          // Convertir datos del backend al formato IOrderConfirmation
          const orderConfirmation = this.convertBackendOrderToConfirmation(backendOrder);
          this.orderData.set(orderConfirmation);
          this.startOrderMonitoring();
        },
        error: (error) => {
          console.error('Error al obtener orden del backend:', error);
          console.error('Error completo:', JSON.stringify(error, null, 2));
          this.toastService.error('Error', 'No se pudo cargar la información de la orden.');
          this.router.navigate(['/checkout']);
        }
      });
    }
  }

  /**
   * Iniciar monitoreo de la orden para detectar cambios de estado
   */
  private startOrderMonitoring() {
    if (!this.orderId) return;

    // Solo monitorear si la orden viene de carrito (no compra directa)
    const isFromCart = !this.isDirectPurchase();
    this.orderMonitorService.startMonitoring(this.orderId, isFromCart);
  }

  /**
   * Convertir orden del backend al formato IOrderConfirmation
   */
  private convertBackendOrderToConfirmation(backendOrder: any): IOrderConfirmation {

    return {
      ordenId: backendOrder._id || backendOrder.id,
      fecha: new Date(backendOrder.fechaPedido || backendOrder.createdAt || Date.now()),
      estado: backendOrder.estado === 'pending' ? 'pendiente' : backendOrder.estado,
      cliente: {
        nombre: backendOrder.direccionEnvio?.nombreCompleto || 'Usuario',
        email: 'usuario@email.com', // Esto debería venir del backend
        telefono: backendOrder.direccionEnvio?.telefono || ''
      },
      direccionEntrega: {
        nombreCompleto: backendOrder.direccionEnvio?.nombreCompleto || '',
        telefono: backendOrder.direccionEnvio?.telefono || '',
        direccionCompleta: this.buildFullAddressFromBackend(backendOrder.direccionEnvio),
        referencias: backendOrder.direccionEnvio?.referencias || ''
      },
      productos: backendOrder.productos?.map((item: any) => ({
        idProducto: item.productoId,
        nombre: item.nombre,
        imagen: item.imagen || '/assets/placeholder.jpg',
        cantidad: item.cantidad,
        precio: item.precioUnitario,
        subtotal: item.subtotal
      })) || [],
      resumen: {
        subtotal: backendOrder.subtotal || 0,
        impuestos: backendOrder.impuestos || 0,
        envio: backendOrder.costoEnvio || 0,
        total: backendOrder.total || 0
      },
      metodoPago: {
        tipo: backendOrder.tipoMetodoPago,
        nombre: backendOrder.metodoPago,
        ultimosDigitos: undefined
      },
      entregaEstimada: {
        fechaMinima: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        fechaMaxima: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        diasHabiles: 3
      }
    };
  }

  /**
   * Construir dirección completa desde los datos del backend
   */
  private buildFullAddressFromBackend(direccionEnvio: any): string {
    if (!direccionEnvio) return 'Dirección no especificada';

    const parts = [
      direccionEnvio.calle,
      direccionEnvio.numeroExterior,
      direccionEnvio.numeroInterior,
      direccionEnvio.colonia,
      direccionEnvio.ciudad,
      direccionEnvio.estado,
      direccionEnvio.codigoPostal
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Dirección no especificada';
  }

  async processPurchase() {
    if (this.isProcessing() || this.isSuccess()) return;

    const orderData = this.orderData();
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
      this.isSuccess.set(true);
      const orderData = this.orderData();
      if (orderData?.ordenId) {
        setTimeout(() => {
          this.router.navigate(['/checkout/purchase-success', orderData.ordenId]);
        }, 2000);
      }
    } else {
      this.orderDataService.clearOrderData();
      if (this.isDirectPurchase()) {
        this.directPurchaseService.clearDirectPurchase();
      }
      this.router.navigate(['/home']);
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
  }

  getTotalItems(): number {
    return this.orderData()?.productos.reduce((total, producto) => total + producto.cantidad, 0) || 0;
  }

  toggleSection(section: 'info' | 'direccion' | 'productos' | 'metodoPago' | 'entrega' | 'resumen') {
    const current = this.expandedSections();
    this.expandedSections.set({
      ...current,
      [section]: !current[section]
    });
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
