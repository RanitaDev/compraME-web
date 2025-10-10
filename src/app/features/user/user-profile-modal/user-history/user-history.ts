import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PedidoHistorial {
  id: string;
  numero: string;
  fecha: Date;
  estado: 'entregado' | 'cancelado' | 'reembolsado';
  total: number;
  productos: ProductoHistorial[];
  direccionEnvio: string;
  metodoPago: string;
}

interface ProductoHistorial {
  id: string;
  nombre: string;
  imagen: string;
  cantidad: number;
  precio: number;
}

@Component({
  selector: 'app-user-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-history.html',
  styleUrl: './user-history.css'
})
export class UserHistory {
  @Input() cargandoHistorial: boolean = false;
  @Input() historialCompleto: any[] = [];
  @Input() vistaMovil: boolean = false;

  // Datos de ejemplo para la demostración
  historialEjemplo: PedidoHistorial[] = [
    {
      id: '1',
      numero: 'ORD-2024-001',
      fecha: new Date('2024-01-15'),
      estado: 'entregado',
      total: 1299.99,
      direccionEnvio: 'Av. Insurgentes Sur 1234, Del Valle, México, CDMX',
      metodoPago: 'Tarjeta de crédito **** 1234',
      productos: [
        {
          id: '1',
          nombre: 'Smartphone Samsung Galaxy S24',
          imagen: '/assets/placeholderImage.webp',
          cantidad: 1,
          precio: 899.99
        },
        {
          id: '2',
          nombre: 'Funda protectora',
          imagen: '/assets/placeholderImage.webp',
          cantidad: 1,
          precio: 199.99
        },
        {
          id: '3',
          nombre: 'Protector de pantalla',
          imagen: '/assets/placeholderImage.webp',
          cantidad: 2,
          precio: 100.00
        }
      ]
    },
    {
      id: '2',
      numero: 'ORD-2024-002',
      fecha: new Date('2024-01-20'),
      estado: 'entregado',
      total: 799.50,
      direccionEnvio: 'Paseo de la Reforma 567, Juárez, México, CDMX',
      metodoPago: 'PayPal',
      productos: [
        {
          id: '4',
          nombre: 'Auriculares Bluetooth',
          imagen: '/assets/placeholderImage.webp',
          cantidad: 1,
          precio: 499.50
        },
        {
          id: '5',
          nombre: 'Cable USB-C',
          imagen: '/assets/placeholderImage.webp',
          cantidad: 1,
          precio: 300.00
        }
      ]
    },
    {
      id: '3',
      numero: 'ORD-2024-003',
      fecha: new Date('2024-01-25'),
      estado: 'cancelado',
      total: 2150.00,
      direccionEnvio: 'Av. Insurgentes Sur 1234, Del Valle, México, CDMX',
      metodoPago: 'Tarjeta de débito **** 5678',
      productos: [
        {
          id: '6',
          nombre: 'Laptop Dell XPS 13',
          imagen: '/assets/placeholderImage.webp',
          cantidad: 1,
          precio: 1950.00
        },
        {
          id: '7',
          nombre: 'Mouse inalámbrico',
          imagen: '/assets/placeholderImage.webp',
          cantidad: 1,
          precio: 200.00
        }
      ]
    }
  ];

  ngOnInit() {
    // No agregar datos de ejemplo automáticamente
    // El historial debe venir de la base de datos real
  }

  getEstadoColor(estado: string): string {
    const colores = {
      'entregado': 'text-green-600 bg-green-100',
      'cancelado': 'text-red-600 bg-red-100',
      'reembolsado': 'text-orange-600 bg-orange-100'
    };
    return colores[estado as keyof typeof colores] || 'text-gray-600 bg-gray-100';
  }

  getEstadoTexto(estado: string): string {
    const textos = {
      'entregado': 'Entregado',
      'cancelado': 'Cancelado',
      'reembolsado': 'Reembolsado'
    };
    return textos[estado as keyof typeof textos] || estado;
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(precio);
  }

  reordenarProductos(pedido: PedidoHistorial): void {
    console.log('Reordenar productos del pedido:', pedido);
    // Aquí se implementaría la funcionalidad de reordenar
  }

  descargarFactura(pedido: PedidoHistorial): void {
    console.log('Descargar factura del pedido:', pedido);
    // Aquí se implementaría la descarga de factura
  }

  trackByPedido(index: number, pedido: PedidoHistorial): string {
    return pedido.id;
  }

  trackByProducto(index: number, producto: ProductoHistorial): string {
    return producto.id;
  }
}
