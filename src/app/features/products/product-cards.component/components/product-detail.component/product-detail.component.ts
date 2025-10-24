import { Component, OnInit, Input, signal, computed, ChangeDetectionStrategy, effect, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProduct } from '../../../../../interfaces/products.interface';
import { FeaturedProductsComponent } from '../featured-products.component/featured-products.component';
import { finalize, map } from 'rxjs';
import { SpinnerService } from '../../../../../core/services';
import { ProductService } from '../../../../../services/products.service';
import { DirectPurchaseService } from '../../../../../services/direct-purchase.service';
import { CartService } from '../../../../../services/cart.service';
import { AuthService } from '../../../../../services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FeaturedProductsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  // Signal para el ID del producto desde los parámetros de la ruta
  productId!: Signal<string | undefined>;

  product = signal<IProduct | null>(null);
  selectedImageIndex = signal(0);
  imageLoaded = signal(false);

  selectedImage = computed(() => {
    const prod = this.product();
    if (!prod || !prod.imagenes.length) return '';
    return prod.imagenes[this.selectedImageIndex()];
  });

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
    // Inicializar el signal para el ID del producto
    this.productId = toSignal(this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('id') || '')
    ));

    // Effect que reacciona a cambios en el productId
    effect(() => {
      const id = this.productId();
      if (id) {
        this.resetProductState();
        this.loadProduct(id);
      }
    });
  }

  ngOnInit() {
    this.checkForContinuePurchase();
  }

  /**
   * Resetea el estado visual del producto
   */
  private resetProductState(): void {
    this.product.set(null);
    this.selectedImageIndex.set(0);
    this.imageLoaded.set(false);
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

  /**
   * @description Carga los datos de un producto específico.
   */
  private loadProduct(productId: string): void {
    this.spinnerService.show('Cargando datos del producto...', 'default', 'product-load');

    this.productsService.getProduct(productId)
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
    console.log('Iniciando compra directa...');
    const product = this.product();

    if (!product) {
      return;
    }

    if (product.stock === 0) {
      this.toastService.warning('Producto agotado', 'Este producto no está disponible para compra');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      localStorage.setItem('redirect_after_login', `/product/${product._id}`);
      localStorage.setItem('purchase_intent', JSON.stringify({ productId: product._id, action: 'buy_now' }));
      this.router.navigate(['/auth']);
      return;
    }

    this.directPurchaseService.setDirectPurchaseProduct(product, 1);

    this.router.navigate(['/checkout'], {
      queryParams: {
        type: 'direct',
        productId: product._id,
        action: 'buy_now'
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

    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Inicia sesión', 'Debes iniciar sesión para agregar productos al carrito');

      localStorage.setItem('redirect_after_login', `/product/${product._id}`);
      localStorage.setItem('cart_intent', JSON.stringify({ productId: product._id, action: 'add_to_cart' }));
      this.router.navigate(['/auth']);
      return;
    }

    try {
      this.spinnerService.show('Agregando al carrito...', 'default', 'add-to-cart');
      // Agregar al carrito usando la nueva API
      const success = await this.cartService.agregarAlCarrito(product, 1);

      if (success) {
        this.toastService.success('Agregado al carrito', '', {
          life: 400
        });
      } else {
        this.toastService.warning('No se pudo agregar','Ocurrió un error al agregar el producto al carrito');
      }
    } catch (error) {
      this.toastService.error('Error','Hubo un problema al agregar el producto al carrito');
    } finally {
      this.spinnerService.hide('add-to-cart');
    }
  }
}
