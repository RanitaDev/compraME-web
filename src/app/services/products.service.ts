import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.get<any>(`${this.apiUrl}/products`);
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
