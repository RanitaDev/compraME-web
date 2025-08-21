import { Injectable, signal, computed } from '@angular/core';
import { ICartItem, ICartSummary } from '../interfaces/cart.interface';
import { IProduct } from '../interfaces/products.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = signal<ICartItem[]>([]);

  // Computed properties
  items = this.cartItems.asReadonly();

  totalItems = computed(() => {
    return this.cartItems().reduce((total, item) => total + item.cantidad, 0);
  });

  cartSummary = computed((): ICartSummary => {
    const items = this.cartItems();
    const totalItems = this.totalItems();
    const subtotal = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    const impuestos = subtotal * 0.16; // 16% IVA
    const envio = subtotal > 1000 ? 0 : 99; // Envío gratis arriba de $1000
    const total = subtotal + impuestos + envio;

    return {
      items,
      totalItems,
      subtotal,
      impuestos,
      envio,
      total
    };
  });

  isEmpty = computed(() => this.cartItems().length === 0);

  constructor() {
    // Cargar datos simulados iniciales
    this.loadInitialData();
  }

  private loadInitialData() {
    // Datos de ejemplo - normalmente cargarías desde localStorage o API
    const sampleItems: ICartItem[] = [
      {
        producto: {
          idProducto: 1,
          nombre: 'Auriculares Bluetooth Premium',
          descripcion: 'Experimenta una calidad de sonido excepcional con cancelación de ruido activa.',
          precio: 299.99,
          stock: 15,
          imagenes: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'],
          idCategoria: 1,
          activo: true,
          fechaCreacion: new Date('2024-01-15'),
          fechaActualizacion: new Date('2024-08-01'),
          color: '#667eea',
          destacado: true
        },
        cantidad: 2,
        fechaAgregado: new Date()
      },
      {
        producto: {
          idProducto: 2,
          nombre: 'Smartwatch Deportivo',
          descripcion: 'Monitorea tu salud 24/7 con GPS integrado, resistente al agua.',
          precio: 399.99,
          stock: 8,
          imagenes: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'],
          idCategoria: 2,
          activo: true,
          fechaCreacion: new Date('2024-02-20'),
          fechaActualizacion: new Date('2024-07-15'),
          color: '#48bb78',
          destacado: true
        },
        cantidad: 1,
        fechaAgregado: new Date()
      }
    ];

    this.cartItems.set(sampleItems);
  }

  addToCart(product: IProduct, quantity: number = 1): boolean {
    const currentItems = this.cartItems();
    const existingItemIndex = currentItems.findIndex(item => item.producto.idProducto === product.idProducto);

    if (existingItemIndex >= 0) {
      // El producto ya existe, actualizar cantidad
      const updatedItems = [...currentItems];
      const newQuantity = updatedItems[existingItemIndex].cantidad + quantity;

      if (newQuantity <= product.stock) {
        updatedItems[existingItemIndex].cantidad = newQuantity;
        this.cartItems.set(updatedItems);
        return true;
      }
      return false; // No hay suficiente stock
    } else {
      // Nuevo producto
      if (quantity <= product.stock) {
        const newItem: ICartItem = {
          producto: product,
          cantidad: quantity,
          fechaAgregado: new Date()
        };
        this.cartItems.set([...currentItems, newItem]);
        return true;
      }
      return false; // No hay suficiente stock
    }
  }

  removeFromCart(productId: number): void {
    const currentItems = this.cartItems();
    const updatedItems = currentItems.filter(item => item.producto.idProducto !== productId);
    this.cartItems.set(updatedItems);
  }

  updateQuantity(productId: number, newQuantity: number): boolean {
    const currentItems = this.cartItems();
    const itemIndex = currentItems.findIndex(item => item.producto.idProducto === productId);

    if (itemIndex >= 0) {
      const item = currentItems[itemIndex];

      if (newQuantity <= 0) {
        this.removeFromCart(productId);
        return true;
      }

      if (newQuantity <= item.producto.stock) {
        const updatedItems = [...currentItems];
        updatedItems[itemIndex].cantidad = newQuantity;
        this.cartItems.set(updatedItems);
        return true;
      }
    }
    return false; // No se pudo actualizar
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  getItemCount(productId: number): number {
    const item = this.cartItems().find(item => item.producto.idProducto === productId);
    return item ? item.cantidad : 0;
  }
}
