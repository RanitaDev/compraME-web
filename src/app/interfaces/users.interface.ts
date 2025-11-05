// Información básica del usuario
export interface IUsuario {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  rolId: string;
  fechaNacimiento?: Date;
  avatar?: string;
  fechaRegistro: Date;
  activo: boolean;
}

// Dirección del usuario
export interface IDireccionUsuario {
  id: string;
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

// Historial de pedidos del usuario
export interface IPedidoUsuario {
  id: string;
  numeroOrden: string;
  fecha: Date;
  estado: 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado';
  total: number;
  cantidadProductos: number;
  direccionEnvio: string;
  metodoPago: string;
}

// Configuración de seguridad
export interface IConfiguracionSeguridad {
  cambiarPassword: boolean;
  verificacionDosPasos: boolean;
  notificacionesEmail: boolean;
  notificacionesSMS: boolean;
}

// Estadísticas del usuario
export interface IEstadisticasUsuario {
  totalPedidos: number;
  totalGastado: number;
  productosFavoritos: number;
  miembroDesde: Date;
}
