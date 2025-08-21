import { Component, OnInit, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { IOrderDetail, IOrders } from '../../../interfaces/orders.interface';
import { OrderDetailService } from '../../../services/order-detail.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  @Input() orderId?: string;

  orderDetail = signal<IOrderDetail | null>(null);
  isCanceling = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderDetailService: OrderDetailService
  ) {}

  ngOnInit() {
    // Obtener orderId de la ruta o del input
    const id = this.orderId || this.route.snapshot.params['orderId'];
    if (id) {
      this.loadOrderDetail(id);
    }
  }

  private loadOrderDetail(orderId: string) {
    this.orderDetailService.getOrderDetail(orderId).subscribe({
      next: (detail) => {
        this.orderDetail.set(detail);
      },
      error: (error) => {
        console.error('Error loading order detail:', error);
        // Manejar error - mostrar mensaje o redirigir
      }
    });
  }

  cancelOrder() {
    const order = this.orderDetail();
    if (!order || order.order.status !== 'pending') return;

    if (confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
      this.isCanceling.set(true);

      this.orderDetailService.cancelOrder(order.order.id).subscribe({
        next: (result) => {
          this.isCanceling.set(false);
          if (result.success) {
            // Actualizar el estado local
            const updatedOrder = { ...order };
            updatedOrder.order.status = 'canceled';
            this.orderDetail.set(updatedOrder);
            alert('Pedido cancelado exitosamente');
          } else {
            alert(result.message);
          }
        },
        error: (error) => {
          this.isCanceling.set(false);
          console.error('Error canceling order:', error);
          alert('Error al cancelar el pedido. Intenta nuevamente.');
        }
      });
    }
  }

  trackPackage() {
    const shipping = this.orderDetail()?.shipping;
    if (shipping?.trackingNumber) {
      this.orderDetailService.trackOrder(shipping.trackingNumber).subscribe({
        next: (result) => {
          if (result.success && result.url) {
            window.open(result.url, '_blank');
          }
        }
      });
    }
  }

  downloadInvoice() {
    const orderId = this.orderDetail()?.order.id;
    console.log('Descargando factura para pedido:', orderId);
    // Implementar descarga de factura
  }

  contactSupport() {
    // Redirigir a página de soporte o abrir chat
    this.router.navigate(['/support'], {
      queryParams: { orderId: this.orderDetail()?.order.id }
    });
  }

  goBack() {
    this.router.navigate(['/my-orders']);
  }

  getTotalItems(): number {
    return this.orderDetail()?.order.items.reduce((total, item) => total + item.quantity, 0) || 0;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'completed': 'Completado',
      'canceled': 'Cancelado'
    };
    return labels[status] || status;
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

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
