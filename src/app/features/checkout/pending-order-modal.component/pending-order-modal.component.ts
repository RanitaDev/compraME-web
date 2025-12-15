import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { OrderService } from '../../../services/order.service';
import { OrderCheckoutService } from '../../../services/order-checkout.service';
import { CheckoutStateService } from '../../../services/checkout-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { IOrders } from '../../../interfaces/orders.interface';
import { PrimeNgModule } from '../../../primeng.module';

@Component({
  selector: 'app-pending-order-modal',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './pending-order-modal.component.html',
  styleUrls: ['./pending-order-modal.component.css']
})
export class PendingOrderModalComponent implements OnInit {
  private orderService = inject(OrderService);
  private orderCheckoutService = inject(OrderCheckoutService);
  private checkoutState = inject(CheckoutStateService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  orden: IOrders | null = null;
  isLoading = true;
  tiempoRestante: any = null;

  ngOnInit(): void {
    // Si viene vía modal desde createOrder error
    if (this.config.data?.orden) {
      this.orden = this.config.data.orden;
      this.isLoading = false;
      this.actualizarTiempoRestante();
    } else {
      // Si viene vía ruta
      const ordenId = this.route.snapshot.paramMap.get('ordenId');
      if (ordenId) {
        this.loadOrden(ordenId);
      }
    }
  }

  /**
   * Cargar orden desde el servidor
   */
  private loadOrden(ordenId: string): void {
    this.orderService.getOrderById(ordenId)
      .subscribe({
        next: (orden) => {
          this.orden = orden;
          this.isLoading = false;
          this.actualizarTiempoRestante();
        },
        error: (error) => {
          console.error('Error cargando orden:', error);
          this.toastService.error('Error al cargar la orden pendiente');
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
  }

  /**
   * Ir a completar el pago
   */
  irACompletarPago(): void {
    if (!this.orden) return;

    this.ref.close();
    this.router.navigate(['/checkout/order-created', this.orden._id]);
  }

  /**
   * Crear nueva orden (cancelando la pendiente)
   */
  crearNuevaOrden(): void {
    if (!this.orden) return;

    const confirmacion = confirm(
      '¿Deseas cancelar la orden pendiente y crear una nueva? El stock será liberado.'
    );

    if (!confirmacion) return;

    this.orderCheckoutService.cancelOrder(this.orden._id, 'Usuario decidió crear nueva orden')
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Orden cancelada, puedes crear una nueva');
            this.ref.close();
            this.router.navigate(['/cart']);
          } else {
            this.toastService.error('Error al cancelar la orden anterior');
          }
        },
        error: (error) => {
          console.error('Error:', error);
          this.toastService.error('Error al procesar tu solicitud');
        }
      });
  }

  /**
   * Cerrar modal
   */
  cerrarModal(): void {
    this.ref.close();
  }
}
