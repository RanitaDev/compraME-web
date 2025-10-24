import { Injectable, signal, inject } from '@angular/core';
import { IProduct } from '../interfaces/products.interface';
import { ICartProducts, ICheckoutSummary } from '../interfaces/checkout.interface';
import { TaxConfigService } from './tax-config.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DirectPurchaseService {
  private directPurchaseProduct = signal<{ product: IProduct; quantity: number } | null>(null);
  private taxConfigService = inject(TaxConfigService);

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
  createDirectCheckoutSummary(): Observable<ICheckoutSummary | null> {
    return new Observable(observer => {
      const directPurchase = this.directPurchaseProduct();

      if (!directPurchase) {
        observer.next(null);
        observer.complete();
        return;
      }

      const { product, quantity } = directPurchase;
      const subtotal = product.precio * quantity;

      // Usar servicio centralizado para cálculos
      this.taxConfigService.calculateTotals(subtotal).subscribe(totals => {
        const checkoutItem: ICartProducts = {
          idProducto: product._id,
          nombre: product.nombre,
          cantidad: quantity,
          precio: product.precio,
          subtotal: subtotal
        };

        const summary: ICheckoutSummary = {
          items: [checkoutItem],
          subtotal: totals.subtotal,
          impuestos: totals.tax,
          envio: totals.shipping,
          total: totals.total
        };

        observer.next(summary);
        observer.complete();
      });
    });
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
