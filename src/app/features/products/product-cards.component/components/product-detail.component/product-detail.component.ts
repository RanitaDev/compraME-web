import { Component, OnInit, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProduct } from '../../../../../interfaces/products.interface';
import { FeaturedProductsComponent } from '../featured-products.component/featured-products.component';
import { finalize } from 'rxjs';
import { SpinnerService } from '../../../../../core/services';
import { ProductService } from '../../../../../services/products.service';
import { DirectPurchaseService } from '../../../../../services/direct-purchase.service';
import { CartService } from '../../../../../services/cart.service';
import { AuthService } from '../../../../../services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FeaturedProductsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  public productId: string;
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
    this.checkForContinuePurchase();
  }

  /**
   * Verificar si el usuario viene de un login para continuar con la compra
   */
  private checkForContinuePurchase(): void {
    this.route.queryParams.subscribe(params => {
      if (params['continue_purchase'] === 'true' && this.authService.isAuthenticated()) {
        // Usuario autenticado que viene de continuar compra
        setTimeout(() => {
          this.comprarAhora();
        }, 500); // Pequeño delay para asegurar que el producto esté cargado
      }
    });
  }

  constructor(
    private readonly productsService: ProductService,
    private readonly spinnerService: SpinnerService,
    private readonly directPurchaseService: DirectPurchaseService,
    private readonly cartService: CartService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ){
    this.productId = this.route.snapshot.paramMap.get('id') || '';
  }

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

  public comprarAhora(): void {
    const product = this.product();

    if (!product) {
      console.error('No hay producto seleccionado');
      return;
    }

    if (product.stock === 0) {
      console.warn('Producto agotado');
      return;
    }

    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      // Redirigir al login y guardar la intención de compra
      localStorage.setItem('redirect_after_login', `/product/${product._id}`);
      localStorage.setItem('purchase_intent', JSON.stringify({ productId: product._id, action: 'buy_now' }));
      this.router.navigate(['/auth']);
      return;
    }

    // Configurar producto para compra directa
    this.directPurchaseService.setDirectPurchaseProduct(product, 1);

    // Navegar al checkout
    this.router.navigate(['/checkout'], {
      queryParams: {
        type: 'direct',
        productId: product._id
      }
    });
  }

  /**
   * Agregar producto al carrito con feedback visual
   */
  public async agregarAlCarrito(): Promise<void> {
    const product = this.product();

    if (!product) {
      console.error('❌ No hay producto seleccionado');
      return;
    }

    if (product.stock === 0) {
      this.toastService.warning('Producto agotado', 'Este producto no está disponible actualmente');
      return;
    }

    // Verificar autenticación antes de intentar agregar
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Inicia sesión', 'Debes iniciar sesión para agregar productos al carrito');
      // Guardar la intención de agregar al carrito
      localStorage.setItem('redirect_after_login', `/product/${product._id}`);
      localStorage.setItem('cart_intent', JSON.stringify({ productId: product._id, action: 'add_to_cart' }));
      this.router.navigate(['/auth']);
      return;
    }

    try {
      // Mostrar spinner mientras se procesa
      this.spinnerService.show('Agregando al carrito...', 'default', 'add-to-cart');

      // Agregar al carrito usando la nueva API
      const success = await this.cartService.addToCart(product, 1);

      if (success) {
        const currentQuantity = this.cartService.getItemCount(product._id);
        this.toastService.success(
          '¡Agregado al carrito!',
          `${product.nombre} - Cantidad en carrito: ${currentQuantity}`
        );
        console.log('🛒 Producto agregado al carrito:', product.nombre, '- Cantidad total:', currentQuantity);
      } else {
        this.toastService.warning(
          'No se pudo agregar',
          'Ocurrió un error al agregar el producto al carrito'
        );
        console.warn('⚠️ No se pudo agregar al carrito:', product.nombre);
      }
    } catch (error) {
      console.error('❌ Error agregando producto al carrito:', error);
      this.toastService.error(
        'Error',
        'Hubo un problema al agregar el producto al carrito'
      );
    } finally {
      this.spinnerService.hide('add-to-cart');
    }
  }
}
