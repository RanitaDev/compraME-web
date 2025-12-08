// carousel-banner.component.ts
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { IProduct } from '../../../../interfaces/products.interface';
import { ProductService } from '../../../../services/products.service';
import { ToastService } from '../../../../core/services/toast.service';
import { interval, Subscription } from 'rxjs';
import { Router } from '@angular/router';

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

  private autoplaySubscription?: Subscription;
  private isAutoplayPaused = false;

  constructor(
    private productService: ProductService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  /**
   * @description Carga los productos destacados ordenados de manera descendente.
   */
  private loadFeaturedProducts(): void {
    this.productService.getFeaturedProducts().subscribe(products => {
      // Ordenar productos de manera descendente por fecha de creación
      const sortedProducts = products.sort((a, b) => {
        const dateA = new Date(a.fechaCreacion || 0).getTime();
        const dateB = new Date(b.fechaCreacion || 0).getTime();
        return dateB - dateA;
      });
      this.featuredProducts.set(sortedProducts);
      if (sortedProducts.length > 0) {
        this.currentIndex.set(0);
      }
    });
  }

  /**
   * @description Agrega un producto al carrito
   * @param product - El producto a agregar
   */
  addToCart(product: IProduct): void {
    console.log('Agregando al carrito:', product);
  }

  /**
   * @description Muestra los detalles de un producto en su respectiva página
   * @param product - El producto a visualizar
   */
  public viewProduct(product: IProduct): void {
    if(!product || !product._id) {
      this.toastService.error('EL PRODUCTO NO FUE ENCONTRADO, INTENTA MÁS TARDE');
      return;
    }
    this.router.navigate(['/product', product._id]);
  }

  /**
   * @description Inicia el autoplay del carrusel
   */
  private startAutoplay(): void {
    this.autoplaySubscription = interval(4000).subscribe(() => {
      if (!this.isAutoplayPaused && this.featuredProducts().length > 1) {
        this.nextSlide();
      }
    });
  }

  /**
   * @description Detiene el autoplay del carrusel
   */
  private stopAutoplay(): void {
    this.autoplaySubscription?.unsubscribe();
  }

  /**
   * @description Pausa el autoplay del carrusel
   */
  pauseAutoplay(): void {
    this.isAutoplayPaused = true;
  }

  /**
   * @description Reanuda el autoplay del carrusel
   */
  resumeAutoplay(): void {
    this.isAutoplayPaused = false;
  }

  /**
   * @description Avanza al siguiente slide del carrusel
   */
  nextSlide(): void {
    const products = this.featuredProducts();
    if (products.length === 0) return;

    const nextIndex = this.currentIndex() + 1;
    this.currentIndex.set(nextIndex >= products.length ? 0 : nextIndex);
  }

  /**
   * @description Retrocede al slide anterior del carrusel
   */
  previousSlide(): void {
    const products = this.featuredProducts();
    if (products.length === 0) return;

    const prevIndex = this.currentIndex() - 1;
    this.currentIndex.set(prevIndex < 0 ? products.length - 1 : prevIndex);
  }

  /**
   * @description Va al slide específico del carrusel
   */
  goToSlide(index: number): void {
    this.currentIndex.set(index);
  }

  /*************************BLOQUE DE UTILIDADES******************************/
  lightenColor(color: string, amount: number = 0.2): string {
    // Convierte hex a RGB
    const hex: string = color.replace('#', '');
    const r: number = parseInt(hex.substring(0, 2), 16);
    const g: number = parseInt(hex.substring(2, 4), 16);
    const b: number = parseInt(hex.substring(4, 6), 16);

    // Aclara el color
    const newR: number = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG: number = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB: number = Math.min(255, Math.floor(b + (255 - b) * amount));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  darkenColor(color: string, amount: number = 0.2): string {
    // Convierte hex a RGB
    const hex: string = color.replace('#', '');
    const r: number = parseInt(hex.substring(0, 2), 16);
    const g: number = parseInt(hex.substring(2, 4), 16);
    const b: number = parseInt(hex.substring(4, 6), 16);

    // Oscurece el color
    const newR: number = Math.max(0, Math.floor(r * (1 - amount)));
    const newG: number = Math.max(0, Math.floor(g * (1 - amount)));
    const newB: number = Math.max(0, Math.floor(b * (1 - amount)));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}
