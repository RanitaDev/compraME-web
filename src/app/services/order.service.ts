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
   * Obtener todas las órdenes (para admin)
   */
  public getOrders(): Observable<IOrders[]> {
    return this.http.get<IOrders[]>(`${this.apiUrl}/`)
      .pipe(
        catchError(error => {
          console.error('❌ OrderService: Error fetching orders:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtener todas las órdenes (alias para getOrders)
   */
  public getAllOrders(): Observable<IOrders[]> {
    return this.getOrders();
  }

  /**
   * Obtener orden pendiente del usuario actual
   */
  public getPendingOrder(userId: string): Observable<IOrders | null> {
    return this.http.get<{ data: IOrders | null }>(`${this.apiUrl}/user/${userId}/pending`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('❌ OrderService: Error fetching pending order:', error);
          return of(null);
        })
      );
  }

  /**
   * Eliminar una orden (para compra directa)
   */
  public deleteOrder(orderId: string): Observable<{ success: boolean }> {

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
   * Actualizar productos de una orden existente
   */
  public updateOrderProducts(orderId: string, checkoutData: ICheckoutSummary): Observable<{ success: boolean }> {
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
      total: checkoutData.total
    };

    return this.http.patch<any>(`${this.apiUrl}/${orderId}`, payload).pipe(
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
  public getUserPendingOrder(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}/pending`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching pending order:', error);
        return of(null);
      })
    );
  }


  public createOrder(checkoutData: ICheckoutSummary): Observable<{ orderId: string; orderNumber: string; paymentDeadline: Date }> {
    let orderPayload;

    try {
      orderPayload = this.buildOrderPayload(checkoutData);
      console.log('OBJETO A MANDAR AL BACK', orderPayload);
    } catch (error: any) {
      return throwError(() =>
          new Error(`Error de validación: ${error.message}`
        ));
    }

    return this.http.post<any>(`${this.apiUrl}`, orderPayload).pipe(
      map(response => {
        const orderId = response._id || response.id || response.data?._id || response.data?.id;
        const numeroOrden = response.numeroOrden || response.orderNumber || response.data?.numeroOrden;
        const paymentDeadline = response.fechaLimitePago || response.data?.fechaLimitePago;

        if (!orderId) throw new Error('La respuesta del backend no contiene ID de orden');

        return {
          orderId: orderId.toString(),
          orderNumber: numeroOrden || 'N/A',
          paymentDeadline: paymentDeadline ? new Date(paymentDeadline) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        };
      }),

      catchError(error => {
        console.error('- Error Response:', error.error);

        if (error.status === 400 && error.error?.existingOrder) {
          return throwError(() => ({
            type: 'PENDING_ORDER_EXISTS',
            existingOrder: error.error.existingOrder,
            message: error.error.error || 'Ya tienes una orden pendiente'
          }));
        }

        const errorMessage = error.error?.message || error.error?.error ||
                              error.error?.statusText || 'Error al crear la orden';

        console.error('📌 Final error message:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Actualizar método de pago de una orden existente
   */
  public updatePaymentMethod(orderId: string, paymentMethodType: string, paymentMethodName: string): Observable<{ success: boolean }> {
    const payload = {
      tipoMetodoPago: paymentMethodType,
      metodoPago: paymentMethodName
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
   * Solo envía los campos que el backend permite (UpdateStatusDto)
   */
  public updateOrderStatus(
    orderId: string,
    status: IOrders['estado'],
    numeroReferencia?: string
  ): Observable<{ success: boolean; message?: string }> {
    // UpdateStatusDto solo acepta: estado, comprobanteUrl, numeroReferencia
    const payload: any = {
      estado: status
    };

    // Agregar número de referencia si se proporciona
    if (numeroReferencia) {
      payload.numeroReferencia = numeroReferencia;
    }

    return this.http.put<any>(`${this.apiUrl}/${orderId}/status`, payload).pipe(
      map(response => ({
        success: response.success || true,
        message: response.message || 'Estado actualizado correctamente'
      })),
      catchError(error => {
        console.error('Error updating order status:', error);
        return throwError(() => new Error('Error al actualizar estado de orden'));
      })
    );
  }

  /**
   * Subir comprobante de pago
   */
  public uploadPaymentProof(orderId: string, file: File, paymentData: {
    referenceNumber: string;
    amount: number;
    paymentMethod: string;
    transactionDate: Date;
  }): Observable<{ success: boolean; proofUrl: string }> {
    console.log('ENTRAMOS AL SERVICIO DE ORDENES');
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
  public getOrderById(orderId: string): Observable<IOrders> {
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
  public getOrderDetail(orderId: string): Observable<IOrderDetail> {
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
  public cancelOrder(orderId: string, reason?: string): Observable<{ success: boolean }> {
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
  public getUserOrders(userId: string, status?: IOrders['estado']): Observable<IOrders[]> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}${status ? `?status=${status}` : ''}`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching user orders:', error);
        return throwError(() => new Error('Error al obtener órdenes del usuario'));
      })
    );
  }


  private buildOrderPayload(checkoutData: ICheckoutSummary): any {
    const selectedAddress = checkoutData.direccionSeleccionada;
    const selectedPayment = checkoutData.metodoPagoSeleccionado;
    const currentUser = this.authService.getCurrentUser();

    if (!selectedAddress || !selectedPayment || !currentUser) {
      throw new Error('Datos de dirección, método de pago y usuario son requeridos');
    }

    if (!checkoutData.items || checkoutData.items.length === 0) {
      throw new Error('La orden debe contener al menos un producto');
    }

    if (!selectedAddress.nombreCompleto?.trim()) throw new Error('Nombre completo es requerido');
    if (!selectedAddress.telefono?.trim()) throw new Error('Teléfono es requerido');
    if (!selectedAddress.calle?.trim()) throw new Error('Calle es requerida');
    if (!selectedAddress.numeroExterior?.trim()) throw new Error('Número exterior es requerido');
    if (!selectedAddress.colonia?.trim()) throw new Error('Colonia es requerida');
    if (!selectedAddress.ciudad?.trim()) throw new Error('Ciudad es requerida');
    if (!selectedAddress.estado?.trim()) throw new Error('Estado es requerido');
    if (!selectedAddress.codigoPostal?.trim()) throw new Error('Código postal es requerido');

    const productosPayload = checkoutData.items.map(item => {
      if (!item.idProducto?.trim()) throw new Error('ID de producto es requerido');
      if (!item.nombre?.trim()) throw new Error('Nombre de producto es requerido');
      if (item.cantidad < 1) throw new Error('Cantidad debe ser mayor a 0');
      if (item.precio < 0) throw new Error('Precio no puede ser negativo');

      return {
        productoId: item.idProducto,
        nombre: item.nombre,
        cantidad: Math.round(item.cantidad),
        precioUnitario: Number(item.precio),
        subtotal: Number(item.subtotal)
      };
    }) || [];

    const direccionPayload = {
      nombreCompleto: selectedAddress.nombreCompleto.trim(),
      telefono: selectedAddress.telefono.trim(),
      calle: selectedAddress.calle.trim(),
      numeroExterior: selectedAddress.numeroExterior.trim(),
      numeroInterior: selectedAddress.numeroInterior?.trim() || '',
      colonia: selectedAddress.colonia.trim(),
      ciudad: selectedAddress.ciudad.trim(),
      estado: selectedAddress.estado.trim(),
      codigoPostal: selectedAddress.codigoPostal.trim(),
      referencias: selectedAddress.referencias?.trim() || ''
    };

    if (!selectedPayment.tipo?.trim()) throw new Error('Tipo de método de pago es requerido');
    if (!selectedPayment.nombre?.trim()) throw new Error('Nombre de método de pago es requerido');

    const payload = {
      usuarioId: currentUser.id,
      productos: productosPayload,
      direccionEnvio: direccionPayload,
      subtotal: Math.max(0, Number(checkoutData.subtotal || 0)),
      impuestos: Math.max(0, Number(checkoutData.impuestos || 0)),
      costoEnvio: Math.max(0, Number(checkoutData.envio || 0)),
      descuentos: Math.max(0, Number(checkoutData.descuentos || 0)),
      total: Math.max(0, Number(checkoutData.total || 0)),
      metodoPago: selectedPayment.nombre,
      tipoMetodoPago: selectedPayment.tipo,
      notas: ''
    };
    return payload;
  }

  /**
   * Monitorear estado de una orden específica
   * Útil para detectar cambios de estado automáticamente
   */
  public monitorOrderStatus(orderId: string, onStatusChange?: (newStatus: string) => void): Observable<any> {
    return new Observable(observer => {
      const interval = setInterval(() => {
        this.getOrderById(orderId).subscribe({
          next: (order) => {
            observer.next(order);
            if (onStatusChange) {
              // El backend puede devolver 'estado' pero la interfaz espera 'status'
              const status = (order as any).estado || order.estado;
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
  public canModifyOrder(order: IOrders): boolean {
    return ['pending'].includes(order.estado);
  }

  /**
   * Verificar si una orden está expirada
   */
  public isOrderExpired(order: IOrders): boolean {
    if (!order.fechaLimitePago) return false;
    return new Date() > new Date(order.fechaLimitePago);
  }

  /**
   * Calcular tiempo restante para el pago
   */
  public getTimeRemainingForPayment(order: IOrders): { days: number; hours: number; minutes: number; expired: boolean } {
    if (!order.fechaLimitePago) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    const now = new Date().getTime();
    const deadline = new Date(order.fechaLimitePago).getTime();
    const diff = deadline - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, expired: false };
  }

  public getArchivedOrders(): Observable<IOrders[]> {
    return this.http.get<IOrders[]>(`${this.apiUrl}/archivadas/all`)
      .pipe(
        catchError(error => {
          console.error('Error fetching archived orders:', error);
          return of([]);
        })
      );
  }

  public archiveOrder(orderId: string): Observable<{ success: boolean }> {
    return this.http.patch<any>(`${this.apiUrl}/${orderId}/archivo`, {})
      .pipe(
        map(response => ({ success: !!response })),
        catchError(error => {
          console.error('Error archiving order:', error);
          return of({ success: false });
        })
      );
  }

  public unarchiveOrder(orderId: string): Observable<{ success: boolean }> {
    return this.http.patch<any>(`${this.apiUrl}/${orderId}/desarchivo`, {})
      .pipe(
        map(response => ({ success: !!response })),
        catchError(error => {
          console.error('Error unarchiving order:', error);
          return of({ success: false });
        })
      );
  }

  public deleteArchivedOrder(orderId: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<any>(`${this.apiUrl}/${orderId}/archivo`)
      .pipe(
        map(response => ({ success: !!response })),
        catchError(error => {
          return of({
            success: false,
            message: error.error?.message || 'Error deleting archived order'
          });
        })
      );
  }

  public canDeleteOrder(order: IOrders): { canDelete: boolean; daysRemaining: number } {
    if (!order || !order.estado) {
      return { canDelete: false, daysRemaining: 30 };
    }

    const historiaCancelacion = order.historialEstados
      ?.find(h => h.estado === 'canceled');

    if (!historiaCancelacion) {
      return { canDelete: false, daysRemaining: 30 };
    }

    const fechaCancelacion = new Date(historiaCancelacion.fecha);
    const ahora = new Date();
    const diasTranscurridos = Math.floor((ahora.getTime() - fechaCancelacion.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 30 - diasTranscurridos);

    return { canDelete: diasTranscurridos >= 30, daysRemaining };
  }
}
