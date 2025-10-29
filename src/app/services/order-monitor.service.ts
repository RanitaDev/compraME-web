import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrderService } from './order.service';
import { CartService } from './cart.service';
import { AuthService } from './auth.service';
import { ToastService } from '../core/services/toast.service';

interface MonitoredOrder {
  orderId: string;
  subscription: Subscription;
  isFromCart: boolean; // Para saber si debe limpiar el carrito
}

@Injectable({
  providedIn: 'root'
})
export class OrderMonitorService implements OnDestroy {
  private monitoredOrders: Map<string, MonitoredOrder> = new Map();

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  /**
   * Empezar a monitorear una orden para detectar cambios de estado
   */
  startMonitoring(orderId: string, isFromCart: boolean = false) {
    // No monitorear si ya se está monitoreando
    if (this.monitoredOrders.has(orderId)) {
      return;
    }


    const subscription = this.orderService.monitorOrderStatus(orderId, (newStatus) => {
      this.handleStatusChange(orderId, newStatus, isFromCart);
    }).subscribe();

    this.monitoredOrders.set(orderId, {
      orderId,
      subscription,
      isFromCart
    });
  }

  /**
   * Detener el monitoreo de una orden específica
   */
  stopMonitoring(orderId: string) {
    const monitoredOrder = this.monitoredOrders.get(orderId);
    if (monitoredOrder) {
      monitoredOrder.subscription.unsubscribe();
      this.monitoredOrders.delete(orderId);
    }
  }

  /**
   * Manejar cambios de estado de la orden
   */
  private handleStatusChange(orderId: string, newStatus: string, isFromCart: boolean) {

    switch (newStatus) {
      case 'proof_uploaded':
        // Cuando el backend confirma que recibió y validó el comprobante
        if (isFromCart) {
          this.clearCartAndNotify(orderId);
        }
        this.toastService.info('Comprobante recibido', 'Tu comprobante está siendo verificado por el equipo.');
        break;

      case 'paid':
        if (isFromCart) {
          this.clearCartAndNotify(orderId);
        }
        this.toastService.success('¡Pago confirmado!', 'Tu pago ha sido verificado exitosamente.');
        break;      case 'shipped':
        this.toastService.info('Pedido enviado', 'Tu pedido está en camino. Recibirás el número de seguimiento pronto.');
        break;

      case 'delivered':
        this.toastService.success('¡Pedido entregado!', 'Tu pedido ha sido entregado exitosamente.');
        this.stopMonitoring(orderId); // Ya no necesitamos monitorear
        break;

      case 'canceled':
      case 'expired':
        this.toastService.warning('Orden cancelada', 'Tu orden ha sido cancelada o expiró.');
        this.stopMonitoring(orderId);
        break;
    }
  }

  /**
   * Limpiar carrito y notificar al usuario
   */
  private clearCartAndNotify(orderId: string) {
    console.log(`🧹 Limpiando carrito para orden ${orderId} (comprobante verificado)`);

    this.cartService.clearCart().then(success => {
      if (success) {
        console.log('✅ Carrito limpiado exitosamente');
        this.toastService.success('Carrito limpiado', 'Tu carrito ha sido limpiado automáticamente tras verificar el comprobante.');
      } else {
        console.error('❌ Error limpiando carrito');
      }
    }).catch(error => {
      console.error('❌ Error limpiando carrito:', error);
    });

    // Detener monitoreo después de limpiar carrito
    this.stopMonitoring(orderId);
  }

  /**
   * Obtener las órdenes que se están monitoreando actualmente
   */
  getMonitoredOrders(): string[] {
    return Array.from(this.monitoredOrders.keys());
  }

  /**
   * Detener todos los monitoreos (cleanup)
   */
  ngOnDestroy() {
    this.monitoredOrders.forEach(monitoredOrder => {
      monitoredOrder.subscription.unsubscribe();
    });
    this.monitoredOrders.clear();
  }
}
