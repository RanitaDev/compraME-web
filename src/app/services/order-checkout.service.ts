import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CreateOrderDto, CreateOrderResponse, UploadPaymentProofDto, CancelOrderDto } from '../interfaces/order-creation.interface';
import { IOrders } from '../interfaces/orders.interface';
import { ICheckoutSummary } from '../interfaces/checkout.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderCheckoutService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  /**
   * Crear una nueva orden
   * Realiza las siguientes acciones:
   * - Crea la orden en el backend
   * - Resta el stock de los productos
   * - Genera un numeroOrden único
   * - Asigna estado PENDING con límite de 2 días
   */
  public createOrder(checkoutData: ICheckoutSummary, userId: string, direccionEnvio: any): Observable<CreateOrderResponse> {
    const payload: CreateOrderDto = {
      usuarioId: userId,
      productos: checkoutData.items.map(item => ({
        productoId: item.idProducto,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precio,
        subtotal: item.subtotal
      })),
      direccionEnvio,
      subtotal: checkoutData.subtotal,
      impuestos: checkoutData.impuestos,
      costoEnvio: checkoutData.envio,
      descuentos: checkoutData.descuentos || 0,
      total: checkoutData.total,
      metodoPago: checkoutData.metodoPagoSeleccionado?.tipo || 'transferencia'
    };

    return this.http.post<CreateOrderResponse>(`${this.apiUrl}`, payload)
      .pipe(
        catchError(error => {
          console.error('❌ Error creando orden:', error);

          // Manejar caso especial: usuario ya tiene orden pendiente
          if (error.status === 400 && error.error?.data?.orden) {
            return of({
              success: false,
              ordenId: error.error.data.orden._id,
              numeroOrden: error.error.data.orden.numeroOrden,
              estado: 'error_pending_exists',
              fechaLimitePago: error.error.data.orden.fechaLimitePago,
              mensaje: error.error.message || 'Ya tienes una orden pendiente'
            });
          }

          return of({
            success: false,
            ordenId: '',
            numeroOrden: '',
            estado: 'error',
            fechaLimitePago: new Date(),
            mensaje: error.error?.message || 'Error al crear la orden'
          });
        })
      );
  }

  /**
   * Subir comprobante de pago
   * Cambia el estado de la orden a PROOF_UPLOADED
   */
  public uploadPaymentProof(orderId: string, proofData: {
    numeroReferencia: string;
    monto: number;
    metodoPago: string;
    fechaTransaccion: Date;
    archivo: File;
  }): Observable<{ success: boolean; message: string; proofUrl?: string }> {
    const formData = new FormData();
    formData.append('numeroReferencia', proofData.numeroReferencia);
    formData.append('monto', proofData.monto.toString());
    formData.append('metodoPago', proofData.metodoPago);
    formData.append('fechaTransaccion', proofData.fechaTransaccion.toISOString());
    formData.append('archivo', proofData.archivo);

    return this.http.post<any>(`${this.apiUrl}/${orderId}/payment-proof`, formData)
      .pipe(
        map(response => ({
          success: response.success,
          message: response.message || 'Comprobante subido correctamente',
          proofUrl: response.proofUrl
        })),
        catchError(error => {
          console.error('❌ Error subiendo comprobante:', error);
          return of({
            success: false,
            message: error.error?.message || 'Error al subir el comprobante'
          });
        })
      );
  }

  /**
   * Cancelar una orden
   * Libera el stock y cambia estado a CANCELED
   */
  public cancelOrder(orderId: string, razonCancelacion?: string): Observable<{ success: boolean; message: string }> {
    const payload: CancelOrderDto = {
      razonCancelacion
    };

    return this.http.patch<any>(`${this.apiUrl}/${orderId}/cancelar`, payload)
      .pipe(
        map(response => ({
          success: response.success,
          message: response.message || 'Orden cancelada correctamente'
        })),
        catchError(error => {
          console.error('❌ Error cancelando orden:', error);
          return of({
            success: false,
            message: error.error?.message || 'Error al cancelar la orden'
          });
        })
      );
  }

  /**
   * Calcular el tiempo restante para completar el pago
   */
  public calcularTiempoRestante(fechaLimitePago: Date): {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
    expirado: boolean;
  } {
    const ahora = new Date().getTime();
    const limite = new Date(fechaLimitePago).getTime();
    const diferencia = limite - ahora;

    if (diferencia <= 0) {
      return {
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0,
        expirado: true
      };
    }

    return {
      dias: Math.floor(diferencia / (1000 * 60 * 60 * 24)),
      horas: Math.floor((diferencia / (1000 * 60 * 60)) % 24),
      minutos: Math.floor((diferencia / 1000 / 60) % 60),
      segundos: Math.floor((diferencia / 1000) % 60),
      expirado: false
    };
  }

  /**
   * Verificar si una orden puede ser cancelada
   */
  public puedeCancelarseOrden(estado: string): boolean {
    return ['pending', 'proof_uploaded'].includes(estado);
  }

  /**
   * Obtener URL de instrucciones de pago según método
   */
  public getInstruccionesPago(metodoPago: string): string {
    const instrucciones: { [key: string]: string } = {
      'transferencia': 'Ve a tu banco y realiza una transferencia a la cuenta proporcionada',
      'deposito': 'Realiza un depósito en cualquier sucursal bancaria',
      'oxxo': 'Ve a la tienda OXXO más cercana y realiza el pago',
      'tarjeta': 'Utiliza tu tarjeta de crédito o débito para completar el pago',
      'paypal': 'Completa el pago a través de tu cuenta de PayPal'
    };

    return instrucciones[metodoPago] || 'Completa el pago para validar tu orden';
  }
}
