import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  IPayPalOrderRequest,
  IPayPalOrderResponse,
  IPayPalCaptureRequest,
  IPayPalCaptureResponse,
  IPayPalConfig
} from '../interfaces/paypal.interface';

@Injectable({
  providedIn: 'root'
})
export class PayPalService {
  private readonly apiUrl = environment.apiUrl;
  private isProcessingSubject = new BehaviorSubject<boolean>(false);
  public isProcessing$ = this.isProcessingSubject.asObservable();

  private paypalConfig: IPayPalConfig = {
    clientId: environment.paypal?.clientId || '',
    environment: environment.paypal?.environment || 'sandbox',
    currency: 'MXN'
  };

  constructor(private http: HttpClient) {}

  /**
   * Crear una orden de PayPal en el backend
   */
  createPayPalOrder(orderRequest: IPayPalOrderRequest): Observable<IPayPalOrderResponse> {
    this.isProcessingSubject.next(true);

    return this.http.post<IPayPalOrderResponse>(
      `${this.apiUrl}/payments/paypal/create-order`,
      orderRequest
    );
  }

  /**
   * Capturar el pago después de la aprobación del usuario
   */
  capturePayPalPayment(captureRequest: IPayPalCaptureRequest): Observable<IPayPalCaptureResponse> {
    return this.http.post<IPayPalCaptureResponse>(
      `${this.apiUrl}/payments/paypal/capture`,
      captureRequest
    );
  }

  /**
   * Procesar pago PayPal completo (crear orden + redirigir)
   */
  async processPayPalPayment(orderData: {
    orderId: string;
    amount: number;
    items: Array<{ name: string; quantity: number; price: number; }>;
    shipping?: { name: string; address: string; };
  }): Promise<{ success: boolean; approvalUrl?: string; error?: string; }> {
    try {
      this.isProcessingSubject.next(true);

      const orderRequest: IPayPalOrderRequest = {
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: this.paypalConfig.currency,
        items: orderData.items,
        shipping: orderData.shipping
      };

      // Crear orden en PayPal
      const response = await this.createPayPalOrder(orderRequest).toPromise();

      if (response?.success && response.approvalUrl) {
        return {
          success: true,
          approvalUrl: response.approvalUrl
        };
      } else {
        return {
          success: false,
          error: response?.error || 'Error al crear la orden de PayPal'
        };
      }
    } catch (error) {
      console.error('Error en processPayPalPayment:', error);
      return {
        success: false,
        error: 'Error inesperado al procesar el pago con PayPal'
      };
    } finally {
      this.isProcessingSubject.next(false);
    }
  }

  /**
   * Manejar el retorno exitoso de PayPal
   */
  async handlePayPalReturn(paypalOrderId: string, orderId: string): Promise<{ success: boolean; error?: string; }> {
    try {
      this.isProcessingSubject.next(true);

      const captureRequest: IPayPalCaptureRequest = {
        paypalOrderId,
        orderId
      };

      const response = await this.capturePayPalPayment(captureRequest).toPromise();

      if (response?.success && response.status === 'COMPLETED') {
        return { success: true };
      } else {
        return {
          success: false,
          error: response?.error || 'Error al capturar el pago de PayPal'
        };
      }
    } catch (error) {
      console.error('Error en handlePayPalReturn:', error);
      return {
        success: false,
        error: 'Error inesperado al confirmar el pago'
      };
    } finally {
      this.isProcessingSubject.next(false);
    }
  }

  /**
   * Verificar si PayPal está configurado correctamente
   */
  isPayPalConfigured(): boolean {
    return !!(this.paypalConfig.clientId && this.paypalConfig.environment);
  }

  /**
   * Obtener configuración de PayPal
   */
  getPayPalConfig(): IPayPalConfig {
    return { ...this.paypalConfig };
  }

  /**
   * Resetear estado de procesamiento
   */
  resetProcessingState(): void {
    this.isProcessingSubject.next(false);
  }
}
