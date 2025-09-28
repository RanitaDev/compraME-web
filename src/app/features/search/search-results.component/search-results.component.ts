import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IProduct } from '../../../interfaces/products.interface';
import { CartService } from '../../../services/cart.service';

// Interface para los filtros
interface ProductFilters {
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  featured: boolean;
}

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit {

  // Datos principales
  searchQuery = '';
  selectedProduct: IProduct | null = null;
  allProducts: IProduct[] = [];
  filteredProducts: IProduct[] = [];

  // Estados del componente
  isLoading = true;
  searchTerm = '';

  // Filtros
  filters: ProductFilters = {
    minPrice: null,
    maxPrice: null,
    inStock: false,
    featured: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit() {
    // Obtener los datos de la navegación
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['query'] || '';
      const selectedId = params['selectedId'];

      // Obtener los productos del estado de navegación
      const navigationState = this.router.getCurrentNavigation()?.extras.state;
      if (navigationState) {
        this.allProducts = navigationState['products'] || [];
        this.selectedProduct = navigationState['selectedProduct'] || null;

        // Ordenar productos poniendo el seleccionado primero
        if (this.selectedProduct && selectedId) {
          this.reorderProducts(selectedId);
        }

        this.applyFilters();
        this.isLoading = false;
      } else {
        // Si no hay estado, redirigir al inicio
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Reordena los productos poniendo el seleccionado primero
   */
  private reorderProducts(selectedId: string): void {
    const selectedIndex = this.allProducts.findIndex(p => p._id === selectedId);
    if (selectedIndex > 0) {
      const selected = this.allProducts[selectedIndex];
      this.allProducts.splice(selectedIndex, 1);
      this.allProducts.unshift(selected);
    }
  }

  /**
   * Aplica todos los filtros (búsqueda + filtros laterales)
   */
  private applyFilters() {
    let filtered = [...this.allProducts];

    // Filtro de búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(searchLower) ||
        product.descripcion.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de precio mínimo
    if (this.filters.minPrice !== null && this.filters.minPrice >= 0) {
      filtered = filtered.filter(product => product.precio >= this.filters.minPrice!);
    }

    // Filtro de precio máximo
    if (this.filters.maxPrice !== null && this.filters.maxPrice >= 0) {
      filtered = filtered.filter(product => product.precio <= this.filters.maxPrice!);
    }

    // Filtro de disponibilidad
    if (this.filters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    // Filtro de productos destacados
    if (this.filters.featured) {
      filtered = filtered.filter(product => product.destacado);
    }

    this.filteredProducts = filtered;
  }

  /**
   * Maneja cambios en el campo de búsqueda
   */
  onSearchChange() {
    // Debounce simple para evitar muchas llamadas
    setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  /**
   * Maneja cambios en los filtros laterales
   */
  onFiltersChange() {
    this.applyFilters();
  }

  /**
   * Establece un rango de precio predefinido
   */
  setPriceRange(min: number, max: number) {
    this.filters.minPrice = min;
    this.filters.maxPrice = max === 999999 ? null : max;
    this.applyFilters();
  }

  /**
   * Limpia el término de búsqueda
   */
  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.filters = {
      minPrice: null,
      maxPrice: null,
      inStock: false,
      featured: false
    };
    this.searchTerm = '';
    this.applyFilters();
  }

  /**
   * Navega al detalle del producto
   */
  goToProduct(product: IProduct) {
    this.router.navigate(['/product', product._id]);
  }

  /**
   * Agrega un producto al carrito
   */
  async addToCart(product: IProduct) {
    if (product.stock > 0) {
      try {
        const success = await this.cartService.agregarAlCarrito(product, 1);
        if (success) {
          console.log('Producto agregado al carrito:', product.nombre);
        } else {
          console.warn('No hay suficiente stock disponible');
        }
      } catch (error) {
        console.error('Error al agregar al carrito:', error);
      }
    }
  }

  /**
   * Navega de regreso
   */
  goBack() {
    this.router.navigate(['/']);
  }

  /**
   * Formatea el precio para mostrar
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Calcula el porcentaje de stock para la barra visual
   */
  getStockPercentage(stock: number): number {
    const maxStock = 20;
    return Math.min((stock / maxStock) * 100, 100);
  }
}
