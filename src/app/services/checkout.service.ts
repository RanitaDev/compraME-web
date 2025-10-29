import { Injectable, signal, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { IAddress, IPaymentMethod, ICheckoutSummary } from '../interfaces/checkout.interface';
import { OrderDataService } from './order-data.service';
import { OrderService } from './order.service';
import { AddressService } from './address.service';
import { PaymentMethodService } from './payment-method.service';
import { AuthService } from './auth.service';
import { TaxConfigService } from './tax-config.service';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private taxConfigService = inject(TaxConfigService);

  constructor(
    private orderDataService: OrderDataService,
    private orderService: OrderService,
    private addressService: AddressService,
    private paymentMethodService: PaymentMethodService,
    private authService: AuthService
  ) {}

  getAddresses(): Observable<IAddress[]> {
    return this.addressService.getAddresses();
  }

  getPrimaryAddress(): Observable<IAddress | null> {
    return this.addressService.getPrimaryAddress();
  }

  getPaymentMethods(): Observable<IPaymentMethod[]> {
    return this.paymentMethodService.getPaymentMethods();
  }

  calculateShipping(address: IAddress, subtotal: number): Observable<number> {
    return this.taxConfigService.calculateShipping(subtotal, address.codigoPostal);
  }

  /**
   * Procesar orden - Lógica mejorada según tipo de compra
   */
  processOrder(orderData: ICheckoutSummary): Observable<{ success: boolean; orderId?: string; error?: string; paymentDeadline?: Date; isUpdate?: boolean }> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return of({
        success: false,
        error: 'Usuario debe estar autenticado'
      });
    }

    // Determinar si es compra directa
    const isDirectPurchase = this.isDirectPurchaseFlow(orderData);

    // Primero verificar si tiene orden pendiente
    return this.orderService.getUserPendingOrder(currentUser.id).pipe(
      switchMap(pendingOrder => {

        if (pendingOrder) {

          if (isDirectPurchase) {

            return this.orderService.deleteOrder(pendingOrder._id || pendingOrder.id).pipe(
              switchMap(() => {
                // Crear nueva orden después de eliminar la anterior
                return this.orderService.createOrder(orderData).pipe(
                  map(response => {
                    this.orderDataService.createOrderFromCheckout(orderData, response.orderId);

                    return {
                      success: true,
                      orderId: response.orderId,
                      paymentDeadline: response.paymentDeadline,
                      isUpdate: false
                    };
                  })
                );
              }),
              catchError(error => {
                console.error('❌ Error en compra directa:', error);
                return of({
                  success: false,
                  error: error.message || 'Error al procesar compra directa'
                });
              })
            );
          } else {
            // CARRITO con orden pendiente: Actualizar productos de orden existente

            return this.orderService.updateOrderProducts(pendingOrder.id, orderData).pipe(
              switchMap(() => {
                // También actualizar método de pago si cambió
                const paymentMethod = orderData.metodoPagoSeleccionado;
                if (paymentMethod && paymentMethod.tipo !== pendingOrder.tipoMetodoPago) {
                  return this.orderService.updatePaymentMethod(pendingOrder.id, paymentMethod.tipo, paymentMethod.nombre).pipe(
                    map(() => ({
                      success: true,
                      orderId: pendingOrder.id,
                      paymentDeadline: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)), // Nueva fecha límite
                      isUpdate: true
                    }))
                  );
                } else {
                  return of({
                    success: true,
                    orderId: pendingOrder.id,
                    paymentDeadline: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)), // Nueva fecha límite
                    isUpdate: true
                  });
                }
              }),
              catchError(error => of({
                success: false,
                error: error.message || 'Error al actualizar orden del carrito'
              }))
            );
          }
        } else {

          return this.orderService.createOrder(orderData).pipe(
            map(response => {
              this.orderDataService.createOrderFromCheckout(orderData, response.orderId);
              return {
                success: true,
                orderId: response.orderId,
                paymentDeadline: response.paymentDeadline,
                isUpdate: false
              };
            }),
            catchError(error => {
              if (error.type === 'PENDING_ORDER_EXISTS') {
                return of({
                  success: false,
                  error: error.message,
                  orderId: error.existingOrder.id
                });
              }

              return of({
                success: false,
                error: error.message || 'Error al crear la orden'
              });
            })
          );
        }
      }),
      catchError(error => {
        console.error('Error in processOrder:', error);
        return of({
          success: false,
          error: 'Error al procesar la orden. Intente nuevamente.'
        });
      })
    );
  }

  /**
   * Determinar si es flujo de compra directa
   */
  private isDirectPurchaseFlow(orderData?: ICheckoutSummary): boolean {
    return orderData?.isDirectPurchase || false;
  }  /**
   * Actualizar método de pago de una orden existente
   */
  updateOrderPaymentMethod(orderId: string, paymentMethod: IPaymentMethod): Observable<{ success: boolean; error?: string }> {
    return this.orderService.updatePaymentMethod(orderId, paymentMethod.tipo, paymentMethod.nombre).pipe(
      map(response => ({ success: response.success })),
      catchError(error => {
        console.error('Error updating payment method:', error);
        return of({
          success: false,
          error: error.message || 'Error al actualizar método de pago'
        });
      })
    );
  }

  addNewAddress(address: Omit<IAddress, 'id'>): Observable<IAddress> {
    return this.addressService.addNewAddress(address);
  }
}
