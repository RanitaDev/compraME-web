import { IProduct } from '../../../interfaces/products.interface';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../../../interfaces/categories.interface';
import { ProductService } from '../../../services/products.service';
import { CategoryService } from '../../../services/category.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../core/services/toast.service';

// Interface para los filtros
interface ProductFilters {
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  featured: boolean;
}

// Interface para rangos de precio predefinidos
interface PriceRange {
  label: string;
  min: number;
  max: number;
}

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-products.component.html',
  styleUrls: ['./category-products.component.css']
})
export class CategoryProductsComponent implements OnInit {

  // Datos principales
  currentCategory: Category | null = null;
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

  // Rangos de precio predefinidos
  priceRanges: PriceRange[] = [
    { label: '$0 - $500', min: 0, max: 500 },
    { label: '$500 - $1K', min: 500, max: 1000 },
    { label: '$1K - $2K', min: 1000, max: 2000 },
    { label: '$2K+', min: 2000, max: 999999 }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private toastService: ToastService
  ) {}

  /**
   * Método del ciclo de vida de Angular que se ejecuta al inicializar el componente
   */
  ngOnInit(): void {
    // Obtener el ID de categoría de la ruta
    this.route.params.subscribe(params => {
      const categoryId = params['id'];
      if (categoryId) {
        this.loadCategoryData(categoryId);
        this.loadProductsByCategory(categoryId);
      } else {
        console.error('ID de categoría no encontrado en la ruta');
      }
    });
  }

  /**
   * Carga los datos de la categoría actual
   * @param categoryId - ID numérico de la categoría a cargar
   */
  private loadCategoryData(categoryId: string): void {
    this.categoryService.getCategory(categoryId).subscribe({
      next: (category) => {
        this.currentCategory = category || null;
        console.log('Categoría cargada:', this.currentCategory);
      },
      error: (error) => {
        console.error('Error cargando datos de categoría:', error);
      }
    });
  }

  /**
   * Carga los productos de la categoría especificada
   * @param categoryId - ID de la categoría como string
   */
  private loadProductsByCategory(categoryId: string): void {
    this.isLoading = true;

    this.productService.getProductsByCategory(categoryId).subscribe({
      next: (products) => {
        this.allProducts = products.filter(product => product.activo);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Aplica todos los filtros (búsqueda + filtros laterales) a la lista de productos
   */
  private applyFilters(): void {
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
   * Maneja cambios en el campo de búsqueda con debounce
   */
  onSearchChange(): void {
    // Debounce simple para evitar muchas llamadas
    setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  /**
   * Maneja cambios en los filtros laterales
   */
  onFiltersChange(): void {
    this.applyFilters();
  }

  /**
   * Establece un rango de precio predefinido
   * @param min - Precio mínimo del rango
   * @param max - Precio máximo del rango
   */
  setPriceRange(min: number, max: number): void {
    this.filters.minPrice = min;
    this.filters.maxPrice = max === 999999 ? null : max;
    this.applyFilters();
  }

  /**
   * Limpia el término de búsqueda
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  /**
   * Limpia todos los filtros aplicados
   */
  clearFilters(): void {
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
   * Navega al detalle del producto especificado
   * @param product - Producto al que se desea navegar
   */
  goToProduct(product: IProduct): void {
    // Usar el _id de MongoDB o idProducto si existe
    const productId = product.idProducto || product._id;
    this.router.navigate(['/product', productId]);
  }

  /**
   * Agrega un producto al carrito de compras
   * @param product - Producto a agregar al carrito
   * @returns Promise que se resuelve cuando se completa la operación
   */
  async addToCart(product: IProduct): Promise<void> {
    if (product.stock > 0) {
      try {
        const success = await this.cartService.agregarAlCarrito(product, 1);
        if (success) {
          this.toastService.success('Agregado al carrito', '', {
            life: 400
          });
        } else {
          this.toastService.warning('No hay suficiente stock disponible', '', {
            life: 400
          });
        }
      } catch (error) {
        console.error('Error al agregar al carrito:', error);
      }
    }
  }

  /**
   * Navega de regreso a la página de categorías
   */
  goBack(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Formatea un precio numérico para mostrar en formato de moneda mexicana
   * @param price - Precio a formatear
   * @returns Precio formateado como string
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Calcula el porcentaje de stock para la barra visual basado en un máximo de 20 unidades
   * @param stock - Cantidad actual de stock
   * @returns Porcentaje de stock (máximo 100%)
   */
  getStockPercentage(stock: number): number {
    const maxStock = 20; // Valor máximo para el cálculo del porcentaje
    return Math.min((stock / maxStock) * 100, 100);
  }
}
