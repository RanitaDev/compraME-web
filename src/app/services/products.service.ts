import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { IProduct } from '../interfaces/products.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de productos destacados desde el backend.
   * @returns Observable con la lista de productos destacados.
   */
  getProducts(): Observable<any> {
    // Datos hardcodeados mientras no hay conexión a BD
    const featuredProducts = [
      {
        id: '1',
        title: 'iPhone 15 Pro Max',
        description: 'El smartphone más avanzado de Apple con chip A17 Pro y cámaras profesionales.',
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
        color: '#6366f1',
        price: 1299.99,
        destacado: true
      },
      {
        id: '2',
        title: 'MacBook Air M3',
        description: 'La laptop más delgada y ligera de Apple, ahora con el poderoso chip M3.',
        image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
        color: '#8b5cf6',
        price: 1199.99,
        destacado: true
      },
      {
        id: '3',
        title: 'AirPods Pro 2',
        description: 'Auriculares inalámbricos con cancelación activa de ruido de segunda generación.',
        image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400',
        color: '#06b6d4',
        price: 249.99,
        destacado: true
      },
      {
        id: '4',
        title: 'Apple Watch Ultra 2',
        description: 'El reloj inteligente más resistente y versátil para deportes extremos.',
        image: 'https://images.unsplash.com/photo-1579586337278-3f436f6d4f96?w=400',
        color: '#f59e0b',
        price: 799.99,
        destacado: true
      },
      {
        id: '5',
        title: 'iPad Pro 12.9"',
        description: 'La tablet más potente con pantalla Liquid Retina XDR y chip M2.',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
        color: '#10b981',
        price: 1099.99,
        destacado: true
      }
    ];

    // Simular respuesta del backend con delay
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(featuredProducts.filter(product => product.destacado));
        observer.complete();
      }, 500);
    });
  }

  /**
   * Obtiene un producto por ID
   * @param id ID del producto
   * @returns Observable con el producto encontrado
   */
  getProductById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`);
  }

  /**
   * Crear un nuevo producto
   * @param product Datos del producto a crear
   * @returns Observable con el producto creado
   */
  createProduct(product: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.apiUrl}/products`, product, { headers });
  }

  /**
   * Actualizar un producto existente
   * @param id ID del producto a actualizar
   * @param product Datos actualizados del producto
   * @returns Observable con el producto actualizado
   */
  updateProduct(id: string, product: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<any>(`${this.apiUrl}/products/${id}`, product, { headers });
  }

  /**
   * Eliminar un producto
   * @param id ID del producto a eliminar
   * @returns Observable con la respuesta del servidor
   */
  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`);
  }

}
