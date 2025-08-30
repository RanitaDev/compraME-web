import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { IProduct } from '../interfaces/products.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  public getProducts(): Observable<IProduct[]> {
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

  public getProduct(id: string): Observable<IProduct | undefined> {
    return this.http.get<IProduct>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo producto:', error);
          return of(undefined);
        })
      );
  }

}
