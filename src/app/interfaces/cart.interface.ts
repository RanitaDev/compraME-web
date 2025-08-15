import { IProduct } from './products.interface';

export interface ICartItem {
  producto: IProduct;
  cantidad: number;
  fechaAgregado: Date;
}

export interface ICartSummary {
  items: ICartItem[];
  totalItems: number;
  subtotal: number;
  impuestos: number;
  envio: number;
  total: number;
}
