import { Component, Output, EventEmitter, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { IProduct } from '../../../interfaces/products.interface';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-cart-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-modal.component.html',
  styleUrls: ['./cart-modal.component.css']
})
export class CartModalComponent implements OnDestroy {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() checkoutRequested = new EventEmitter<void>();

  isOpen = signal(false);
  private debounceTimers = new Map<string, number>();
  private readonly DEBOUNCE_TIME = environment.cartDebounceTime; // Tiempo configurable desde environment

  // Getters para el template
  get cartItems() { return this.cartService.items; }
  get cartSummary() { return this.cartService.cartSummary; }
  get isEmpty() { return this.cartService.isEmpty; }

  constructor(
    private cartService: CartService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  /**
   * Cleanup de timers al destruir el componente
   */
  ngOnDestroy(): void {
    // Limpiar todos los timers pendientes
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  /**
   * Abre el modal del carrito y carga los datos desde el backend
   * @returns {Promise<void>} Promise que se resuelve cuando el modal está abierto
   */
  public async openModal(): Promise<void> {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';

    try {
      // LLAMAMOS AL BACK PARA CARGAR EL CARRITO
      this.cartService.cargarResumenCarritoDesdeBackend().subscribe({
        next: () => console.log('Carrito cargado'),
        error: (error) => console.error('Error:', error)
      });
    } catch (error) {
      this.toastService.error('Error cargando el carrito. Por favor, inténtalo de nuevo.');
      console.error('❌ Error cargando el carrito:', error);
    }
  }

  /**
   * Cierra el modal del carrito y restaura el scroll del body
   * @returns {void}
   */
  public closeModal(): void {
    this.isOpen.set(false);
    document.body.style.overflow = 'auto';
    this.modalClosed.emit();
  }

  /**
   * Actualiza la cantidad de un producto en el carrito con debounce optimizado
   * Actualiza la UI inmediatamente y luego sincroniza con el backend después de un retraso
   * @param {IProduct} producto - Producto a actualizar
   * @param {number} cantidad - Nueva cantidad (si es 0 o menor, se elimina)
   * @returns {Promise<void>} Promise que se resuelve cuando se actualiza la cantidad
   */
  public async actualizarCantidadProducto(producto: IProduct, cantidad: number): Promise<void> {
    const productoId = producto.productoID;
    const usuario = this.authService.getCurrentUser();

    if(!productoId) {
      this.toastService.error('Error: Producto inválido');
      return;
    }

    if (!usuario?.id) {
      this.toastService.error('Error: Usuario no autenticado');
      return;
    }

    if (this.debounceTimers.has(productoId)) {
      clearTimeout(this.debounceTimers.get(productoId)!);
    }
    this.cartService.actualizarCantidadLocal(productoId, cantidad);

    const timer = setTimeout(async () => {
      try {
        if (cantidad <= 0) {
          await this.cartService.eliminarDelCarrito(productoId);
        } else {
          const carritoActual = this.cartService.items();
          await this.cartService.actualizarCarritoCompleto(carritoActual, usuario.id);
        }
        this.debounceTimers.delete(productoId);

      } catch (error) {
        this.cartService.cargarResumenCarritoDesdeBackend().subscribe({
          error: (err) => {
            this.toastService.error('Error sincronizando el carrito. Por favor, recarga la página.');
          }
        });
        this.toastService.error('Error actualizando el producto. Se revirtieron los cambios.');
      }
    }, this.DEBOUNCE_TIME);

    this.debounceTimers.set(productoId, timer);
  }

  /**
   * Eliminar un producto completamente del carrito
   * @param {string} productId - ID del producto a eliminar
   * @returns {Promise<void>} Promise que se resuelve cuando se elimina el producto
   */
  async removeItem(producto: IProduct): Promise<void> {
    console.log('Eliminando producto del carrito:', producto);

    if(!producto || !producto.productoID) {
      this.toastService.error('No se pudo eliminar, intente más tarde.');
      return;
    }

    try {
      const success = await this.cartService.eliminarDelCarrito(producto.productoID);
      if (!success) {
        console.warn('⚠️ No se pudo eliminar el producto del carrito');
      }
    } catch (error) {
      console.error('❌ Error eliminando producto del carrito:', error);
    }
  }

  /**
   * Vaciar completamente el carrito después de confirmación del usuario
   * @returns {Promise<void>} Promise que se resuelve cuando se vacía el carrito
   */
  async clearCart(): Promise<void> {
    // Confirmar antes de limpiar el carrito completo
    if (confirm('¿Estás seguro de que quieres vaciar el carrito? Esta acción no se puede deshacer.')) {
      try {
        const success = await this.cartService.clearCart();
        if (!success) {
          console.warn('⚠️ No se pudo vaciar el carrito');
        }
      } catch (error) {
        console.error('❌ Error vaciando el carrito:', error);
      }
    }
  }

  /**
   * Proceder al checkout - cierra el modal y emite evento
   * @returns {void}
   */
  checkout(): void {
    this.checkoutRequested.emit();
    this.closeModal();
  }

  /**
   * Formatea un precio usando el formato de moneda mexicana
   * @param {number} price - Precio a formatear
   * @returns {string} Precio formateado con dos decimales
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Método público para alternar el estado del modal
   * Puede ser llamado desde componentes padre para abrir/cerrar el modal
   * @returns {void}
   */
  toggle(): void {
    if (this.isOpen()) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }
}
