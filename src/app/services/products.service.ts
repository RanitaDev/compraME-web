import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  getProducts(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
