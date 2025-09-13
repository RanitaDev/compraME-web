import { Injectable, signal, computed } from '@angular/core';
import { ICartItem, ICartSummary } from '../interfaces/cart.interface';
import { IProduct } from '../interfaces/products.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Signals reactivos para el manejo del estado del carrito
  private cartItems = signal<ICartItem[]>([]);
  public items = this.cartItems.asReadonly();

  // Computed signal para el total de items en el carrito
  public totalItems = computed(() => {
    return this.cartItems().reduce((total, item) => total + item.cantidad, 0);
  });

  // Computed signal para el resumen completo del carrito (precios, impuestos, etc.)
  public cartSummary = computed((): ICartSummary => {
    const items = this.cartItems();
    const totalItems = this.totalItems();
    const subtotal = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    const impuestos = subtotal * 0.16; // IVA del 16%
    const envio = subtotal > 1000 ? 0 : 99; // Envío gratis arriba de $1000 MXN
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

  // Computed signal para verificar si el carrito está vacío
  public isEmpty = computed(() => this.cartItems().length === 0);

  constructor() {
    // Cargar datos simulados iniciales
    this.loadInitialData();
  }

  /**
   * Cargar datos iniciales del carrito
   * (Actualmente vacío - se pueden descomentar datos de prueba)
   */
  private loadInitialData() {
    // ========== DATOS DE PRUEBA ==========
    // Descomentar el siguiente bloque para probar las funcionalidades del carrito

    /*
    const productosPrueba: IProduct[] = [
      {
        _id: 'test-product-1',
        idProducto: 'test-product-1',
        nombre: 'Auriculares Bluetooth Premium',
        descripcion: 'Auriculares inalámbricos con cancelación de ruido',
        precio: 299.99,
        stock: 5, // Stock bajo para probar advertencias
        imagenes: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'],
        idCategoria: 1,
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        color: '#6366f1',
        destacado: false
      },
      {
        _id: 'test-product-2',
        idProducto: 'test-product-2',
        nombre: 'Smartwatch Deportivo',
        descripcion: 'Reloj inteligente con monitoreo de salud',
        precio: 199.99,
        stock: 10,
        imagenes: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'],
        idCategoria: 2,
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        color: '#10b981',
        destacado: true
      }
    ];

    const itemsPrueba: ICartItem[] = [
      {
        producto: productosPrueba[0],
        cantidad: 2,
        fechaAgregado: new Date()
      },
      {
        producto: productosPrueba[1],
        cantidad: 1,
        fechaAgregado: new Date()
      }
    ];

    // Establecer items de prueba en el carrito
    this.cartItems.set(itemsPrueba);
    console.log('🛒 Carrito inicializado con datos de prueba');
    */
  }

  /**
   * Agregar un producto al carrito o incrementar su cantidad si ya existe
   * @param product Producto a agregar
   * @param quantity Cantidad a agregar (por defecto 1)
   * @returns true si se agregó correctamente, false si no hay suficiente stock
   */
  public addToCart(product: IProduct, quantity: number = 1): boolean {
    const currentItems = this.cartItems();
    const existingItemIndex = currentItems.findIndex(item => item.producto._id === product._id);

    if (existingItemIndex >= 0) {
      // El producto ya existe en el carrito - incrementar cantidad
      const updatedItems = [...currentItems];
      const newQuantity = updatedItems[existingItemIndex].cantidad + quantity;

      // Verificar que no exceda el stock disponible
      if (newQuantity <= product.stock) {
        updatedItems[existingItemIndex].cantidad = newQuantity;
        this.cartItems.set(updatedItems);
        return true;
      }
      return false; // No hay suficiente stock para la cantidad solicitada
    } else {
      // Producto nuevo - agregarlo al carrito
      if (quantity <= product.stock) {
        const newItem: ICartItem = {
          producto: product,
          cantidad: quantity,
          fechaAgregado: new Date()
        };
        this.cartItems.set([...currentItems, newItem]);
        return true;
      }
      return false; // No hay suficiente stock para la cantidad solicitada
    }
  }

  /**
   * Remover un producto completamente del carrito
   * @param productId ID del producto a remover
   */
  removeFromCart(productId: string): void {
    const currentItems = this.cartItems();
    const updatedItems = currentItems.filter(item => item.producto._id !== productId);
    this.cartItems.set(updatedItems);
  }

  /**
   * Actualizar la cantidad de un producto en el carrito
   * @param productId ID del producto
   * @param newQuantity Nueva cantidad (si es 0 o menor, se elimina el producto)
   * @returns true si se actualizó correctamente, false si no se pudo
   */
  updateQuantity(productId: string, newQuantity: number): boolean {
    const currentItems = this.cartItems();
    const itemIndex = currentItems.findIndex(item => item.producto._id === productId);

    if (itemIndex >= 0) {
      const item = currentItems[itemIndex];

      // Si la nueva cantidad es 0 o menor, eliminar el producto del carrito
      if (newQuantity <= 0) {
        this.removeFromCart(productId);
        return true;
      }

      // Verificar que no exceda el stock disponible
      if (newQuantity <= item.producto.stock) {
        const updatedItems = [...currentItems];
        updatedItems[itemIndex].cantidad = newQuantity;
        this.cartItems.set(updatedItems);
        return true;
      }
    }
    return false; // No se pudo actualizar (producto no encontrado o cantidad inválida)
  }

  /**
   * Limpiar completamente el carrito
   */
  clearCart(): void {
    this.cartItems.set([]);
  }

  /**
   * Obtener la cantidad de un producto específico en el carrito
   * @param productId ID del producto
   * @returns Cantidad del producto en el carrito (0 si no está)
   */
  getItemCount(productId: string): number {
    const item = this.cartItems().find(item => item.producto._id === productId);
    return item ? item.cantidad : 0;
  }
}
