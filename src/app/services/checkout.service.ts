import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IAddress, IPaymentMethod, ICheckoutSummary } from '../interfaces/checkout.interface';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private addresses: IAddress[] = [
    {
      id: 1,
      alias: 'Casa',
      nombreCompleto: 'Juan Carlos Pérez',
      telefono: '477-123-4567',
      calle: 'Av. López Mateos',
      numeroExterior: '123',
      numeroInterior: 'Depto 4B',
      colonia: 'Centro',
      ciudad: 'León',
      estado: 'Guanajuato',
      codigoPostal: '37000',
      referencias: 'Casa azul, frente al parque',
      esPrincipal: true
    },
    {
      id: 2,
      alias: 'Trabajo',
      nombreCompleto: 'Juan Carlos Pérez',
      telefono: '477-987-6543',
      calle: 'Blvd. Adolfo López Mateos',
      numeroExterior: '2375',
      colonia: 'Jardines del Moral',
      ciudad: 'León',
      estado: 'Guanajuato',
      codigoPostal: '37160',
      referencias: 'Edificio corporativo, piso 3',
      esPrincipal: false
    },
    {
      id: 3,
      alias: 'Casa de mis padres',
      nombreCompleto: 'María Elena Rodríguez',
      telefono: '477-555-0123',
      calle: 'Calle Hidalgo',
      numeroExterior: '456',
      colonia: 'Barrio de Santiago',
      ciudad: 'León',
      estado: 'Guanajuato',
      codigoPostal: '37238',
      referencias: 'Casa esquina, portón verde',
      esPrincipal: false
    }
  ];

  private paymentMethods: IPaymentMethod[] = [
    {
      id: 1,
      tipo: 'tarjeta',
      nombre: 'Tarjeta de Crédito/Débito',
      descripcion: 'Visa, MasterCard, American Express',
      activo: true,
      tiempoEstimado: 'Inmediato'
    },
    {
      id: 2,
      tipo: 'oxxo',
      nombre: 'OXXO',
      descripcion: 'Paga en cualquier tienda OXXO',
      activo: true,
      tiempoEstimado: '24-48 hrs'
    },
    {
      id: 3,
      tipo: 'transferencia',
      nombre: 'Transferencia Bancaria',
      descripcion: 'SPEI, Banamex, BBVA, Santander',
      activo: true,
      tiempoEstimado: '2-4 hrs hábiles'
    }
  ];

  getAddresses(): Observable<IAddress[]> {
    return of(this.addresses);
  }

  getPrimaryAddress(): Observable<IAddress | null> {
    const primary = this.addresses.find(addr => addr.esPrincipal);
    return of(primary || null);
  }

  getPaymentMethods(): Observable<IPaymentMethod[]> {
    return of(this.paymentMethods.filter(method => method.activo));
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
          observer.next({ success: true, orderId });
        } else {
          observer.next({ success: false, error: 'Error al procesar el pago. Intente nuevamente.' });
        }
        observer.complete();
      }, 2000);
    });
  }

  addNewAddress(address: Omit<IAddress, 'id'>): Observable<IAddress> {
    const newAddress: IAddress = {
      ...address,
      id: Math.max(...this.addresses.map(a => a.id)) + 1
    };

    // Si es principal, quitar principal de las demás
    if (newAddress.esPrincipal) {
      this.addresses.forEach(addr => addr.esPrincipal = false);
    }

    this.addresses.push(newAddress);
    return of(newAddress);
  }
}
