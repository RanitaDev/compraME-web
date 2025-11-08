import { IProduct } from './../interfaces/products.interface';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of, map } from 'rxjs';
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

  public getProductsByCategory(categoriaId: string): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this.apiUrl}/categoria/${categoriaId}`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo productos por categoría:', error);
          return of([]);
        })
      );
  }

  /**
   * Busca productos por término de búsqueda
   */
  public searchProducts(searchTerm: string): Observable<IProduct[]> {
    if (!searchTerm.trim()) {
      return of([]);
    }

    return this.http.get<IProduct[]>(`${this.apiUrl}/search?q=${encodeURIComponent(searchTerm.trim())}`)
      .pipe(
        catchError(error => {
          console.error('Error buscando productos:', error);
          // Fallback: buscar localmente en todos los productos
          return this.getProducts().pipe(
            map(products => this.filterProductsLocally(products, searchTerm))
          );
        })
      );
  }

  public agregarProducto(producto: IProduct): Observable<IProduct | undefined> {
    return this.http.post<IProduct>(`${this.apiUrl}/agregar-producto`, producto)
      .pipe(
        catchError(error => {
          console.error('Error agregando producto:', error);
          return of(undefined);
        })
      );
  }

  /**
   * Filtrado local de productos (fallback)
   */
  private filterProductsLocally(products: IProduct[], searchTerm: string): IProduct[] {
    const term = searchTerm.toLowerCase().trim();
    return products.filter(product =>
      product.activo && (
        product.nombre.toLowerCase().includes(term) ||
        product.descripcion.toLowerCase().includes(term)
      )
    ).slice(0, 10); // Limitar a 10 resultados
  }

}
