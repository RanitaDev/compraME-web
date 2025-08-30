import { Component, OnInit, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProduct } from '../../../../../interfaces/products.interface';
import { FeaturedProductsComponent } from '../featured-products.component/featured-products.component';
import { finalize } from 'rxjs';
import { SpinnerService } from '../../../../../core/services';
import { ProductService } from '../../../../../services/products.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FeaturedProductsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  @Input() productId: string = '';

  product = signal<IProduct | null>(null);
  selectedImageIndex = signal(0);
  imageLoaded = signal(false);

  selectedImage = computed(() => {
    const prod = this.product();
    if (!prod || !prod.imagenes.length) return '';
    return prod.imagenes[this.selectedImageIndex()];
  });

  ngOnInit() {
    this.loadProduct();
  }

  constructor(
    private readonly productsService: ProductService,
    private readonly spinnerService: SpinnerService
  ){}

  /**
   * @description Carga los datos de un producto específico.
   */
  private loadProduct(): void {
    this.spinnerService.show('Cargando datos del producto...', 'default', 'product-load');

    this.productsService.getProduct(this.productId)
      .pipe(
        finalize(() => {
          this.spinnerService.hide('product-load');
        })
      )
      .subscribe({
        next: (product) => {
          if (product) {
            this.product.set(product);
          }
        },
        error: (error) => {
          console.error('Error al cargar el producto:', error);
        }
      });
  }

  selectImage(index: number) {
    this.selectedImageIndex.set(index);
    this.imageLoaded.set(false);
  }

  onImageLoad() {
    this.imageLoaded.set(true);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }
}
