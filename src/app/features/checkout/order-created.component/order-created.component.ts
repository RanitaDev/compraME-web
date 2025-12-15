import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, interval, takeUntil } from 'rxjs';
import { OrderService } from '../../../services/order.service';
import { OrderCheckoutService } from '../../../services/order-checkout.service';
import { CheckoutStateService } from '../../../services/checkout-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { IOrders } from '../../../interfaces/orders.interface';
import { PrimeNgModule } from '../../../primeng.module';

@Component({
  selector: 'app-order-created',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './order-created.component.html',
  styleUrls: ['./order-created.component.css']
})
export class OrderCreatedComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private orderCheckoutService = inject(OrderCheckoutService);
  private checkoutState = inject(CheckoutStateService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  orden: IOrders | null = null;
  isLoading = true;
  tiempoRestante: any = null;
  metodoPagoInfo: any = null;
  mostrarInstrucciones = false;

  ngOnInit(): void {
    this.loadOrden();

    // Actualizar tiempo restante cada segundo
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.actualizarTiempoRestante();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar datos de la orden
   */
  public loadOrden(): void {
    const ordenId = this.route.snapshot.paramMap.get('ordenId');
    if (!ordenId) {
      this.toastService.error('Orden no encontrada');
      this.router.navigate(['/']);
      return;
    }

    this.orderService.getOrderById(ordenId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orden) => {
          this.orden = orden;
          this.checkoutState.setCurrentOrder(orden);
          this.isLoading = false;
          this.actualizarTiempoRestante();
          this.obtenerMetodoPagoInfo();
        },
        error: (error) => {
          console.error('Error cargando orden:', error);
          this.toastService.error('Error al cargar la orden');
          this.isLoading = false;
        }
      });
  }

  /**
   * Actualizar tiempo restante
   */
  private actualizarTiempoRestante(): void {
    if (!this.orden) return;

    this.tiempoRestante = this.orderCheckoutService.calcularTiempoRestante(
      this.orden.fechaLimitePago
    );

    // Si expiró, mostrar error
    if (this.tiempoRestante.expirado) {
      this.toastService.error('Tu orden ha expirado. Crea una nueva orden para continuar.');
    }
  }

  /**
   * Obtener información del método de pago
   */
  private obtenerMetodoPagoInfo(): void {
    if (!this.orden) return;

    const metodos: { [key: string]: any } = {
      'transferencia': {
        nombre: 'Transferencia Bancaria',
        icono: 'pi-building',
        instruccion: 'Ve a tu banco y realiza una transferencia a la cuenta proporcionada.'
      },
      'deposito': {
        nombre: 'Depósito Bancario',
        icono: 'pi-money-bill',
        instruccion: 'Realiza un depósito en cualquier sucursal bancaria.'
      },
      'oxxo': {
        nombre: 'Pago en OXXO',
        icono: 'pi-shopping-bag',
        instruccion: 'Ve a la tienda OXXO más cercana y realiza el pago.'
      },
      'tarjeta': {
        nombre: 'Tarjeta de Crédito/Débito',
        icono: 'pi-credit-card',
        instruccion: 'Utiliza tu tarjeta de crédito o débito para completar el pago.'
      },
      'paypal': {
        nombre: 'PayPal',
        icono: 'pi-paypal',
        instruccion: 'Completa el pago a través de tu cuenta de PayPal.'
      }
    };

    this.metodoPagoInfo = metodos[this.orden.metodoPago] || metodos['transferencia'];
  }

  /**
   * Ir a subir comprobante
   */
  irASubirComprobante(): void {
    if (!this.orden) return;
    this.router.navigate(['/checkout/payment-proof', this.orden._id]);
  }

  /**
   * Cancelar orden
   */
  cancelarOrden(): void {
    if (!this.orden) return;

    const confirmacion = confirm(
      '¿Estás seguro de que deseas cancelar esta orden? El stock será liberado inmediatamente.'
    );

    if (!confirmacion) return;

    this.orderCheckoutService.cancelOrder(this.orden._id, 'Cancelada por el usuario')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Orden cancelada, stock liberado');
            this.checkoutState.clearCheckout();
            setTimeout(() => {
              this.router.navigate(['/cart']);
            }, 2000);
          } else {
            this.toastService.error('Error al cancelar la orden');
          }
        },
        error: (error) => {
          console.error('Error cancelando orden:', error);
          this.toastService.error('Error al cancelar la orden');
        }
      });
  }

  /**
   * Copiar número de referencia al portapapeles
   */
  copiarNumeroOrden(): void {
    if (!this.orden) return;

    navigator.clipboard.writeText(this.orden.numeroOrden).then(() => {
      this.toastService.success('Número de orden copiado');
    });
  }

  /**
   * Obtener clase de alerta según tiempo restante
   */
  getAlertClass(): string {
    if (!this.tiempoRestante) return '';

    if (this.tiempoRestante.expirado) {
      return 'bg-red-50 border-red-200 text-red-800';
    }

    if (this.tiempoRestante.dias === 0 && this.tiempoRestante.horas <= 12) {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    }

    return 'bg-blue-50 border-blue-200 text-blue-800';
  }

  /**
   * Obtener icono de estado
   */
  getStatusIcon(): string {
    if (!this.orden) return '';

    switch (this.orden.estado) {
      case 'pending':
        return 'pi-clock';
      case 'proof_uploaded':
        return 'pi-check-circle';
      case 'paid':
        return 'pi-verified';
      case 'shipped':
        return 'pi-truck';
      case 'delivered':
        return 'pi-home';
      default:
        return 'pi-question-circle';
    }
  }

  /**
   * Obtener texto de estado
   */
  getStatusText(): string {
    if (!this.orden) return '';

    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente de Pago',
      'proof_uploaded': 'Comprobante Subido',
      'paid': 'Pagado',
      'shipped': 'En Tránsito',
      'delivered': 'Entregado',
      'canceled': 'Cancelado',
      'expired': 'Expirado'
    };

    return statusTexts[this.orden.estado] || 'Estado Desconocido';
  }

  /**
   * Verificar si la orden puede cancelarse
   */
  public puedeCancelarseOrden(): boolean {
    if (!this.orden) return false;
    return this.orderCheckoutService.puedeCancelarseOrden(this.orden.estado);
  }
}
