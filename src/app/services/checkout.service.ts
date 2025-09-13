import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IAddress, IPaymentMethod, ICheckoutSummary } from '../interfaces/checkout.interface';
import { OrderDataService } from './order-data.service';
import { AddressService } from './address.service';
import { PaymentMethodService } from './payment-method.service';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  constructor(
    private orderDataService: OrderDataService,
    private addressService: AddressService,
    private paymentMethodService: PaymentMethodService
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
    // Simulación de cálculo de envío
    const baseShipping = 99;
    const freeShippingThreshold = 1000;

    if (subtotal >= freeShippingThreshold) {
      return of(0);
    }

    // Diferentes costos según la zona
    let shippingCost = baseShipping;
    if (address.codigoPostal.startsWith('37')) {
      shippingCost = 99; // León y alrededores
    } else {
      shippingCost = 149; // Otras ciudades
    }

    return of(shippingCost);
  }

  processOrder(orderData: ICheckoutSummary): Observable<{ success: boolean; orderId?: string; error?: string }> {
    // Simulación de procesamiento de orden
    return new Observable(observer => {
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          const orderId = 'ORD-' + Date.now().toString().slice(-8);

          // Crear datos de orden usando el OrderDataService
          try {
            this.orderDataService.createOrderFromCheckout(orderData, orderId);
            observer.next({ success: true, orderId });
          } catch (error) {
            observer.next({ success: false, error: 'Error al crear la orden' });
          }
        } else {
          observer.next({ success: false, error: 'Error al procesar el pago. Intente nuevamente.' });
        }
        observer.complete();
      }, 2000);
    });
  }

  addNewAddress(address: Omit<IAddress, 'id'>): Observable<IAddress> {
    return this.addressService.addNewAddress(address);
  }
}
