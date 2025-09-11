import { Injectable, signal } from '@angular/core';
import { IProduct } from '../interfaces/products.interface';
import { ICartProducts, ICheckoutSummary } from '../interfaces/checkout.interface';

@Injectable({
  providedIn: 'root'
})
export class DirectPurchaseService {
  // Signal para mantener el producto de compra directa
  private directPurchaseProduct = signal<{ product: IProduct; quantity: number } | null>(null);

  constructor() {}

  /**
   * Configurar producto para compra directa
   */
  setDirectPurchaseProduct(product: IProduct, quantity: number = 1): void {
    this.directPurchaseProduct.set({ product, quantity });
  }

  /**
   * Obtener el producto de compra directa
   */
  getDirectPurchaseProduct(): { product: IProduct; quantity: number } | null {
    return this.directPurchaseProduct();
  }

  /**
   * Crear resumen de checkout para compra directa
   */
  createDirectCheckoutSummary(): ICheckoutSummary | null {
    const directPurchase = this.directPurchaseProduct();

    if (!directPurchase) {
      return null;
    }

    const { product, quantity } = directPurchase;
    const subtotal = product.precio * quantity;
    const impuestos = subtotal * 0.16; // IVA 16%
    const envio = subtotal >= 1000 ? 0 : 99; // Envío gratis para compras > $1000
    const total = subtotal + impuestos + envio;

    const checkoutItem: ICartProducts = {
      idProducto: product._id,
      nombre: product.nombre,
      cantidad: quantity,
      precio: product.precio,
      subtotal: subtotal
    };

    return {
      items: [checkoutItem],
      subtotal,
      impuestos,
      envio,
      total
    };
  }

  /**
   * Limpiar producto de compra directa
   */
  clearDirectPurchase(): void {
    this.directPurchaseProduct.set(null);
  }

  /**
   * Verificar si hay un producto configurado para compra directa
   */
  hasDirectPurchaseProduct(): boolean {
    return this.directPurchaseProduct() !== null;
  }

  /**
   * Incrementar cantidad del producto
   */
  incrementQuantity(): void {
    const current = this.directPurchaseProduct();
    if (current && current.quantity < current.product.stock) {
      this.directPurchaseProduct.set({
        ...current,
        quantity: current.quantity + 1
      });
    }
  }

  /**
   * Decrementar cantidad del producto
   */
  decrementQuantity(): void {
    const current = this.directPurchaseProduct();
    if (current && current.quantity > 1) {
      this.directPurchaseProduct.set({
        ...current,
        quantity: current.quantity - 1
      });
    }
  }

  /**
   * Establecer cantidad específica
   */
  setQuantity(quantity: number): void {
    const current = this.directPurchaseProduct();
    if (current && quantity >= 1 && quantity <= current.product.stock) {
      this.directPurchaseProduct.set({
        ...current,
        quantity
      });
    }
  }
}
