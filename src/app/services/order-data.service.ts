import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IOrderConfirmation } from '../interfaces/order-confirmation.interface';
import { ICheckoutSummary } from '../interfaces/checkout.interface';
import { AuthService } from './auth.service';
import { ProductImageService } from './product-image.service';

@Injectable({
  providedIn: 'root'
})
export class OrderDataService {
  private orderIdSubject = new BehaviorSubject<string | null>(null);
  public orderId$ = this.orderIdSubject.asObservable();

  // Almacenamiento temporal de datos de orden
  private currentOrderData = signal<IOrderConfirmation | null>(null);

  constructor(
    private authService: AuthService,
    private productImageService: ProductImageService
  ) {}

  setOrderId(orderId: string): void {
    this.orderIdSubject.next(orderId);
  }

  getOrderId(): string | null {
    return this.orderIdSubject.value;
  }

  clearOrderId(): void {
    this.orderIdSubject.next(null);
  }

  /**
   * Crear datos de orden a partir del resumen de checkout
   */
  createOrderFromCheckout(
    checkoutSummary: ICheckoutSummary,
    orderId: string
  ): Promise<IOrderConfirmation> {
    return new Promise(async (resolve, reject) => {
      try {
        const currentUser = this.authService.getCurrentUser();
        const selectedAddress = checkoutSummary.direccionSeleccionada;
        const selectedPayment = checkoutSummary.metodoPagoSeleccionado;

        if (!currentUser || !selectedAddress || !selectedPayment) {
          reject(new Error('Datos incompletos para crear la orden'));
          return;
        }

        // Obtener imágenes reales de los productos
        const productIds = checkoutSummary.items.map(item => item.idProducto);
        const productImages = await this.productImageService.getMultipleProductImages(productIds);

        const orderData: IOrderConfirmation = {
          ordenId: orderId,
          fecha: new Date(),
          estado: 'pendiente',
          cliente: {
            nombre: currentUser.nombre,
            email: currentUser.email,
            telefono: currentUser.telefono || selectedAddress.telefono
          },
          direccionEntrega: {
            nombreCompleto: selectedAddress.nombreCompleto,
            telefono: selectedAddress.telefono,
            direccionCompleta: `${selectedAddress.calle} ${selectedAddress.numeroExterior}${
              selectedAddress.numeroInterior ? ` ${selectedAddress.numeroInterior}` : ''
            }, ${selectedAddress.colonia}, ${selectedAddress.ciudad}, ${selectedAddress.estado} ${selectedAddress.codigoPostal}`,
            referencias: selectedAddress.referencias || ''
          },
          productos: checkoutSummary.items.map(item => ({
            idProducto: item.idProducto,
            nombre: item.nombre,
            imagen: productImages.get(item.idProducto) || this.productImageService.generatePlaceholderImage(item.nombre),
            cantidad: item.cantidad,
            precio: item.precio,
            subtotal: item.subtotal
          })),
          resumen: {
            subtotal: checkoutSummary.subtotal,
            impuestos: checkoutSummary.impuestos,
            envio: checkoutSummary.envio,
            total: checkoutSummary.total
          },
          metodoPago: {
            tipo: selectedPayment.tipo,
            nombre: selectedPayment.nombre,
            ultimosDigitos: selectedPayment.tipo === 'tarjeta' ? '****' : undefined
          },
          entregaEstimada: this.calculateDeliveryEstimate(selectedAddress.codigoPostal)
        };

        // Almacenar temporalmente
        this.currentOrderData.set(orderData);
        resolve(orderData);
      } catch (error) {
        reject(error);
      }
    });
  }  
  
  /**
   * Obtener datos de orden por ID
   */
  getOrderData(orderId: string): IOrderConfirmation | null {
    const current = this.currentOrderData();
    if (current && current.ordenId === orderId) {
      return current;
    }

    // En una implementación real, aquí harías una llamada al backend
    return null;
  }

  /**
   * Limpiar datos temporales de orden
   */
  clearOrderData(): void {
    this.currentOrderData.set(null);
  }

  /**
   * Calcular estimado de entrega basado en código postal
   */
  private calculateDeliveryEstimate(codigoPostal: string): {
    fechaMinima: Date;
    fechaMaxima: Date;
    diasHabiles: number;
  } {
    let diasMinimos = 3;
    let diasMaximos = 5;

    // Ajustar días según ubicación
    if (codigoPostal.startsWith('37')) {
      // León y alrededores - entrega más rápida
      diasMinimos = 2;
      diasMaximos = 3;
    } else {
      // Otras ciudades
      diasMinimos = 3;
      diasMaximos = 5;
    }

    const now = new Date();
    const fechaMinima = new Date(now.getTime() + diasMinimos * 24 * 60 * 60 * 1000);
    const fechaMaxima = new Date(now.getTime() + diasMaximos * 24 * 60 * 60 * 1000);

    return {
      fechaMinima,
      fechaMaxima,
      diasHabiles: diasMinimos
    };
  }

  /**
   * Simular procesamiento de pago
   */
  async processPayment(orderId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular 95% de éxito
        const success = Math.random() > 0.05;

        if (success) {
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: 'Error al procesar el pago. Verifica tus datos e intenta nuevamente.'
          });
        }
      }, 3000); // 3 segundos de procesamiento
    });
  }
}
