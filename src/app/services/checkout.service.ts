import { Injectable, signal, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IAddress, IPaymentMethod, ICheckoutSummary } from '../interfaces/checkout.interface';
import { OrderDataService } from './order-data.service';
import { AddressService } from './address.service';
import { PaymentMethodService } from './payment-method.service';
import { TaxConfigService } from './tax-config.service';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private taxConfigService = inject(TaxConfigService);

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
    return this.taxConfigService.calculateShipping(subtotal, address.codigoPostal);
  }

  processOrder(orderData: ICheckoutSummary): Observable<{ success: boolean; orderId?: string; error?: string }> {
    return new Observable(observer => {
      setTimeout(async () => {
        const success = Math.random() > 0.1;
        if (success) {
          const orderId = 'ORD-' + Date.now().toString().slice(-8);

          try {
            await this.orderDataService.createOrderFromCheckout(orderData, orderId);
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
