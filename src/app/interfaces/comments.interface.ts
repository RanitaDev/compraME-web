export interface IComment {
  idComentario: number;
  idProducto: number;
  nombreUsuario: string;
  avatarUsuario?: string;
  calificacion: number; // 1-5 estrellas
  titulo: string;
  comentario: string;
  fechaComentario: Date;
  verificado: boolean; // Si es una compra verificada
  util: number; // Votos de "útil"
  respuesta?: {
    texto: string;
    fecha: Date;
    autor: string; // Ej: "Equipo de Ventas"
  };
}
