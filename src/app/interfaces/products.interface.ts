import { Category } from "./categories.interface";
export interface IProduct {
  _id: string;
  idProducto?: string;
  productoID?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenes: string[];
  idCategoria?: string;
  categoriaId?: string;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  color: string;
  destacado: boolean;
  categoriaCompleta?: Category;
}
