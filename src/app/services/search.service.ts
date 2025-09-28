import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { IProduct } from '../interfaces/products.interface';
import { ProductService } from './products.service';

export interface SearchResult {
  query: string;
  products: IProduct[];
  totalFound: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchSubject = new Subject<string>();
  private currentSearchResults = new BehaviorSubject<SearchResult | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public searchResults$ = this.currentSearchResults.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();

  // Cache simple para evitar búsquedas duplicadas
  private cache = new Map<string, IProduct[]>();

  constructor(private productService: ProductService) {
    this.setupSearchStream();
  }

  private setupSearchStream(): void {
    this.searchSubject.pipe(
      debounceTime(300), // Esperar 300ms después de que el usuario deje de escribir
      distinctUntilChanged(), // Solo buscar si el término cambió
      switchMap(term => this.performSearch(term))
    ).subscribe(result => {
      this.currentSearchResults.next(result);
      this.isLoadingSubject.next(false);
    });
  }

  private performSearch(term: string): Observable<SearchResult | null> {
    if (!term.trim() || term.trim().length < 2) {
      return of(null);
    }

    const normalizedTerm = term.toLowerCase().trim();

    // Verificar cache
    if (this.cache.has(normalizedTerm)) {
      const cachedProducts = this.cache.get(normalizedTerm)!;
      return of({
        query: term,
        products: cachedProducts,
        totalFound: cachedProducts.length
      });
    }

    // Realizar búsqueda
    return this.productService.searchProducts(term).pipe(
      switchMap(products => {
        // Guardar en cache
        this.cache.set(normalizedTerm, products);

        // Limpiar cache si tiene más de 20 entradas
        if (this.cache.size > 20) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey) {
            this.cache.delete(firstKey);
          }
        }

        return of({
          query: term,
          products: products,
          totalFound: products.length
        });
      })
    );
  }

  /**
   * Inicia una búsqueda
   */
  public search(term: string): void {
    if (term.trim().length === 0) {
      this.currentSearchResults.next(null);
      this.isLoadingSubject.next(false);
      return;
    }

    this.isLoadingSubject.next(true);
    this.searchSubject.next(term);
  }

  /**
   * Limpia los resultados de búsqueda
   */
  public clearResults(): void {
    this.currentSearchResults.next(null);
    this.isLoadingSubject.next(false);
  }

  /**
   * Obtiene el resultado actual
   */
  public getCurrentResults(): SearchResult | null {
    return this.currentSearchResults.value;
  }

  /**
   * Limpia la cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}
