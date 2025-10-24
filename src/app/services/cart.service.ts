import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  ICartItem,
  ICartSummary,
  CarritoBackend,
  ResumenCarritoBackend,
  AgregarProductoDto,
  EliminarProductoDto
} from '../interfaces/cart.interface';
import { IProduct } from '../interfaces/products.interface';
import { AuthService } from './auth.service';
import { ToastService } from '../core/services/toast.service';
import { TaxConfigService } from './tax-config.service';
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
  private taxConfigService = inject(TaxConfigService);
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
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.manejarInicioSesion();
      } else {
        this.manejarCierreSesion();
      }
    });
  }

  /**
   * Maneja cuando la sesión del usuario ha caducado
   */
  private manejarSesionCaducada(): boolean {
    this.toastService.error('Sesión caducada');
    this.router.navigate(['/auth']);
    return false;
  }

  /**
   * Agregar un producto al carrito
   */
  public async agregarAlCarrito(producto: IProduct, cantidad: number = 1): Promise<boolean> {
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
   */
  public async actualizarCarritoCompleto(carrito: ICartItem[], idUsuario: string): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      return this.manejarSesionCaducada();
    }

    try {
      const resultado = await this.http.put<CarritoBackend>(`${this.apiUrl}/${idUsuario}/actualizar-cantidad`, { carrito })
        .pipe(
          catchError(error => {
            throw error;
          })
        ).toPromise();

      if (resultado) {
        await this.cargarResumenCarritoDesdeBackend().toPromise();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Eliminar un producto del carrito
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
      return false;
    }
  }

  /**
   * Actualizar la cantidad de un producto localmente sin backend
   */
  public actualizarCantidadLocal(productoID: string, nuevaCantidad: number): ICartItem[] {
    const items = [...this.cartItems()];
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
   * TEMPORAL - Para UX inmediata. Backend tiene la autoridad final
   */
  private recalcularResumenLocal(): void {
    const items = this.cartItems();
    const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);

    // Usar servicio centralizado para cálculos
    this.taxConfigService.calculateTotals(subtotal).subscribe(totals => {
      this.cartSummaryData.set({
        items: items,
        totalItems,
        subtotal: totals.subtotal,
        impuestos: totals.tax,
        envio: totals.shipping,
        total: totals.total
      });
    });
  }

  /**
   * Obtener la cantidad de un producto específico en el carrito
   */
  public obtenerCantidadProducto(productoID: string): number {
    const item = this.cartItems().find(item => item.producto._id === productoID);
    return item ? item.cantidad : 0;
  }

  /**
   * Obtener resumen completo del carrito con cálculos del backend
   */
  public async obtenerResumenCompleto(distanciaKm?: number): Promise<ICartSummary> {
    try {
      const resumen = await this.obtenerResumenCarritoBackend(distanciaKm).toPromise();
      if (resumen) {
        this.cartItems.set(resumen.items);
        this.cartSummaryData.set(resumen);
        return resumen;
      }
      return this.cartSummaryData();
    } catch (error) {
      return this.cartSummaryData();
    }
  }

  /**
   * Obtener resumen del carrito desde el backend
   */
  private obtenerResumenCarritoBackend(distanciaKm?: number): Observable<ResumenCarritoBackend> {
    const usuarioActual = this.authService.getCurrentUser();

    if (!usuarioActual) {
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
          throw error;
        })
      );
  }

  /**
   * Agregar producto al carrito en el backend
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
   * Eliminar producto del carrito en el backend
   */
  private eliminarProductoBackend(dto: EliminarProductoDto): Observable<CarritoBackend> {
    const usuarioActual = this.authService.getCurrentUser();
    if (!usuarioActual) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.delete<CarritoBackend>(`${this.apiUrl}/${usuarioActual.id}/producto`, { body: dto })
      .pipe(
        catchError(error => {
          throw error;
        })
      );
  }

  /**
   * Vaciar carrito en el backend
   */
  private vaciarCarritoBackend(): Observable<CarritoBackend> {
    const usuarioActual = this.authService.getCurrentUser();
    if (!usuarioActual) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.delete<CarritoBackend>(`${this.apiUrl}/${usuarioActual.id}/vaciar`)
      .pipe(
        catchError(error => {
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
      next: () => {},
      error: (error) => {}
    });
  }

  /**
   * Manejar cuando el usuario cierra sesión
   */
  private manejarCierreSesion(): void {
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
    return this.eliminarDelCarrito(productId);
  }

  /**
   * @deprecated Usar vaciarCarrito() en su lugar
   */
  public clearCart(): Promise<boolean> {
    return this.vaciarCarrito();
  }

}
