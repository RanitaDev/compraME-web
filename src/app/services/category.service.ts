// category.service.ts
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { Category } from '../interfaces/categories.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  public getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo categorías:', error);
          return of([]);
        })
      );
  }

  public getActiveCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/activo`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo categorías activas:', error);
          return of([]);
        })
      );
  }

  public getCategory(idCategoria: string): Observable<Category | undefined> {
    return this.http.get<Category | undefined>(`${this.apiUrl}/${idCategoria}`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo categoría:', error);
          return of(undefined);
        })
      );
  }
}
