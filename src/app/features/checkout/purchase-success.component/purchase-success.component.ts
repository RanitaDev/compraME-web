import { Component, OnInit, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-purchase-success',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './purchase-success.component.html',
  styleUrls: ['./purchase-success.component.css']
})
export class PurchaseSuccessComponent implements OnInit {
  @Input() orderNumber?: string;
  @Input() amount?: number;

  orderId = signal<string>('ORD-87654321');
  totalAmount = signal<string>('1,159.96');

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Obtener parámetros de la ruta si existen
    this.route.params.subscribe(params => {
      if (params['orderId']) {
        this.orderId.set(params['orderId']);
      }
    });

    // Obtener query params si existen
    this.route.queryParams.subscribe(params => {
      if (params['amount']) {
        this.totalAmount.set(this.formatPrice(parseFloat(params['amount'])));
      }
    });

    // Usar inputs si están disponibles
    if (this.orderNumber) {
      this.orderId.set(this.orderNumber);
    }
    if (this.amount) {
      this.totalAmount.set(this.formatPrice(this.amount));
    }
  }

  continueShopping() {
    // Navegar a la página principal o catálogo
    this.router.navigate(['/']);
  }

  viewOrderDetails() {
    // Navegar a detalles del pedido
    this.router.navigate(['/my-orders', this.orderId()]);
  }

  goToSupport() {
    // Navegar a página de soporte o abrir chat
    this.router.navigate(['/support']);
  }

  downloadReceipt() {
    // Implementar descarga de recibo
    console.log('Descargando recibo para orden:', this.orderId());
    // Aquí implementarías la lógica para generar/descargar el PDF del recibo
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }
}
