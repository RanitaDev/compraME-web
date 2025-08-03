import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { IProduct } from '../interfaces/products.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = 'https://tu-backend.com/api/products';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de productos destacados desde el backend.
   * @returns Observable con la lista de productos destacados.
   */
  getProducts(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error al obtener los productos:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene un producto específico por su ID.
   * @param id - ID del producto a obtener.
   * @returns Observable con los detalles del producto.
   */
  getProductById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

}
