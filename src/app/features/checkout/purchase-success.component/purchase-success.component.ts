import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderDataService } from '../../../services/order-data.service';

@Component({
  selector: 'app-purchase-success',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './purchase-success.component.html',
  styleUrls: ['./purchase-success.component.css']
})
export class PurchaseSuccessComponent implements OnInit {
  orderId = signal<string>('');
  orderData = signal<any>(null);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderDataService: OrderDataService
  ) {}

  ngOnInit() {
    // Obtener parámetros de la ruta
    this.route.params.subscribe(params => {
      if (params['orderId']) {
        this.orderId.set(params['orderId']);

        // Intentar cargar datos de la orden
        const orderInfo = this.orderDataService.getOrderData(params['orderId']);
        if (orderInfo) {
          this.orderData.set(orderInfo);
        }
      }
    });
  }

  getTotal(): string {
    const data = this.orderData();
    if (data?.resumen?.total) {
      return this.formatPrice(data.resumen.total);
    }
    return '0.00';
  }

  continueShopping() {
    // Navegar a la página principal
    this.router.navigate(['/']);
  }

  viewOrderDetails() {
    // Navegar a detalles del pedido
    this.router.navigate(['/orders/order-detail'], {
      queryParams: { orderId: this.orderId() }
    });
  }

  goToSupport() {
    // Navegar a página de soporte
    console.log('Ir a soporte para orden:', this.orderId());
  }

  downloadReceipt() {
    // Implementar descarga de recibo
    console.log('Descargando recibo para orden:', this.orderId());
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }
}
