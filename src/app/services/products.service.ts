// product.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IProduct } from '../interfaces/products.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: IProduct[] = [
    {
      idProducto: 1,
      nombre: 'Auriculares Bluetooth Premium',
      descripcion: 'Experimenta una calidad de sonido excepcional con cancelación de ruido activa y hasta 30 horas de batería.',
      precio: 299.99,
      stock: 15,
      imagenes: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop'
      ],
      idCategoria: 1,
      activo: true,
      fechaCreacion: new Date('2024-01-15'),
      fechaActualizacion: new Date('2024-08-01'),
      color: '#667eea',
      destacado: true
    },
    {
      idProducto: 2,
      nombre: 'Smartwatch Deportivo',
      descripcion: 'Monitorea tu salud 24/7 con GPS integrado, resistente al agua y más de 100 modos deportivos.',
      precio: 399.99,
      stock: 8,
      imagenes: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=600&fit=crop'
      ],
      idCategoria: 2,
      activo: true,
      fechaCreacion: new Date('2024-02-20'),
      fechaActualizacion: new Date('2024-07-15'),
      color: '#48bb78',
      destacado: true
    },
    {
      idProducto: 3,
      nombre: 'Cámara Digital 4K',
      descripcion: 'Captura momentos increíbles con resolución 4K, estabilización óptica y lente intercambiable.',
      precio: 899.99,
      stock: 5,
      imagenes: [
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=600&fit=crop'
      ],
      idCategoria: 3,
      activo: true,
      fechaCreacion: new Date('2024-03-10'),
      fechaActualizacion: new Date('2024-08-05'),
      color: '#ed8936',
      destacado: true
    },
    {
      idProducto: 4,
      nombre: 'Laptop Gaming Pro',
      descripcion: 'Rendimiento extremo para gaming con procesador de última generación y tarjeta gráfica dedicada.',
      precio: 1499.99,
      stock: 3,
      imagenes: [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop'
      ],
      idCategoria: 4,
      activo: true,
      fechaCreacion: new Date('2024-01-25'),
      fechaActualizacion: new Date('2024-07-20'),
      color: '#9f7aea',
      destacado: true
    },
    {
      idProducto: 5,
      nombre: 'Tablet Básica',
      descripcion: 'Tablet económica para uso básico.',
      precio: 199.99,
      stock: 10,
      imagenes: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=600&fit=crop'],
      idCategoria: 5,
      activo: true,
      fechaCreacion: new Date('2024-04-01'),
      fechaActualizacion: new Date('2024-08-01'),
      color: '#4299e1',
      destacado: false // Este NO aparecerá en el banner
    }
  ];

  getProducts(): Observable<IProduct[]> {
    return of(this.products);
  }

  getFeaturedProducts(): Observable<IProduct[]> {
    const featuredProducts = this.products.filter(product =>
      product.destacado && product.activo && product.stock > 0
    );
    return of(featuredProducts);
  }

  getProduct(id: number): Observable<IProduct | undefined> {
    return of(this.products.find(product => product.idProducto === id));
  }
}
