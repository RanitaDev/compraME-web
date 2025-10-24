import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ITaxConfig {
  ivaRate: number;
  ivaIncluded: boolean;
  freeShippingThreshold: number;
  defaultShippingCost: number;
  regionShippingRates: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class TaxConfigService {

  private defaultConfig: ITaxConfig = {
    ivaRate: 0.16,                    // 16% IVA México
    ivaIncluded: false,               // IVA se calcula aparte
    freeShippingThreshold: 1000,      // Envío gratis desde $1000
    defaultShippingCost: 99,          // Costo base de envío
    regionShippingRates: {
      '37': 99,   // León y alrededores
      'default': 149  // Otras ciudades
    }
  };

  /**
   * Obtener configuración fiscal actual
   * En producción esto vendría del backend
   */
  getTaxConfig(): Observable<ITaxConfig> {
    return of(this.defaultConfig);
  }

  /**
   * Calcular IVA sobre un subtotal
   */
  calculateTax(subtotal: number): Observable<number> {
    return new Observable(observer => {
      this.getTaxConfig().subscribe(config => {
        const tax = subtotal * config.ivaRate;
        observer.next(Number(tax.toFixed(2)));
        observer.complete();
      });
    });
  }

  /**
   * Calcular costo de envío
   */
  calculateShipping(subtotal: number, postalCode?: string): Observable<number> {
    return new Observable(observer => {
      this.getTaxConfig().subscribe(config => {
        // Envío gratis si supera el umbral
        if (subtotal >= config.freeShippingThreshold) {
          observer.next(0);
          observer.complete();
          return;
        }

        // Calcular según región
        let shippingCost = config.defaultShippingCost;

        if (postalCode) {
          const regionPrefix = postalCode.substring(0, 2);
          shippingCost = config.regionShippingRates[regionPrefix] || config.regionShippingRates['default'];
        }

        observer.next(shippingCost);
        observer.complete();
      });
    });
  }

  /**
   * Calcular totales completos
   */
  calculateTotals(subtotal: number, postalCode?: string): Observable<{
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  }> {
    return new Observable(observer => {
      this.calculateTax(subtotal).subscribe(tax => {
        this.calculateShipping(subtotal, postalCode).subscribe(shipping => {
          const total = subtotal + tax + shipping;

          observer.next({
            subtotal: Number(subtotal.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            total: Number(total.toFixed(2))
          });
          observer.complete();
        });
      });
    });
  }
}
