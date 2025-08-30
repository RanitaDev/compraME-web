import { Component, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../services/cart.service';
import { ICartItem } from '../../../interfaces/cart.interface';

@Component({
  selector: 'app-cart-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-modal.component.html',
  styleUrls: ['./cart-modal.component.css']
})
export class CartModalComponent {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() checkoutRequested = new EventEmitter<void>();

  isOpen = signal(false);

  // Getters para el template
  get cartItems() { return this.cartService.items; }
  get cartSummary() { return this.cartService.cartSummary; }
  get isEmpty() { return this.cartService.isEmpty; }

  constructor(private cartService: CartService) {}

  openModal() {
    this.isOpen.set(true);
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.isOpen.set(false);
    document.body.style.overflow = 'auto';
    this.modalClosed.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  increaseQuantity(productId: string) {
    const item = this.cartItems().find(item => item.producto.idProducto === productId);
    if (item) {
      const success = this.cartService.updateQuantity(productId, item.cantidad + 1);
      if (!success) {
        console.warn('No hay suficiente stock disponible');
      }
    }
  }

  decreaseQuantity(productId: string) {
    const item = this.cartItems().find(item => item.producto.idProducto === productId);
    if (item && item.cantidad > 1) {
      this.cartService.updateQuantity(productId, item.cantidad - 1);
    }
  }

  removeItem(productId: string) {
    this.cartService.removeFromCart(productId);
  }

  clearCart() {
    // Confirmar antes de limpiar
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      this.cartService.clearCart();
    }
  }

  checkout() {
    this.checkoutRequested.emit();
    this.closeModal();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  // Método público para ser llamado desde componentes padre
  toggle() {
    if (this.isOpen()) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }
}
