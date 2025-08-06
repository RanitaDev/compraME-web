
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../primeng.module';
import { ProductsService } from '../../services/products.service';
import { BackgroundService } from '../../core/generales/background.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    PrimeNgModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  public currentColor: string = '#ffffff'; // Default color
  featuredProducts: any[] = [];
  currentProductIndex = 0;
  currentProduct: any = null;
  isLoading = true;
  isTransitioning = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private backgroundService: BackgroundService,
    private productsService: ProductsService
  ) { }

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.backgroundService.resetBackground();
  }

  loadFeaturedProducts(): void {
    this.isLoading = true;
    const sub = this.productsService.getProducts().subscribe({
      next: (products) => {
        this.featuredProducts = products;
        if (this.featuredProducts.length > 0) {
          this.currentProduct = this.featuredProducts[0];
          this.backgroundService.setBackgroundColor(this.currentProduct.color);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
    this.subscription.add(sub);
  }

  nextProduct(): void {
    if (this.isTransitioning || this.featuredProducts.length === 0) return;

    this.isTransitioning = true;
    this.currentProductIndex = (this.currentProductIndex + 1) % this.featuredProducts.length;

    setTimeout(() => {
      this.currentProduct = this.featuredProducts[this.currentProductIndex];
      this.backgroundService.setBackgroundColor(this.currentProduct.color);
      this.isTransitioning = false;
    }, 300);
  }

  previousProduct(): void {
    if (this.isTransitioning || this.featuredProducts.length === 0) return;

    this.isTransitioning = true;
    this.currentProductIndex = this.currentProductIndex === 0
      ? this.featuredProducts.length - 1
      : this.currentProductIndex - 1;

    setTimeout(() => {
      this.currentProduct = this.featuredProducts[this.currentProductIndex];
      this.backgroundService.setBackgroundColor(this.currentProduct.color);
      this.isTransitioning = false;
    }, 300);
  }

  goToProductDetails(): void {
    // Implementar navegación a detalles del producto
    console.log('Ir a detalles del producto:', this.currentProduct);
  }

  addToCart(): void {
    // Implementar lógica de agregar al carrito
    console.log('Agregar al carrito:', this.currentProduct);
  }

  selectProduct(index: number): void {
    if (this.isTransitioning || index === this.currentProductIndex) return;

    this.isTransitioning = true;
    this.currentProductIndex = index;

    setTimeout(() => {
      this.currentProduct = this.featuredProducts[this.currentProductIndex];
      this.backgroundService.setBackgroundColor(this.currentProduct.color);
      this.isTransitioning = false;
    }, 300);
  }
}

