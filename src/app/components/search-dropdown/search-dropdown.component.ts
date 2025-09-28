import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchService, SearchResult } from '../../services/search.service';
import { IProduct } from '../../interfaces/products.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Dropdown de resultados -->
    <div
      #dropdown
      class="search-dropdown absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200/50 shadow-xl backdrop-blur-md z-50 max-h-96 overflow-hidden transition-all duration-200"
      [class.show]="isVisible && (searchResults || isLoading)"
      [class.hide]="!isVisible || (!searchResults && !isLoading)">

      <!-- Loading State -->
      <div *ngIf="isLoading" class="p-4">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          <span class="text-sm text-gray-600">Buscando productos...</span>
        </div>
      </div>

      <!-- Results -->
      <div *ngIf="!isLoading && searchResults" class="max-h-96 overflow-y-auto">
        <!-- Header with results count -->
        <div class="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
          <span class="text-xs font-medium text-gray-500">
            {{ searchResults.totalFound }} {{ searchResults.totalFound === 1 ? 'producto encontrado' : 'productos encontrados' }}
          </span>
        </div>

        <!-- Product list -->
        <div *ngIf="searchResults.products.length > 0" class="py-2">
          <button
            *ngFor="let product of searchResults.products; let i = index; trackBy: trackByProductId"
            type="button"
            class="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors duration-150 group text-left"
            (click)="onProductClick(product, searchResults.products)"
            [attr.aria-label]="'Seleccionar ' + product.nombre">

            <!-- Product image -->
            <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img
                [src]="product.imagenes[0] || '/assets/placeholderImage.webp'"
                [alt]="'Imagen de ' + product.nombre"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
                (error)="onImageError($event)">
            </div>

            <!-- Product info -->
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                {{ product.nombre }}
              </h4>
              <p class="text-sm font-medium text-emerald-600 mt-1">
                \${{ product.precio | number:'1.0-0' }}
              </p>
              <p *ngIf="product.stock <= 5 && product.stock > 0" class="text-xs text-amber-600 mt-1">
                Solo {{ product.stock }} disponibles
              </p>
              <p *ngIf="product.stock === 0" class="text-xs text-red-500 mt-1">
                Sin stock
              </p>
            </div>

            <!-- Arrow icon -->
            <div class="flex-shrink-0 text-gray-400 group-hover:text-indigo-500 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </button>
        </div>

        <!-- No results -->
        <div *ngIf="searchResults.products.length === 0" class="p-6 text-center">
          <div class="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-gray-700 mb-1">Sin resultados</p>
          <p class="text-xs text-gray-500">Intenta con otros términos</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-dropdown {
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      pointer-events: none;
    }

    .search-dropdown.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: auto;
    }

    /* Scrollbar personalizado */
    .overflow-y-auto::-webkit-scrollbar {
      width: 4px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `]
})
export class SearchDropdownComponent implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Input() searchTerm = '';
  @Output() productSelected = new EventEmitter<{product: IProduct, allProducts: IProduct[]}>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('dropdown') dropdown!: ElementRef;

  public searchResults: SearchResult | null = null;
  public isLoading = false;

  private searchSubscription?: Subscription;
  private loadingSubscription?: Subscription;

  constructor(
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit() {
    // Suscribirse a los resultados de búsqueda
    this.searchSubscription = this.searchService.searchResults$.subscribe(
      results => {
        this.searchResults = results;
      }
    );

    // Suscribirse al estado de loading
    this.loadingSubscription = this.searchService.isLoading$.subscribe(
      loading => {
        this.isLoading = loading;
      }
    );
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
    this.loadingSubscription?.unsubscribe();
  }

  public onProductClick(product: IProduct, allProducts: IProduct[]): void {
    this.productSelected.emit({ product, allProducts });
    this.close.emit();
  }

  public onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/placeholderImage.webp';
  }

  public trackByProductId(index: number, product: IProduct): string {
    return product._id;
  }
}
