import { IProduct } from './products.interface';

// Extendiendo tus interfaces existentes
export interface IOrders {
  id: string;
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'proof_uploaded' | 'paid' | 'shipped' | 'delivered' | 'canceled' | 'expired';
  // Campos adicionales para el detalle
  orderNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
  paymentMethod?: string;
  paymentMethodType?: 'transferencia' | 'deposito' | 'oxxo' | 'tarjeta' | 'paypal';
  subtotal?: number;
  taxes?: number;
  shippingCost?: number;
  discounts?: number;
  // Nuevos campos para lógica de negocio
  paymentProofUrl?: string;
  paymentDeadline?: Date;
  lastPaymentMethodUpdate?: Date;
  referenceNumber?: string;
}

export interface IOrderItem {
  productId: string;
  quantity: number;
  price: number;
  // Campos adicionales para mostrar en el detalle
  productName?: string;
  productImage?: string;
  subtotal?: number;
}

export interface IShipping {
  id: string;
  orderId: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  status: 'pending' | 'shipped' | 'delivered';
  // Campos adicionales para tracking
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  trackingUrl?: string;
}

// Nueva interface para el detalle completo del pedido
export interface IOrderDetail {
  order: IOrders;
  shipping: IShipping;
  timeline: IOrderTimeline[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface IOrderTimeline {
  id: string;
  orderId: string;
  status: string;
  description: string;
  timestamp: Date;
  isCompleted: boolean;
}
