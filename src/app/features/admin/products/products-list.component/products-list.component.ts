// Componente de lista de productos para el panel de administración
import { Component, OnInit, OnDestroy, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductService } from '../../../../services/products.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { IProduct } from '../../../../interfaces/products.interface';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../../../interfaces/categories.interface';
import { AddProductModalComponent } from '../add-product-modal.component/add-product-modal.component';
import { PrimeNgModule } from '../../../../primeng.module';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimeNgModule],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.css'],
  providers: [DialogService]
})
export class ProductsListComponent implements OnInit, OnDestroy {
  @Input() categoryId: string | null = null;

  // Inyección de dependencias usando inject()
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private dialog = inject(DialogService);
  private destroy$ = new Subject<void>();

  // Propiedades de datos
  allProducts: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  categories: Category[] = [];
  searchTerm = '';

  // Estadísticas
  totalProducts = 0;
  featuredProducts = 0;
  hasMoreProducts = false;

  // Paginación
  currentPage = 1;
  itemsPerPage = 12;

  // Referencia del modal
  private modalRef?: DynamicDialogRef;

  // Confirm service
  private confirmService = inject(ConfirmService);

  // Subject para búsqueda con debounce
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.initializeSearchDebounce();
    this.loadProducts();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.modalRef?.close();
  }

  private initializeSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm);
      });
  }

  private loadProducts(): void {
    if(this.categoryId) {
      this.productService.getProductsByCategory(this.categoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (products) => {
            this.allProducts = products.filter(p => p.activo);
            this.updateFilteredProducts();
            this.calculateStats();
          },
          error: (error) => {
            console.error('Error loading products:', error);
            this.showErrorMessage('Error al cargar los productos');
          }
        });
      return;
    }
    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.allProducts = products.filter(p => p.activo);
          this.updateFilteredProducts();
          this.calculateStats();
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.showErrorMessage('Error al cargar los productos');
        }
      });
  }

  private loadCategories(): void {
    this.categoryService.getActiveCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  private updateFilteredProducts(): void {
    let filtered = [...this.allProducts];

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(searchLower) ||
        product.descripcion.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const startIndex = 0;
    const endIndex = this.currentPage * this.itemsPerPage;
    this.filteredProducts = filtered.slice(startIndex, endIndex);
    this.hasMoreProducts = filtered.length > endIndex;
  }

  private calculateStats(): void {
    this.totalProducts = this.allProducts.length;
    this.featuredProducts = this.allProducts.filter(p => p.destacado).length;
  }

  private performSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.updateFilteredProducts();
  }

  // Métodos públicos
  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onEditProduct(product: IProduct): void {
    this.modalRef = this.dialog.open(AddProductModalComponent, {
      header: 'Editar Producto',
      width: '800px',
      modal: true,
      closable: true,
      data: {
        isEditMode: 'editar',
        product: product
      }
    });

    this.modalRef.onClose.subscribe((resultado) => {
      if (resultado && resultado.action === 'saved') {
        this.onProductUpdated(resultado.product);
      }
    });
  }

  onViewProduct(product: IProduct): void {
    // Mostrar modal o navegar a vista detallada
    // this.router.navigate(['/admin/products/view', product.idProducto]);
  }

  onAddProduct(): void {
    this.modalRef = this.dialog.open(AddProductModalComponent, {
      header: 'Nuevo Producto',
      width: '800px',
      modal: true,
      closable: true,
      data: {
        isEditMode: 'crear'
      }
    });

    this.modalRef.onClose.subscribe((resultado) => {
      if (resultado && resultado.success && resultado.action === 'saved') {
        this.loadProducts();
      }
    });
  }

  private onProductUpdated(updatedProduct: IProduct): void {
    const index = this.allProducts.findIndex(p => p.idProducto === updatedProduct.idProducto);
    if (index !== -1) {
      this.allProducts[index] = updatedProduct;
      this.updateFilteredProducts();
      this.calculateStats();
      this.showSuccessMessage('Producto actualizado correctamente');
    }
  }

  loadMoreProducts(): void {
    this.currentPage++;
    this.updateFilteredProducts();
  }

  getStockBadgeClass(stock: number): string {
    if (stock <= 0) {
      return 'bg-red-100 text-red-800';
    } else if (stock <= 5) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  }

  getStockText(stock: number): string {
    if (stock <= 0) {
      return 'Sin stock';
    } else if (stock <= 5) {
      return 'Poco stock';
    } else {
      return `${stock} disponibles`;
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  onImageError(event: any): void {
    // Fallback image en caso de error
    event.target.src = 'https://via.placeholder.com/300x200/e2e8f0/64748b?text=Sin+Imagen';
  }

  private showErrorMessage(message: string): void {
    console.error(message);
  }

  private showSuccessMessage(message: string): void {
  }

  trackByProductId(index: number, product: IProduct): string | undefined {
    return product?.idProducto;
  }

  /** Toggle product active state with confirmation and backend update */
  toggleProductStatus(product: IProduct): void {
    const previous = product.activo;
    const newStatus = !previous;
    const action = newStatus ? 'activar' : 'desactivar';
    const message = `Se va a ${action} el producto "${product.nombre}". ¿Deseas continuar?`;

    this.confirmService.confirm({
      header: 'Confirmar cambio de estado',
      message,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.productService.actualizarProducto(product._id, { activo: newStatus })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              if (res) {
                const idx = this.allProducts.findIndex(p => p._id === product._id);
                if (idx !== -1) this.allProducts[idx] = res;
                this.updateFilteredProducts();
                this.calculateStats();
                this.showSuccessMessage(`Producto ${res.activo ? 'activado' : 'desactivado'} correctamente`);
              } else {
                this.showErrorMessage('No se pudo actualizar el producto');
              }
            },
            error: (err) => {
              console.error('Error actualizando producto:', err);
              this.showErrorMessage('Error al actualizar el producto');
            }
          });
      },
      reject: () => {
        // usuario canceló
      }
    });
  }

  scrollToTop(): void {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
