import { IProduct } from './products.interface';

// ========== ENUMS ==========
export enum EstadoPedido {
  PENDING = 'pending',
  PROOF_UPLOADED = 'proof_uploaded',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export enum TipoMetodoPago {
  TRANSFERENCIA = 'transferencia',
  DEPOSITO = 'deposito',
  OXXO = 'oxxo',
  TARJETA = 'tarjeta',
  PAYPAL = 'paypal',
}

// ========== DIRECCIÓN DE ENVÍO ==========
export interface IShippingAddress {
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
}

// ========== HISTORIAL DE ESTADOS ==========
export interface IOrderStatusHistory {
  estado: EstadoPedido;
  fecha: Date;
  comentario?: string;
  isCompleted: boolean;
}

// ========== ORDEN COMPLETA (alineada con backend) ==========
export interface IOrders {
  _id: string;
  usuarioId: string;
  numeroOrden: string; // ORD-20251213-001
  productos: IOrderItem[];
  direccionEnvio: IShippingAddress;
  subtotal: number;
  impuestos: number;
  costoEnvio: number;
  descuentos?: number;
  total: number; // Cambiado de total
  estado: EstadoPedido;

  // Información de pago
  metodoPago: string; // Descripción legible: "Transferencia Bancaria BBVA"
  tipoMetodoPago: TipoMetodoPago; // Enum del tipo
  numeroReferencia?: string;
  comprobanteUrl?: string;

  // Fechas importantes
  fechaPedido: Date; // Fecha del pedido
  fechaLimitePago: Date; // 2 días desde creación
  fechaPago?: Date; // Cuando se confirmó el pago
  fechaEntregaEstimada?: Date; // Estimación de entrega
  fechaUltimoCambioMetodo?: Date; // Última vez que cambió método de pago
  uploadedFileDate?: Date; // Cuando subió comprobante
  fechaPreparacion?: Date; // Cuando se comenzó a preparar el pedido
  fechaEnvio?: Date; // Cuando se envió el pedido
  fechaEntrega?: Date; // Cuando se entregó el pedido
  createdAt?: Date;
  updatedAt?: Date;

  // Envío y tracking
  tracking?: string; // Número de guía
  notas?: string; // Notas del cliente

  // Historial
  historialEstados: IOrderStatusHistory[];

  // Metadatos
  stockReservado?: boolean; // true = stock reservado, false = stock liberado
  razonCancelacion?: string;
  archivada?: boolean;
  fechaArchivado?: Date;
}

export interface IOrderItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  imagen?: string;
}

// ========== TIMELINE DE ORDEN ==========
export interface IOrderTimeline {
  _id: string;
  ordenId: string;
  estado: EstadoPedido;
  descripcion: string;
  timestamp: Date;
  isCompleted: boolean;
  detallesAdicionales?: string;
}

// ========== INFORMACIÓN DE ENVÍO ==========
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

// ========== ORDEN PENDIENTE (formato simplificado) ==========
export interface IPendingOrder {
  id: string;
  numeroOrden: string;
  status: EstadoPedido;
  fechaLimitePago: Date;
  total: number;
  tipoMetodoPago: TipoMetodoPago;
}

// ========== RESPUESTA ORDEN PENDIENTE ==========
export interface IPendingOrderResponse {
  success: boolean;
  data: IPendingOrder | null;
}

// ========== ESTADÍSTICAS ==========
export interface IOrderStats {
  total: number;
  pending: number;
  proofUploaded: number;
  paid: number;
  shipped: number;
  delivered: number;
  canceled: number;
  expired: number;
  ventasTotales: number;
}

// ========== DETALLE COMPLETO DE ORDEN ==========
export interface IOrderDetail {
  order: IOrders;
  shipping: IShipping;
  timeline: IOrderTimeline[];
  tiempoRestante?: {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
    expirado: boolean;
  };
  customerInfo: {
    nombre: string;
    email: string;
    telefono: string;
  };
}

// ========== DTOs PARA CREAR/ACTUALIZAR ==========
export interface ICreateOrderDto {
  usuarioId: string;
  productos: IOrderItem[];
  direccionEnvio: IShippingAddress;
  subtotal: number;
  impuestos: number;
  costoEnvio: number;
  descuentos?: number;
  total: number;
  metodoPago: string;
  tipoMetodoPago: TipoMetodoPago;
  fechaEntregaEstimada?: string;
  notas?: string;
}

export interface IUpdateEstadoDto {
  estado: EstadoPedido;
  comentario?: string;
}

export interface IPaymentProofDto {
  numeroReferencia: string;
  monto: number;
  metodoPago: string;
  fechaTransaccion: Date;
}

// ========== RESPUESTAS DE ERROR ==========
export interface IApiError {
  success: false;
  error: string;
  existingOrder?: {
    id: string;
    numeroOrden: string;
  };
}
