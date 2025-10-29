import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IOrders, IOrderDetail } from '../interfaces/orders.interface';
import { ICheckoutSummary } from '../interfaces/checkout.interface';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Eliminar una orden (para compra directa)
   */
  deleteOrder(orderId: string): Observable<{ success: boolean }> {

    return this.http.delete<any>(`${this.apiUrl}/${orderId}`).pipe(
      map(response => {
        return { success: response.success || true };
      }),
      catchError(error => {
        console.error('❌ OrderService: Error deleting order:', error);
        console.error('- Status:', error.status);
        console.error('- Message:', error.message);
        console.error('- URL:', `${this.apiUrl}/${orderId}`);
        return throwError(() => new Error('Error al eliminar la orden'));
      })
    );
  }

  /**
   * Actualizar productos de una orden existente (para carrito)
   */
  updateOrderProducts(orderId: string, checkoutData: ICheckoutSummary): Observable<{ success: boolean }> {
    const payload = {
      productos: checkoutData.items.map(item => ({
        productoId: item.idProducto,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precio,
        subtotal: item.subtotal
      })),
      subtotal: checkoutData.subtotal,
      impuestos: checkoutData.impuestos,
      costoEnvio: checkoutData.envio,
      descuentos: checkoutData.descuentos || 0,
      total: checkoutData.total,
      // Actualizar fecha límite para carrito (resetear 2 días)
      fechaLimitePago: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)).toISOString()
    };

    return this.http.put<any>(`${this.apiUrl}/${orderId}/products`, payload).pipe(
      map(response => ({ success: response.success || true })),
      catchError(error => {
        console.error('Error updating order products:', error);
        return throwError(() => new Error('Error al actualizar productos de la orden'));
      })
    );
  }

  /**
   * Verificar si el usuario tiene una orden pendiente
   */
  getUserPendingOrder(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}/pending`).pipe(
      map(response => response.data), // Retorna la orden o null
      catchError(error => {
        console.error('Error fetching pending order:', error);
        return of(null); // Si hay error, asumir que no hay orden pendiente
      })
    );
  }

  /**
   * Crear una nueva orden en el backend
   */
  createOrder(checkoutData: ICheckoutSummary): Observable<{ orderId: string; orderNumber: string; paymentDeadline: Date }> {
    const orderPayload = this.buildOrderPayload(checkoutData);

    return this.http.post<any>(`${this.apiUrl}`, orderPayload).pipe(
      map(response => {
        // Adaptar la respuesta del backend a lo que espera el frontend
        return {
          orderId: response.id || response._id || response.data?.id,
          orderNumber: response.numeroOrden || response.orderNumber || response.data?.numeroOrden,
          paymentDeadline: response.fechaLimitePago ? new Date(response.fechaLimitePago) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        };
      }),
      catchError(error => {
        console.error('Error creating order:', error);

        // Si el error es por orden pendiente existente, retornarlo para manejo especial
        if (error.status === 400 && error.error?.existingOrder) {
          return throwError(() => ({
            type: 'PENDING_ORDER_EXISTS',
            existingOrder: error.error.existingOrder,
            message: error.error.error || 'Ya tienes una orden pendiente'
          }));
        }

        return throwError(() => new Error('Error al crear la orden'));
      })
    );
  }

  /**
   * Actualizar método de pago de una orden existente
   */
  updatePaymentMethod(orderId: string, paymentMethodType: string, paymentMethodName: string): Observable<{ success: boolean }> {
    const payload = {
      paymentMethodType,
      paymentMethodName,
      lastPaymentMethodUpdate: new Date().toISOString()
    };

    return this.http.put<any>(`${this.apiUrl}/${orderId}/payment-method`, payload).pipe(
      map(response => ({ success: response.success })),
      catchError(error => {
        console.error('Error updating payment method:', error);
        return throwError(() => new Error('Error al actualizar método de pago'));
      })
    );
  }

  /**
   * Actualizar estado de una orden
   */
  updateOrderStatus(orderId: string, status: IOrders['status'], additionalData?: any): Observable<{ success: boolean }> {
    const payload = {
      estado: status,
      ...additionalData
    };

    console.log(`🔄 Actualizando estado de orden ${orderId} a '${status}'`, payload);

    return this.http.put<any>(`${this.apiUrl}/${orderId}/status`, payload).pipe(
      map(response => ({ success: response.success })),
      catchError(error => {
        console.error('Error updating order status:', error);
        return throwError(() => new Error('Error al actualizar estado de orden'));
      })
    );
  }

  /**
   * Subir comprobante de pago
   */
  uploadPaymentProof(orderId: string, file: File, paymentData: {
    referenceNumber: string;
    amount: number;
    paymentMethod: string;
    transactionDate: Date;
  }): Observable<{ success: boolean; proofUrl: string }> {
    // Validar que el monto sea un número válido
    const monto = Number(paymentData.amount);
    if (isNaN(monto) || monto < 0) {
      return throwError(() => new Error('El monto debe ser un número válido mayor o igual a 0'));
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('numeroReferencia', paymentData.referenceNumber);
    formData.append('monto', monto.toString());
    formData.append('metodoPago', paymentData.paymentMethod);
    formData.append('fechaTransaccion', paymentData.transactionDate.toISOString());

    return this.http.post<any>(`${this.apiUrl}/${orderId}/payment-proof`, formData).pipe(
      map(response => ({
        success: response.success,
        proofUrl: response.proofUrl
      })),
      catchError(error => {
        console.error('Error uploading payment proof:', error);
        return throwError(() => new Error('Error al subir comprobante de pago'));
      })
    );
  }

  /**
   * Obtener orden por ID
   */
  getOrderById(orderId: string): Observable<IOrders> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}`).pipe(
      map(response => {

        // El backend puede devolver directamente la orden o en response.data
        const orderData = response.data || response;

        if (!orderData) {
          throw new Error('No se encontraron datos de orden en la respuesta');
        }

        return orderData;
      }),
      catchError(error => {
        console.error('Error fetching order:', error);
        return throwError(() => new Error('Error al obtener la orden'));
      })
    );
  }

  /**
   * Obtener detalle completo de orden
   */
  getOrderDetail(orderId: string): Observable<IOrderDetail> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}/detail`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching order detail:', error);
        return throwError(() => new Error('Error al obtener detalle de orden'));
      })
    );
  }

  /**
   * Cancelar orden
   */
  cancelOrder(orderId: string, reason?: string): Observable<{ success: boolean }> {
    const payload = {
      reason: reason || 'Cancelada por el usuario',
      canceledAt: new Date().toISOString()
    };

    return this.http.put<any>(`${this.apiUrl}/${orderId}/cancel`, payload).pipe(
      map(response => ({ success: response.success })),
      catchError(error => {
        console.error('Error canceling order:', error);
        return throwError(() => new Error('Error al cancelar la orden'));
      })
    );
  }

  /**
   * Obtener órdenes del usuario actual
   */
  getUserOrders(userId: string, status?: IOrders['status']): Observable<IOrders[]> {
    let url = `${this.apiUrl}/user/${userId}`;
    if (status) {
      url += `?status=${status}`;
    }

    return this.http.get<any>(url).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching user orders:', error);
        return throwError(() => new Error('Error al obtener órdenes del usuario'));
      })
    );
  }

  /**
   * Construir payload para crear orden según DTOs del backend
   */
  private buildOrderPayload(checkoutData: ICheckoutSummary): any {
    const selectedAddress = checkoutData.direccionSeleccionada;
    const selectedPayment = checkoutData.metodoPagoSeleccionado;
    const currentUser = this.authService.getCurrentUser();

    if (!selectedAddress || !selectedPayment) {
      throw new Error('Datos de dirección y método de pago son requeridos');
    }

    if (!currentUser) {
      throw new Error('Usuario debe estar autenticado para crear orden');
    }

    // Construir payload exactamente como lo espera el backend
    const payload = {
      usuarioId: currentUser.id,
      productos: checkoutData.items.map(item => ({
        productoId: item.idProducto || '', // Backend espera 'productoId', no 'idProducto'
        nombre: item.nombre || '',
        cantidad: item.cantidad || 1,
        precioUnitario: item.precio || 0,
        subtotal: item.subtotal || 0
      })),
      direccionEnvio: {
        nombreCompleto: selectedAddress.nombreCompleto || '',
        telefono: selectedAddress.telefono || '',
        calle: selectedAddress.calle || '',
        numeroExterior: selectedAddress.numeroExterior || '',
        numeroInterior: selectedAddress.numeroInterior || undefined,
        colonia: selectedAddress.colonia || '',
        ciudad: selectedAddress.ciudad || '',
        estado: selectedAddress.estado || '',
        codigoPostal: selectedAddress.codigoPostal || '',
        referencias: selectedAddress.referencias || undefined
      },
      subtotal: checkoutData.subtotal || 0,
      impuestos: checkoutData.impuestos || 0,
      costoEnvio: checkoutData.envio || 0,
      descuentos: checkoutData.descuentos || 0,
      total: checkoutData.total || 0,
      metodoPago: selectedPayment.nombre || '',
      tipoMetodoPago: selectedPayment.tipo || 'transferencia'
    };

    return payload;
  }

  /**
   * Monitorear estado de una orden específica
   * Útil para detectar cambios de estado automáticamente
   */
  monitorOrderStatus(orderId: string, onStatusChange?: (newStatus: string) => void): Observable<any> {
    return new Observable(observer => {
      // Polling cada 30 segundos para verificar cambios de estado
      const interval = setInterval(() => {
        this.getOrderById(orderId).subscribe({
          next: (order) => {
            observer.next(order);
            if (onStatusChange) {
              // El backend puede devolver 'estado' pero la interfaz espera 'status'
              const status = (order as any).estado || order.status;
              onStatusChange(status);
            }
          },
          error: (error) => {
            console.error('Error monitoring order status:', error);
            // No detener el monitoring por errores temporales
          }
        });
      }, 30000); // 30 segundos

      // Cleanup function
      return () => {
        clearInterval(interval);
      };
    });
  }

  /**
   * Verificar si una orden puede ser modificada
   */
  canModifyOrder(order: IOrders): boolean {
    return ['pending'].includes(order.status);
  }

  /**
   * Verificar si una orden está expirada
   */
  isOrderExpired(order: IOrders): boolean {
    if (!order.paymentDeadline) return false;
    return new Date() > new Date(order.paymentDeadline);
  }

  /**
   * Calcular tiempo restante para el pago
   */
  getTimeRemainingForPayment(order: IOrders): { days: number; hours: number; minutes: number; expired: boolean } {
    if (!order.paymentDeadline) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    const now = new Date().getTime();
    const deadline = new Date(order.paymentDeadline).getTime();
    const diff = deadline - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, expired: false };
  }
}
