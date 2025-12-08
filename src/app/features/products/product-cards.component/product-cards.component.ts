import { ToastService } from './../../../core/services/toast.service';
// product-cards.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { ProductService } from '../../../services/products.service';
import { IProduct } from '../../../interfaces/products.interface';
import { PrimeNgModule } from '../../../primeng.module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-cards',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './product-cards.component.html',
  styleUrls: ['./product-cards.component.css'],
  animations: [
    trigger('gridAnimation', [
      transition(':enter', [
        query('.product-card', [
          style({
            opacity: 0,
            transform: 'translateY(60px) scale(0.9)',
            filter: 'blur(10px)'
          }),
          stagger(100, [
            animate('0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              style({
                opacity: 1,
                transform: 'translateY(0) scale(1)',
                filter: 'blur(0px)'
              })
            )
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(40px) rotateY(10deg)',
          filter: 'blur(8px)'
        }),
        animate('0.7s ease-out', style({
          opacity: 1,
          transform: 'translateY(0) rotateY(0deg)',
          filter: 'blur(0px)'
        }))
      ])
    ])
  ]
})
export class ProductCardsComponent implements OnInit {
  allProducts = signal<IProduct[]>([]);
  displayedProducts = signal<IProduct[]>([]);
  currentPage = signal<number>(1);
  itemsPerPage = 8;

  // Computed properties
  products = computed(() => this.displayedProducts());
  hasMoreProducts = computed(() =>
    this.displayedProducts().length < this.allProducts().length
  );

  constructor(
    private productService: ProductService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  /**
   * @description Obtiene los productos activos ordenados de manera descendente.
   */
  private loadProducts(): void {
    this.productService.getProducts().subscribe(products => {
      const activeProducts = products
        .filter(product => product.activo && product.stock > 0)
        .sort((a, b) => {
          // Ordenar por fecha de creación descendente (más recientes primero)
          const dateA = new Date(a.fechaCreacion || 0).getTime();
          const dateB = new Date(b.fechaCreacion || 0).getTime();
          return dateB - dateA;
        });

      this.allProducts.set(activeProducts);
      this.loadInitialProducts();
    });
  }

  private loadInitialProducts(): void {
    const products = this.allProducts();
    const initialProducts = products.slice(0, this.itemsPerPage);
    this.displayedProducts.set(initialProducts);
  }

  /**
   * @description Carga más productos en la vista.
   */
  public loadMoreProducts(): void {
    const currentProducts = this.displayedProducts();
    const allProducts = this.allProducts();
    const nextPage = this.currentPage() + 1;
    const startIndex = currentProducts.length;
    const endIndex = startIndex + this.itemsPerPage;

    const newProducts = allProducts.slice(startIndex, endIndex);
    this.displayedProducts.set([...currentProducts, ...newProducts]);
    this.currentPage.set(nextPage);
  }

  public viewProduct(product: IProduct): void {
    if(!product) {
      this.toastService.warning('Producto no encontrado.');
      return;
    }
    this.router.navigate(['/product', product._id]);
  }

  // Método para truncar texto si es necesario
  public truncateText(text: string, maxLength: number = 60): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  // Método para formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }
}
