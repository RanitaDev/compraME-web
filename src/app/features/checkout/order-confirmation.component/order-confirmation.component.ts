import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
    private route: ActivatedRoute
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
    // Simulación de datos de la orden
    setTimeout(() => {
      const mockOrderData: IOrderConfirmation = {
        ordenId: 'ORD-87654321',
        fecha: new Date(),
        estado: 'pendiente',
        cliente: {
          nombre: 'Juan Carlos Pérez',
          email: 'juan.perez@email.com',
          telefono: '477-123-4567'
        },
        direccionEntrega: {
          nombreCompleto: 'Juan Carlos Pérez',
          telefono: '477-123-4567',
          direccionCompleta: 'Av. López Mateos 123, Depto 4B, Centro, León, Guanajuato 37000',
          referencias: 'Casa azul, frente al parque'
        },
        productos: [
          {
            idProducto: 1,
            nombre: 'Auriculares Bluetooth Premium',
            imagen: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
            cantidad: 2,
            precio: 299.99,
            subtotal: 599.98
          },
          {
            idProducto: 2,
            nombre: 'Smartwatch Deportivo',
            imagen: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
            cantidad: 1,
            precio: 399.99,
            subtotal: 399.99
          }
        ],
        resumen: {
          subtotal: 999.97,
          impuestos: 159.99,
          envio: 0, // Envío gratis por monto
          total: 1159.96
        },
        metodoPago: {
          tipo: 'tarjeta',
          nombre: 'Tarjeta de Crédito Visa',
          ultimosDigitos: '4242'
        },
        entregaEstimada: {
          fechaMinima: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
          fechaMaxima: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
          diasHabiles: 3
        }
      };

      this.orderData.set(mockOrderData);
    }, 1000);
  }

  processPurchase() {
    if (this.isProcessing() || this.isSuccess()) return;

    this.isProcessing.set(true);

    // Simulación del proceso de compra con diferentes etapas
    setTimeout(() => {
      // Simular éxito o fallo (95% éxito)
      const success = Math.random() > 0.05;

      if (success) {
        this.isSuccess.set(true);
        this.isProcessing.set(false);

        // Redirigir a página de éxito después de mostrar animación
        setTimeout(() => {
          this.router.navigate(['/purchase-success', this.orderData()?.ordenId]);
        }, 2000);
      } else {
        this.isProcessing.set(false);
        alert('Error al procesar el pago. Por favor, intenta nuevamente.');
      }
    }, 3000); // 3 segundos de procesamiento
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
