// carousel-banner.component.ts
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { IProduct } from '../../../../interfaces/products.interface';
import { ProductService } from '../../../../services/products.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-carousel-banner',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './carousel-banner.component.html',
  styleUrls: ['./carousel-banner.component.css'],
  animations: [
    trigger('contentAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('buttonAnimation', [
      transition(':enter', [
        query('button', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(150, [
            animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class CarouselBannerComponent implements OnInit, OnDestroy {
  featuredProducts = signal<IProduct[]>([]);
  currentIndex = signal<number>(0);

  // Color de fondo dinámico basado en el producto actual
  currentBackgroundColor = computed(() => {
    const products = this.featuredProducts();
    if (products.length === 0) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

    const currentProduct = products[this.currentIndex()];
    if (!currentProduct) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

    const lightColor = this.lightenColor(currentProduct.color, 0.3);
    return `linear-gradient(135deg, ${currentProduct.color}40 0%, ${lightColor}60 100%)`;
  });

  private autoplaySubscription?: Subscription;
  private isAutoplayPaused = false;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  private loadFeaturedProducts(): void {
    this.productService.getFeaturedProducts().subscribe(products => {
      this.featuredProducts.set(products);
      if (products.length > 0) {
        this.currentIndex.set(0);
      }
    });
  }

  private startAutoplay(): void {
    this.autoplaySubscription = interval(6000).subscribe(() => {
      if (!this.isAutoplayPaused && this.featuredProducts().length > 1) {
        this.nextSlide();
      }
    });
  }

  private stopAutoplay(): void {
    this.autoplaySubscription?.unsubscribe();
  }

  pauseAutoplay(): void {
    this.isAutoplayPaused = true;
  }

  resumeAutoplay(): void {
    this.isAutoplayPaused = false;
  }

  nextSlide(): void {
    const products = this.featuredProducts();
    if (products.length === 0) return;

    const nextIndex = this.currentIndex() + 1;
    this.currentIndex.set(nextIndex >= products.length ? 0 : nextIndex);
  }

  previousSlide(): void {
    const products = this.featuredProducts();
    if (products.length === 0) return;

    const prevIndex = this.currentIndex() - 1;
    this.currentIndex.set(prevIndex < 0 ? products.length - 1 : prevIndex);
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
  }

  addToCart(product: IProduct): void {
    console.log('Agregando al carrito:', {
      id: product.idProducto,
      nombre: product.nombre,
      precio: product.precio
    });
    // Aquí implementarías la lógica para agregar al carrito
    // Por ejemplo: this.cartService.addItem(product);
  }

  viewProduct(product: IProduct): void {
    console.log('Ver producto:', {
      id: product.idProducto,
      nombre: product.nombre
    });
    // Aquí implementarías la navegación a la página del producto
    // Por ejemplo: this.router.navigate(['/product', product.idProducto]);
  }

  // Utilidades para colores
  lightenColor(color: string, amount: number = 0.2): string {
    // Convierte hex a RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Aclara el color
    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  darkenColor(color: string, amount: number = 0.2): string {
    // Convierte hex a RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Oscurece el color
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}
