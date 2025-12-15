import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstadoPedido, IOrderDetail, IOrders } from '../interfaces/orders.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderDetailService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener detalle completo de un pedido (order + shipping + timeline + customerInfo)
   */
  getOrderDetail(orderId: string): Observable<IOrderDetail> {
    return this.http.get<IOrderDetail>(`${this.apiUrl}/${orderId}/detail`);
  }

  /**
   * Cancelar un pedido
   */
  cancelOrder(orderId: string, motivo?: string): Observable<IOrders> {
    return this.http.post<IOrders>(`${this.apiUrl}/${orderId}/cancel`, { motivo });
  }

  /**
   * Obtener información de tracking de un pedido
   */
  // trackOrder(trackingNumber: string): Observable<{ success: boolean; url?: string }> {
  //   return this.http.get<{ success: boolean; url?: string }>(
  //     `${this.apiUrl}/track/${trackingNumber}`
  //   );
  // }
}
