import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface EstadisticasUsuario {
  totalCompras: number;
  montoTotal: number;
  productosComprados: number;
  comprasEsteAno: number;
}

interface PedidoReciente {
  id: string;
  numero: string;
  fecha: Date;
  estado: 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado';
  total: number;
  productos: number;
  imagen?: string;
}

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-orders.html',
  styleUrl: './user-orders.css'
})
export class UserOrders {
  @Input() pedidos: any[] = [];
  @Input() estadisticas: any = null;
  @Input() vistaMovil: boolean = false;
  @Output() verHistorialCompleto = new EventEmitter<void>();


  pedidosEjemplo: PedidoReciente[] = [
    {
      id: '1',
      numero: 'ORD-2024-001',
      fecha: new Date('2024-01-15'),
      estado: 'entregado',
      total: 1299.99,
      productos: 3,
      imagen: '/assets/placeholderImage.webp'
    },
    {
      id: '2',
      numero: 'ORD-2024-002',
      fecha: new Date('2024-01-20'),
      estado: 'enviado',
      total: 799.50,
      productos: 2,
      imagen: '/assets/placeholderImage.webp'
    },
    {
      id: '3',
      numero: 'ORD-2024-003',
      fecha: new Date('2024-01-25'),
      estado: 'procesando',
      total: 2150.00,
      productos: 5,
      imagen: '/assets/placeholderImage.webp'
    }
  ];

  estadisticasEjemplo: EstadisticasUsuario = {
    totalCompras: 15,
    montoTotal: 12450.75,
    productosComprados: 42,
    comprasEsteAno: 8
  };

  ngOnInit() {
    if (!this.pedidos || this.pedidos.length === 0) {
      this.pedidos = this.pedidosEjemplo;
    }
    if (!this.estadisticas) {
      this.estadisticas = this.estadisticasEjemplo;
    }
  }

  getEstadoColor(estado: string): string {
    const colores = {
      'pendiente': 'text-yellow-600 bg-yellow-100',
      'procesando': 'text-blue-600 bg-blue-100',
      'enviado': 'text-purple-600 bg-purple-100',
      'entregado': 'text-green-600 bg-green-100',
      'cancelado': 'text-red-600 bg-red-100'
    };
    return colores[estado as keyof typeof colores] || 'text-gray-600 bg-gray-100';
  }

  getEstadoTexto(estado: string): string {
    const textos = {
      'pendiente': 'Pendiente',
      'procesando': 'Procesando',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return textos[estado as keyof typeof textos] || estado;
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(precio);
  }

  verDetallesPedido(pedido: PedidoReciente): void {
    console.log('Ver detalles del pedido:', pedido);
    // Aquí se implementaría la navegación a los detalles del pedido
  }

  onVerHistorialCompleto(): void {
    this.verHistorialCompleto.emit();
  }

  trackByPedido(index: number, pedido: PedidoReciente): string {
    return pedido.id;
  }
}
