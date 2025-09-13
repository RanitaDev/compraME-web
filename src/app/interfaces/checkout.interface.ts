export interface IAddress {
  id: number;
  alias: string; // "Casa", "Trabajo", etc.
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
  esPrincipal: boolean;
}

export interface IPaymentMethod {
  id: number;
  tipo: 'tarjeta' | 'oxxo' | 'transferencia' | 'cuenta_vendedor';
  nombre: string;
  descripcion: string;
  activo: boolean;
  tiempoEstimado?: string; // "Inmediato", "24-48 hrs", etc.
}

export interface ICheckoutSummary {
  items: ICartProducts[];
  subtotal: number;
  impuestos: number;
  envio: number;
  descuentos?: number;
  total: number;
  direccionSeleccionada?: IAddress;
  metodoPagoSeleccionado?: IPaymentMethod;
}


export interface ICartProducts {
    idProducto: string;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
}
