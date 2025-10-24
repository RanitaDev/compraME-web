// Interfaces para la integración con PayPal

export interface IPayPalOrderRequest {
  orderId: string;
  amount: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shipping?: {
    name: string;
    address: string;
  };
}

export interface IPayPalOrderResponse {
  success: boolean;
  paypalOrderId?: string;
  approvalUrl?: string;
  error?: string;
}

export interface IPayPalCaptureRequest {
  paypalOrderId: string;
  orderId: string;
}

export interface IPayPalCaptureResponse {
  success: boolean;
  transactionId?: string;
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
  error?: string;
}

export interface IPayPalConfig {
  clientId: string;
  environment: 'sandbox' | 'production';
  currency: string;
}
