import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IProduct } from '../../../interfaces/products.interface';
import { CartService } from '../../../services/cart.service';
import { ProductService } from '../../../services/products.service';
import { ToastService } from '../../../core/services/toast.service';

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
    private cartService: CartService,
    private productService: ProductService,
    private toastService: ToastService
  ) {}

  ngOnInit() {

    // Obtener los datos de la navegación
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['query'] || '';
      const selectedId = params['selectedId'];

      // Intentar obtener el estado de navegación
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
        // Si no hay estado, hacer una búsqueda nueva con el término
        if (this.searchQuery && this.searchQuery !== 'búsqueda') {
          this.performSearchFromQuery(this.searchQuery, selectedId);
        } else {
          console.error('❌ Sin datos para mostrar, redirigiendo al inicio');
          this.router.navigate(['/']);
        }
      }
    });
  }

  /**
   * Realiza una búsqueda usando el query parameter cuando no hay estado de navegación
   */
  private performSearchFromQuery(query: string, selectedId?: string): void {
    this.isLoading = true;

    this.productService.searchProducts(query).subscribe({
      next: (products) => {
        this.allProducts = products;

        // Si hay un selectedId, intentar encontrar ese producto
        if (selectedId) {
          this.selectedProduct = products.find(p => p._id === selectedId) || null;
          if (this.selectedProduct) {
            this.reorderProducts(selectedId);
          }
        }

        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error en búsqueda:', error);
        this.allProducts = [];
        this.filteredProducts = [];
        this.isLoading = false;
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
  goToProduct(product: IProduct): void {
    try {
      if (product && product._id) {
        this.router.navigate(['/product', product._id]);
      } else {
        console.error('Producto inválido:', product);
      }
    } catch (error) {
      console.error('Error al navegar al producto:', error);
    }
  }

  /**
   * Agrega un producto al carrito
   */
  async addToCart(product: IProduct): Promise<void> {
    try {
      if (!product) {
        console.error('Producto inválido');
        return;
      }

      if (product.stock <= 0) {
        this.toastService.warning('No hay suficiente stock disponible');
        return;
      }

      const success = await this.cartService.agregarAlCarrito(product, 1);
      if (!success) this.toastService.warning('No se pudo agregar el producto al carrito.');

    } catch (error) {
      console.error('Error al agregar al carrito:', error);
    }
  }

  /**
   * Navega de regreso
   */
  goBack(): void {
    try {
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error al navegar de regreso:', error);
    }
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

  /**
   * Maneja el error de carga de imágenes
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/assets/placeholderImage.webp';
    }
  }
}
