// category.service.ts
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
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

  public crearCategoria(categoria: Category): Observable<Category | undefined> {
    return this.http.post<Category>(`${this.apiUrl}/agregar-categoria`, categoria)
      .pipe(
        catchError(error => {
          console.error('Error creando categoría:', error);
          return of(undefined);
        })
      );
  }

  public actualizarCategoria(idCategoria: string, categoria: Category): Observable<Category | undefined> {
    return this.http.put<Category>(`${this.apiUrl}/actualizar/${idCategoria}`, categoria)
      .pipe(
        catchError(error => {
          console.error('Error actualizando categoría:', error);
          return of(undefined);
        })
      );
  }

  public eliminarCategoria(idCategoria: number): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/eliminar/${idCategoria}`)
      .pipe(
        catchError(error => {
          console.error('Error eliminando categoría:', error);
          return of({ success: false });
        }),
        // Mapear la respuesta para devolver solo el booleano
        map(response => response.success)
      );
  }
}
