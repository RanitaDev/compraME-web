// product.service.ts
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { IProduct } from '../interfaces/products.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getProducts(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this.apiUrl}/`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo productos:', error);
          return of([]);
        })
      );
  }

  getFeaturedProducts(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this.apiUrl}/destacado`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo productos destacados:', error);
          return of([]);
        })
      );
  }

  getProduct(id: number): Observable<IProduct | undefined> {
    return this.http.get<IProduct>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo producto:', error);
          return of(undefined);
        })
      );
  }
}
