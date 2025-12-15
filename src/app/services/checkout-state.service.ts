import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { IOrders } from '../interfaces/orders.interface';
import { OrderService } from './order.service';
import { OrderCheckoutService } from './order-checkout.service';
import { AuthService } from './auth.service';

interface CheckoutState {
  currentOrder: IOrders | null;
  isLoading: boolean;
  error: string | null;
  step: 'carrito' | 'confirmacion' | 'creada' | 'comprobante' | 'exito';
  tiempoRestante: {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
    expirado: boolean;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutStateService {
  private orderService = inject(OrderService);
  private orderCheckoutService = inject(OrderCheckoutService);
  private authService = inject(AuthService);

  private state = signal<CheckoutState>({
    currentOrder: null,
    isLoading: false,
    error: null,
    step: 'carrito',
    tiempoRestante: null
  });

  // Computed signals para acceso fácil
  public currentOrder = computed(() => this.state().currentOrder);
  public isLoading = computed(() => this.state().isLoading);
  public error = computed(() => this.state().error);
  public step = computed(() => this.state().step);
  public tiempoRestante = computed(() => this.state().tiempoRestante);

  constructor() {
    // Verificar si hay orden pendiente al inicializar
    this.checkForPendingOrder();

    // Actualizar tiempo restante cada segundo
    setInterval(() => this.actualizarTiempoRestante(), 1000);
  }

  /**
   * Verificar si el usuario tiene una orden pendiente
   */
  public checkForPendingOrder(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.orderService.getPendingOrder(user.id).subscribe({
      next: (orden) => {
        if (orden) {
          this.state.update(state => ({
            ...state,
            currentOrder: orden,
            step: 'creada'
          }));
          this.actualizarTiempoRestante();
        }
      },
      error: () => {
        console.error('Error verificando orden pendiente');
      }
    });
  }

  /**
   * Establecer la orden actual
   */
  public setCurrentOrder(orden: IOrders | null): void {
    this.state.update(state => ({
      ...state,
      currentOrder: orden
    }));

    if (orden) {
      this.actualizarTiempoRestante();
    }
  }

  /**
   * Establecer el paso del flujo
   */
  public setStep(step: CheckoutState['step']): void {
    this.state.update(state => ({
      ...state,
      step,
      error: null
    }));
  }

  /**
   * Establecer error
   */
  public setError(error: string | null): void {
    this.state.update(state => ({
      ...state,
      error
    }));
  }

  /**
   * Establecer estado de carga
   */
  public setLoading(isLoading: boolean): void {
    this.state.update(state => ({
      ...state,
      isLoading
    }));
  }

  /**
   * Actualizar el tiempo restante
   */
  private actualizarTiempoRestante(): void {
    const orden = this.state().currentOrder;
    if (!orden) return;

    const tiempoRestante = this.orderCheckoutService.calcularTiempoRestante(
      orden.fechaLimitePago
    );

    this.state.update(state => ({
      ...state,
      tiempoRestante
    }));

    // Si expiró, actualizar estado
    if (tiempoRestante.expirado && orden.estado === 'pending') {
      this.setError('Tu orden ha expirado. Crea una nueva orden para continuar.');
    }
  }

  /**
   * Limpiar el estado del checkout (después de compra exitosa)
   */
  public clearCheckout(): void {
    this.state.update(state => ({
      ...state,
      currentOrder: null,
      error: null,
      step: 'carrito'
    }));
  }

  /**
   * Obtener el estado actual (para debugging)
   */
  public getState(): CheckoutState {
    return this.state();
  }
}
