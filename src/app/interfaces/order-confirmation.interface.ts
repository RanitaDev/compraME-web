export interface IOrderConfirmation {
  ordenId: string;
  fecha: Date;
  estado: 'pendiente' | 'procesando' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado';
  cliente: {
    nombre: string;
    email: string;
    telefono: string;
  };
  direccionEntrega: {
    nombreCompleto: string;
    telefono: string;
    direccionCompleta: string;
    referencias?: string;
  };
  productos: Array<{
    idProducto: string; // Cambio a string para consistencia con ICartProducts
    nombre: string;
    imagen: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
  resumen: {
    subtotal: number;
    impuestos: number;
    envio: number;
    descuentos?: number;
    total: number;
  };
  metodoPago: {
    tipo: string;
    nombre: string;
    ultimosDigitos?: string;
  };
  entregaEstimada: {
    fechaMinima: Date;
    fechaMaxima: Date;
    diasHabiles: number;
  };
  seguimiento?: {
    numeroGuia?: string;
    paqueteria?: string;
    urlSeguimiento?: string;
  };
}
