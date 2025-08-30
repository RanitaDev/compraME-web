import { Component, OnInit, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../../services/products.service';
import { IProduct } from '../../../../../interfaces/products.interface';
import { ProductCommentsComponent } from '../../../product-comments.component/product-comments.component';

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

  constructor(private productService: ProductService) {}

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
