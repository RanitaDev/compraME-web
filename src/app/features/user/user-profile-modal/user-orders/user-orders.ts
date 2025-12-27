import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { OrderService } from '../../../../services/order.service';
import { AuthService } from '../../../../services/auth.service';
import { IOrderItem, IOrders } from '../../../../interfaces/orders.interface';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-orders.html',
  styleUrl: './user-orders.css'
})
export class UserOrders implements OnInit, OnDestroy {
  @Input() pedidos: IOrders[] = [];
  @Input() estadisticas: any = null;
  @Input() vistaMovil: boolean = false;
  @Output() verHistorialCompleto = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  selectedOrder: IOrders | null = null;

  constructor(private orderService: OrderService, private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.orderService.getUserOrders(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(list => {
          this.pedidos = list.sort((a,b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime());
          console.log('Pedidos del usuario cargados:', this.pedidos);
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public obtenerTitulo(productos: IOrderItem[]): string {
    if (productos.length === 1) return productos[0].nombre;
    if (productos.length > 1) return `${productos[0].nombre} ... y más`;
    return 'Pedido sin productos';
  }

  formatearFecha(fecha: Date | string): string {
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precio);
  }

  abrirDetalles(pedido: IOrders) {
    this.selectedOrder = pedido;
  }

  cerrarDetalles() {
    this.selectedOrder = null;
  }

  getEstadoTexto(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'PENDING':
      case 'PENDIENTE':
        return 'Pendiente';
      case 'PROCESSING':
      case 'EN_PROCESO':
        return 'En proceso';
      case 'COMPLETED':
      case 'COMPLETADO':
        return 'Completado';
      case 'CANCELLED':
      case 'CANCELADO':
        return 'Cancelado';
      case 'DELETED':
      case 'ELIMINADO':
        return 'Eliminado';
      default:
        return estado || 'Desconocido';
    }
  }

  getEstadoColor(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'PENDING':
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'CANCELADO':
        return 'bg-red-100 text-red-800';
      case 'DELETED':
      case 'ELIMINADO':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  onVerHistorialCompleto(): void {
    this.verHistorialCompleto.emit();
  }

  trackByPedido(index: number, pedido: IOrders): string {
    return pedido._id;
  }
}
