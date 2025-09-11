import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderDataService } from '../../../services/order-data.service';
import { IOrderConfirmation } from '../../../interfaces/order-confirmation.interface';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css']
})
export class OrderConfirmationComponent implements OnInit {
  orderId?: string;

  orderData = signal<IOrderConfirmation | null>(null);
  isProcessing = signal(false);
  isSuccess = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderDataService: OrderDataService
  ) {}

  ngOnInit() {
    // Obtener el orderId de los parámetros de la ruta
    this.route.paramMap.subscribe(params => {
      this.orderId = params.get('orderId') || undefined;
      console.log('Order ID recibido:', this.orderId);
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

    this.isProcessing.set(true);

    try {
      const orderId = this.orderData()?.ordenId;
      if (!orderId) {
        throw new Error('No se encontró el ID de la orden');
      }

      // Procesar pago usando el servicio
      const result = await this.orderDataService.processPayment(orderId);

      if (result.success) {
        this.isSuccess.set(true);
        this.isProcessing.set(false);

        // Redirigir a página de éxito después de mostrar animación
        setTimeout(() => {
          this.router.navigate(['/checkout/purchase-success', orderId]);
        }, 2000);
      } else {
        this.isProcessing.set(false);
        alert(result.error || 'Error al procesar el pago. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      this.isProcessing.set(false);
      console.error('Error en processPurchase:', error);
      alert('Error inesperado. Por favor, intenta nuevamente.');
    }
  }

  getTotalItems(): number {
    return this.orderData()?.productos.reduce((total, producto) => total + producto.cantidad, 0) || 0;
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
