/**
 * DTOs para creación y gestión de órdenes
 */

export interface CreateOrderDto {
  usuarioId: string;
  productos: OrderProductDto[];
  direccionEnvio: {
    nombreCompleto: string;
    telefono: string;
    calle: string;
    numeroExterior: string;
    numeroInterior?: string;
    colonia: string;
    ciudad: string;
    estado: string;
    codigoPostal: string;
    referencias?: string;
  };
  subtotal: number;
  impuestos: number;
  costoEnvio: number;
  descuentos?: number;
  total: number;
  metodoPago: 'transferencia' | 'deposito' | 'oxxo' | 'tarjeta' | 'paypal';
}

export interface OrderProductDto {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface UploadPaymentProofDto {
  numeroReferencia: string;
  monto: number;
  metodoPago: string;
  fechaTransaccion: Date;
  archivo: File;
}

export interface CancelOrderDto {
  razonCancelacion?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  ordenId: string;
  numeroOrden: string;
  estado: string;
  fechaLimitePago: Date;
  mensaje: string;
}

export interface PendingOrderResponse {
  success: boolean;
  data: {
    orden?: any;
    mensaje?: string;
  };
}
