import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  ICartItem,
  ICartSummary,
  CarritoBackend,
  ResumenCarritoBackend,
  AgregarProductoDto,
  ActualizarCantidadDto,
  EliminarProductoDto
} from '../interfaces/cart.interface';
import { IProduct } from '../interfaces/products.interface';
import { AuthService } from './auth.service';
import { ToastService } from '../core/services/toast.service';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private apiUrl = `${environment.apiUrl}/carritos`;

  private cartItems = signal<ICartItem[]>([]);
  private cartSummaryData = signal<ICartSummary>({
    items: [],
    totalItems: 0,
    subtotal: 0,
    impuestos: 0,
    envio: 0,
    total: 0
  });

  public items = this.cartItems.asReadonly();
  public totalItems = computed(() => {
    return this.cartSummaryData().totalItems;
  });

  public cartSummary = computed((): ICartSummary => {
    return this.cartSummaryData();
  });
  public isEmpty = computed(() => this.cartItems().length === 0);

  constructor() {
    // Escuchar cambios de autenticación para manejar login/logout
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.manejarInicioSesion();
      } else {
        this.manejarCierreSesion();
      }
    });

    // Métodos de debug en desarrollo
    if (typeof window !== 'undefined') {
      (window as any).carritoDebug = {
        obtenerCarrito: () => this.cartItems(),
        obtenerResumen: () => this.cartSummaryData(),
        vaciarCarrito: () => this.vaciarCarrito(),
        recargarDesdeBackend: () => this.cargarResumenCarritoDesdeBackend()
      };
    }
  }

  /**
   * Maneja cuando la sesión del usuario ha caducado
   * Muestra toast y redirige al login
   * @private
   * @returns {boolean} Siempre retorna false
   */
  private manejarSesionCaducada(): boolean {
    this.toastService.error('Sesión caducada');
    this.router.navigate(['/auth']);
    return false;
  }

  /**
   * Agregar un producto al carrito
   * @param producto - Producto completo a agregar
   * @param cantidad - Cantidad a agregar (por defecto 1)
   * @returns Promise<boolean> - true si se agregó correctamente
   */
  public async agregarAlCarrito(producto: IProduct, cantidad: number = 1): Promise<boolean> {
    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      return this.manejarSesionCaducada();
    }

    try {
      const dto: AgregarProductoDto = {
        productoID: producto._id,
        cantidad: cantidad
      };
      const carrito = await this.agregarProductoBackend(dto).toPromise();

      if (carrito) {
        await this.cargarResumenCarritoDesdeBackend().toPromise();
        return true;
      }
      return false;
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Actualizar el carrito completo en el backend
   * @param carrito - Array completo del carrito con las cantidades actualizadas
   * @param idUsuario - ID del usuario
   * @returns Promise<boolean> - true si se actualizó correctamente
   */
  public async actualizarCarritoCompleto(carrito: ICartItem[], idUsuario: string): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      return this.manejarSesionCaducada();
    }

    try {
      const resultado = await this.http.put<CarritoBackend>(`${this.apiUrl}/${idUsuario}/actualizar-cantidad`, { carrito })
        .pipe(
          catchError(error => {
            console.error('Error actualizando carrito completo:', error);
            throw error;
          })
        ).toPromise();

      if (resultado) {
        // Recargar el resumen desde el backend después de la actualización
        await this.cargarResumenCarritoDesdeBackend().toPromise();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error actualizando carrito completo:', error);
      return false;
    }
  }

  /**
   * Eliminar un producto del carrito
   * @param productoID - ID del producto a eliminar
   * @returns Promise<boolean> - true si se eliminó correctamente
   */
  public async eliminarDelCarrito(productoID: string): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      return this.manejarSesionCaducada();
    }

    try {
      const dto: EliminarProductoDto = {
        productoID: productoID
      };

      const carrito = await this.eliminarProductoBackend(dto).toPromise();

      if (carrito) {
        await this.cargarResumenCarritoDesdeBackend().toPromise();
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Vaciar completamente el carrito
   * @returns Promise<boolean> - true si se vació correctamente
   */
  public async vaciarCarrito(): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      this.cartItems.set([]);
      this.cartSummaryData.set({
        items: [],
        totalItems: 0,
        subtotal: 0,
        impuestos: 0,
        envio: 0,
        total: 0
      });
      return true;
    }

    try {
      const carrito = await this.vaciarCarritoBackend().toPromise();

      if (carrito) {
        // Limpiar estado local
        this.cartItems.set([]);
        this.cartSummaryData.set({
          items: [],
          totalItems: 0,
          subtotal: 0,
          impuestos: 0,
          envio: 0,
          total: 0
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error vaciando carrito:', error);
      return false;
    }
  }

  /**
   * Actualizar la cantidad de un producto localmente (sin backend)
   * Usado para actualizaciones optimistas antes del debounce
   * @param productoID - ID del producto
   * @param nuevaCantidad - Nueva cantidad (si es 0, se elimina el producto)
   */
  public actualizarCantidadLocal(productoID: string, nuevaCantidad: number): ICartItem[] {
    const items = [...this.cartItems()]; // Crear una copia del array
    const itemIndex = items.findIndex(item => item.producto?.productoID === productoID);

    if (itemIndex === -1) return [];

    if (nuevaCantidad <= 0) {
      items.splice(itemIndex, 1);
      this.cartItems.set(items);
    } else {
      items[itemIndex] = {
        ...items[itemIndex],
        cantidad: nuevaCantidad
      };
      this.cartItems.set(items);
    }

    this.recalcularResumenLocal();
    return items;
  }

  /**
   * Recalcular el resumen del carrito basado en los items locales
   * @private
   */
  private recalcularResumenLocal(): void {
    const items = this.cartItems();
    const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    const impuestos = subtotal * 0.16; // IVA 16%
    const envio = subtotal >= 1000 ? 0 : 150; // Envío gratis para compras mayores a $1000
    const total = subtotal + impuestos + envio;

    this.cartSummaryData.set({
      items: items,
      totalItems,
      subtotal,
      impuestos,
      envio,
      total
    });
  }

  /**
   * Obtener la cantidad de un producto específico en el carrito
   * @param productoID - ID del producto
   * @returns Cantidad del producto en el carrito (0 si no está)
   */
  public obtenerCantidadProducto(productoID: string): number {
    const item = this.cartItems().find(item => item.producto._id === productoID);
    return item ? item.cantidad : 0;
  }

  /**
   * Obtener resumen completo del carrito (con cálculos del backend)
   * @param distanciaKm - Distancia en kilómetros para calcular envío (opcional)
   * @returns Promise<ICartSummary> - Resumen completo del carrito
   */
  public async obtenerResumenCompleto(distanciaKm?: number): Promise<ICartSummary> {
    try {
      const resumen = await this.obtenerResumenCarritoBackend(distanciaKm).toPromise();
      if (resumen) {
        // Actualizar estado local con el resumen del backend
        this.cartItems.set(resumen.items);
        this.cartSummaryData.set(resumen);
        return resumen;
      }
      return this.cartSummaryData();
    } catch (error) {
      console.error('❌ Error obteniendo resumen del carrito:', error);
      return this.cartSummaryData();
    }
  }

  /**
   * Obtener resumen del carrito desde el backend (usando tu endpoint GET /carritos/resumen/:usuarioID)
   */
  private obtenerResumenCarritoBackend(distanciaKm?: number): Observable<ResumenCarritoBackend> {
    const usuarioActual = this.authService.getCurrentUser();

    if (!usuarioActual) {
      console.error('❌ [CartService] Usuario no autenticado');
      return throwError(() => new Error('Usuario no autenticado'));
    }

    let url = `${this.apiUrl}/resumen/${usuarioActual.id}`;
    if (distanciaKm !== undefined) {
      url += `?distancia=${distanciaKm}`;
    }

    return this.http.get<ResumenCarritoBackend>(url)
      .pipe(
        catchError(error => {
          if (error.status === 404) {
            return of({
              items: [],
              totalItems: 0,
              subtotal: 0,
              impuestos: 0,
              envio: 0,
              total: 0
            });
          }
          console.error('Error obteniendo resumen del carrito:', error);
          throw error;
        })
      );
  }

  /**
   * Agregar producto al carrito en el backend (usando tu endpoint POST /carritos/:usuarioID/agregar)
   */
  private agregarProductoBackend(dto: AgregarProductoDto): Observable<CarritoBackend> {
    const usuarioActual = this.authService.getCurrentUser();
    if (!usuarioActual) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.post<CarritoBackend>(`${this.apiUrl}/agregar/${usuarioActual.id}`, dto)
      .pipe(
        catchError(error => {
          throw error;
        })
      );
  }

  /**
   * Eliminar producto del carrito en el backend (usando tu endpoint DELETE /carritos/:usuarioID/producto)
   */
  private eliminarProductoBackend(dto: EliminarProductoDto): Observable<CarritoBackend> {
    const usuarioActual = this.authService.getCurrentUser();
    if (!usuarioActual) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.delete<CarritoBackend>(`${this.apiUrl}/${usuarioActual.id}/producto`, { body: dto })
      .pipe(
        catchError(error => {
          console.error('Error eliminando producto del carrito:', error);
          throw error;
        })
      );
  }

  /**
   * Vaciar carrito en el backend (usando tu endpoint DELETE /carritos/:usuarioID/vaciar)
   */
  private vaciarCarritoBackend(): Observable<CarritoBackend> {
    const usuarioActual = this.authService.getCurrentUser();
    if (!usuarioActual) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.delete<CarritoBackend>(`${this.apiUrl}/${usuarioActual.id}/vaciar`)
      .pipe(
        catchError(error => {
          console.error('Error vaciando carrito:', error);
          throw error;
        })
      );
  }

  /**
   * Cargar resumen del carrito desde el backend y sincronizar con el estado local
   */
  public cargarResumenCarritoDesdeBackend(distanciaKm?: number): Observable<void> {

    return this.obtenerResumenCarritoBackend(distanciaKm).pipe(
      tap(resumen => {
        // Actualizar estado local con los datos del backend
        this.cartItems.set(resumen.items);
        this.cartSummaryData.set(resumen);
      }),
      map(() => void 0),
      catchError(error => {
        this.cartItems.set([]);
        this.cartSummaryData.set({
          items: [],
          totalItems: 0,
          subtotal: 0,
          impuestos: 0,
          envio: 0,
          total: 0
        });
        throw error;
      })
    );
  }

  /**
   * Manejar cuando el usuario inicia sesión
   */
  private manejarInicioSesion(): void {
    this.cargarResumenCarritoDesdeBackend().subscribe({
      next: () => {
        // Carrito sincronizado desde backend
      },
      error: (error) => {
        console.error('❌ Error cargando carrito desde backend:', error);
      }
    });
  }

  /**
   * Manejar cuando el usuario cierra sesión
   */
  private manejarCierreSesion(): void {

    // Solo limpiar el estado local
    this.cartItems.set([]);
    this.cartSummaryData.set({
      items: [],
      totalItems: 0,
      subtotal: 0,
      impuestos: 0,
      envio: 0,
      total: 0
    });
  }

  /**
   * @deprecated Usar eliminarDelCarrito() en su lugar
   */
  public removeFromCart(productId: string): Promise<boolean> {
    console.warn('⚠️ removeFromCart() está deprecado, usar eliminarDelCarrito()');
    return this.eliminarDelCarrito(productId);
  }

  /**
   * @deprecated Usar vaciarCarrito() en su lugar
   */
  public clearCart(): Promise<boolean> {
    console.warn('⚠️ clearCart() está deprecado, usar vaciarCarrito()');
    return this.vaciarCarrito();
  }

}
