import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IProduct } from '../interfaces/products.interface';

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
