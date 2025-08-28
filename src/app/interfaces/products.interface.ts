export interface IProduct {
  idProducto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenes: string[];
  idCategoria: number;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  color: string;
  destacado: boolean;
}
