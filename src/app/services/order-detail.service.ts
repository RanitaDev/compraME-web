import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IOrders, IOrderDetail, IOrderItem, IOrderTimeline, IShipping } from '../interfaces/orders.interface';

@Injectable({
  providedIn: 'root'
})
export class OrderDetailService {

  getOrderDetail(orderId: string): Observable<IOrderDetail> {
    // Datos simulados
    const mockOrderDetail: IOrderDetail = {
      order: {
        id: orderId,
        userId: 'user-123',
        orderNumber: orderId,
        createdAt: new Date('2024-08-15T10:30:00'),
        updatedAt: new Date('2024-08-16T14:20:00'),
        status: 'pending',
        paymentMethod: 'Tarjeta de Crédito Visa **** 4242',
        items: [
          {
            productId: '1',
            productName: 'Auriculares Bluetooth Premium',
            productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
            quantity: 2,
            price: 299.99,
            subtotal: 599.98
          },
          {
            productId: '2',
            productName: 'Smartwatch Deportivo',
            productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
            quantity: 1,
            price: 399.99,
            subtotal: 399.99
          }
        ],
        subtotal: 999.97,
        taxes: 159.99,
        shippingCost: 0,
        discounts: 0,
        totalAmount: 1159.96
      },
      shipping: {
        id: 'ship-456',
        orderId: orderId,
        address: 'Av. López Mateos 123, Depto 4B',
        city: 'León',
        postalCode: '37000',
        country: 'México',
        status: 'pending',
        trackingNumber: 'TRK789456123',
        carrier: 'Estafeta',
        estimatedDelivery: new Date('2024-08-20T18:00:00'),
        trackingUrl: 'https://rastreo.estafeta.com/RastreoWebInternet/consultaEnvio.do?numero=TRK789456123'
      },
      customerInfo: {
        name: 'Juan Carlos Pérez',
        email: 'juan.perez@email.com',
        phone: '477-123-4567'
      },
      timeline: [
        {
          id: '1',
          orderId: orderId,
          status: 'Pedido confirmado',
          description: 'Tu pedido ha sido confirmado y está siendo preparado',
          timestamp: new Date('2024-08-15T10:30:00'),
          isCompleted: true
        },
        {
          id: '2',
          orderId: orderId,
          status: 'Pago procesado',
          description: 'El pago ha sido procesado exitosamente',
          timestamp: new Date('2024-08-15T10:35:00'),
          isCompleted: true
        },
        {
          id: '3',
          orderId: orderId,
          status: 'Preparando pedido',
          description: 'Tu pedido está siendo preparado en nuestro almacén',
          timestamp: new Date('2024-08-16T09:15:00'),
          isCompleted: true
        },
        {
          id: '4',
          orderId: orderId,
          status: 'Listo para envío',
          description: 'Tu pedido está listo y será enviado pronto',
          timestamp: new Date('2024-08-17T14:00:00'),
          isCompleted: false
        },
        {
          id: '5',
          orderId: orderId,
          status: 'En tránsito',
          description: 'Tu pedido está en camino',
          timestamp: new Date('2024-08-18T08:00:00'),
          isCompleted: false
        },
        {
          id: '6',
          orderId: orderId,
          status: 'Entregado',
          description: 'Tu pedido ha sido entregado exitosamente',
          timestamp: new Date('2024-08-20T18:00:00'),
          isCompleted: false
        }
      ]
    };

    return of(mockOrderDetail);
  }

  cancelOrder(orderId: string): Observable<{ success: boolean; message: string }> {
    // Simular cancelación
    return new Observable(observer => {
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% éxito
        if (success) {
          observer.next({ success: true, message: 'Pedido cancelado exitosamente' });
        } else {
          observer.next({ success: false, message: 'No se pudo cancelar el pedido. Contacta soporte.' });
        }
        observer.complete();
      }, 1500);
    });
  }

  trackOrder(trackingNumber: string): Observable<{ success: boolean; url?: string }> {
    // Simular tracking
    return of({
      success: true,
      url: `https://rastreo.estafeta.com/RastreoWebInternet/consultaEnvio.do?numero=${trackingNumber}`
    });
  }
}
