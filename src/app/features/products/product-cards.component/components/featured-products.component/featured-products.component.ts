import { Component, OnInit, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../../services/products.service';
import { IProduct } from '../../../../../interfaces/products.interface';
import { ProductCommentsComponent } from '../../../product-comments.component/product-comments.component';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [CommonModule, ProductCommentsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './featured-products.component.html',
  styleUrls: ['./featured-products.component.css']
})
export class FeaturedProductsComponent implements OnInit {
  @Output() productSelected = new EventEmitter<string>();
  @Output() quickActionClicked = new EventEmitter<string>();

  featuredProducts = signal<IProduct[]>([]);
  isLoading = signal(true);

  constructor(
    private productService: ProductService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFeaturedProducts();
  }

  private loadFeaturedProducts() {
    this.isLoading.set(true);

    // Simulamos un pequeño delay para mostrar el loading
    setTimeout(() => {
      this.productService.getFeaturedProducts().subscribe({
        next: (products) => {
          this.featuredProducts.set(products);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading featured products:', error);
          this.isLoading.set(false);
        }
      });
    }, 800);
  }

  onProductClick(productId: string) {
    this.productSelected.emit(productId);
  }

  onQuickAction(productId: string) {
    this.quickActionClicked.emit(productId);
  }

  public viewProduct(product: IProduct): void {
    if(!product || !product._id) {
      this.toastService.error('EL PRODUCTO NO FUE ENCONTRADO, INTENTA MÁS TARDE');
      return;
    }

    // Scroll hacia arriba inmediatamente
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Verificar si ya estamos en una ruta de producto
    const currentUrl = this.router.url;
    const isOnProductPage = currentUrl.startsWith('/product/');

    if (isOnProductPage) {
      // Si ya estamos en una página de producto, navegar directamente a la nueva URL
      // Esto forzará la recarga del componente con el nuevo producto
      window.location.href = `/product/${product._id}`;
    } else {
      // Si no estamos en una página de producto, navegar normalmente
      this.router.navigate(['/product', product._id]);
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  getStockPercentage(stock: number): number {
    const maxStock = 20; // Asumimos 20 como stock máximo para el cálculo del porcentaje
    return Math.min((stock / maxStock) * 100, 100);
  }
}
