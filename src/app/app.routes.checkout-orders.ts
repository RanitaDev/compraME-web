import { Routes } from '@angular/router';
import { CheckoutConfirmationComponent } from './features/checkout/checkout-confirmation.component/checkout-confirmation.component';
import { OrderCreatedComponent } from './features/checkout/order-created.component/order-created.component';
import { PendingOrderModalComponent } from './features/checkout/pending-order-modal.component/pending-order-modal.component';
import { UploadPaymentProofComponent } from './features/checkout/upload-payment-proof.component/upload-payment-proof.component';
import { OrderTimelineComponent } from './features/checkout/order-timeline.component/order-timeline.component';
import { MyOrdersComponent } from './features/orders/my-orders.component/my-orders.component';

export const checkoutRoutes: Routes = [
  {
    path: 'checkout',
    children: [
      {
        path: 'confirmation',
        component: CheckoutConfirmationComponent,
        data: {
          title: 'Confirmar Compra',
          description: 'Revisa tu carrito y selecciona dirección de envío'
        }
      },
      {
        path: 'order-created/:ordenId',
        component: OrderCreatedComponent,
        data: {
          title: 'Orden Creada',
          description: 'Tu orden ha sido creada exitosamente. Revisa las instrucciones de pago.'
        }
      },
      {
        path: 'payment-proof/:ordenId',
        component: UploadPaymentProofComponent,
        data: {
          title: 'Subir Comprobante de Pago',
          description: 'Sube el comprobante de tu transacción bancaria'
        }
      },
      {
        path: 'pending/:ordenId',
        component: PendingOrderModalComponent,
        data: {
          title: 'Orden Pendiente',
          description: 'Ya tienes una orden pendiente. Complétala antes de crear una nueva.'
        }
      }
    ]
  }
];

export const ordersRoutes: Routes = [
  {
    path: 'orders',
    children: [
      {
        path: 'my-orders',
        component: MyOrdersComponent,
        data: {
          title: 'Mis Órdenes',
          description: 'Visualiza el estado de todas tus compras'
        }
      },
      {
        path: 'timeline/:ordenId',
        component: OrderTimelineComponent,
        data: {
          title: 'Timeline de Orden',
          description: 'Historial de eventos de tu orden'
        }
      }
    ]
  }
];

/**
 * ============================================
 * DOCUMENTACIÓN DE RUTAS
 * ============================================
 *
 * INTEGRACIÓN EN app.routes.ts:
 *   export const routes: Routes = [
 *     ...checkoutRoutes,
 *     ...ordersRoutes,
 *     { path: '', redirectTo: '/home', pathMatch: 'full' },
 *     { path: '**', redirectTo: '/home' }
 *   ];
 *
 * FLUJO DE NAVEGACIÓN:
 *   1. Checkout Confirmation → /checkout/confirmation
 *   2. Order Created → /checkout/order-created/:ordenId
 *   3. Upload Payment → /checkout/payment-proof/:ordenId
 *   4. My Orders → /orders/my-orders
 *   5. Order Timeline → /orders/timeline/:ordenId
 *
 * PARÁMETRO :ordenId:
 *   - Tipo: string (MongoDB ObjectId)
 *   - Obtener: this.route.snapshot.paramMap.get('ordenId')
 */
