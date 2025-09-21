import { IProduct } from './products.interface';

// Estructura de un item del carrito (mantiene compatibilidad con tu backend)
export interface ICartItem {
  producto: IProduct;
  cantidad: number;
  fechaAgregado: Date;
}

// Resumen del carrito que viene del backend (calculado automáticamente)
export interface ICartSummary {
  items: ICartItem[];
  totalItems: number;
  subtotal: number;
  impuestos: number;
  envio: number;
  total: number;
}

// ==================== DTOs PARA COMUNICACIÓN CON TU BACKEND ====================

// DTO para agregar un producto al carrito (coincide con tu AgregarProductoDto)
export interface AgregarProductoDto {
  productoID: string;
  cantidad: number;
}

// DTO para actualizar la cantidad de un producto (coincide con tu ActualizarCantidadDto)
export interface ActualizarCantidadDto {
  productoID: string;
  nuevaCantidad: number;
}

// DTO para eliminar un producto del carrito (coincide con tu EliminarProductoDto)
export interface EliminarProductoDto {
  productoID: string;
}

// DTO para crear carrito (coincide con tu CreateCarritoDto)
export interface CreateCarritoDto {
  usuarioID: string;
}

// ==================== RESPUESTAS DEL BACKEND ====================

// Estructura del carrito que viene del backend (simplificada, ya que usas obtenerResumenCarrito)
export interface CarritoBackend {
  _id: string;
  usuarioID: string;
  items: Array<{
    productoID: string;
    cantidad: number;
    fechaAgregado: Date;
  }>;
  fechaActualizacion: Date;
}

// Respuesta del endpoint obtenerResumenCarrito (coincide con tu ICartSummary)
export interface ResumenCarritoBackend {
  items: ICartItem[];
  totalItems: number;
  subtotal: number;
  impuestos: number;
  envio: number;
  total: number;
}
