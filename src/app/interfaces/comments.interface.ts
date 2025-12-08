export interface IComment {
  _id: string;
  productoId: string;
  usuarioId: string;
  nombreUsuario: string;
  avatarUsuario?: string;
  calificacion: number;
  titulo: string;
  texto: string;
  fechaCreacion: Date;
  fechaEdicion?: Date;
  verificado: boolean;
  util: number;
  usuariosUtil: string[];
  respuesta?: {
    texto: string;
    fecha: Date;
    autor: string;
  };
}

export interface ICreateComment {
  productoId: string;
  calificacion: number;
  titulo: string;
  texto: string;
}

export interface IUpdateComment {
  calificacion?: number;
  titulo?: string;
  texto?: string;
}

export interface IRatingStats {
  average: number;
  total: number;
  distribution: { [key: number]: number };
}
