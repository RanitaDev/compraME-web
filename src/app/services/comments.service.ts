import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IComment } from '../interfaces/comments.interface';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private comments: IComment[] = [
    {
      idComentario: 1,
      idProducto: 1,
      nombreUsuario: 'María González',
      avatarUsuario: 'https://images.unsplash.com/photo-1494790108755-2616b612b1d3?w=100&h=100&fit=crop&crop=face',
      calificacion: 5,
      titulo: 'Excelente calidad de sonido',
      comentario: 'Los auriculares superaron mis expectativas. La cancelación de ruido es increíble y la batería dura exactamente lo que prometen. Los recomiendo 100%.',
      fechaComentario: new Date('2024-07-15'),
      verificado: true,
      util: 24,
      respuesta: {
        texto: '¡Muchas gracias María por tu reseña! Nos alegra saber que estás satisfecha con tu compra.',
        fecha: new Date('2024-07-16'),
        autor: 'Equipo de Atención'
      }
    },
    {
      idComentario: 2,
      idProducto: 1,
      nombreUsuario: 'Carlos Mendoza',
      avatarUsuario: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      calificacion: 4,
      titulo: 'Muy buenos, pero mejorable el estuche',
      comentario: 'El sonido es espectacular y son muy cómodos para usar durante horas. Mi única queja es que el estuche se siente un poco frágil, pero por el precio están muy bien.',
      fechaComentario: new Date('2024-07-10'),
      verificado: true,
      util: 18
    },
    {
      idComentario: 3,
      idProducto: 1,
      nombreUsuario: 'Ana Rodríguez',
      avatarUsuario: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      calificacion: 5,
      titulo: 'Perfectos para trabajar desde casa',
      comentario: 'Trabajo desde casa y necesitaba algo que bloqueara el ruido. Estos auriculares son perfectos. La calidad de las llamadas también es excelente.',
      fechaComentario: new Date('2024-07-08'),
      verificado: true,
      util: 31
    },
    {
      idComentario: 4,
      idProducto: 1,
      nombreUsuario: 'Roberto Silva',
      avatarUsuario: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      calificacion: 3,
      titulo: 'Buenos pero no excepcionales',
      comentario: 'Están bien para el precio, pero he tenido mejores. La conectividad Bluetooth a veces falla y tengo que reconectarlos.',
      fechaComentario: new Date('2024-07-05'),
      verificado: false,
      util: 7
    },
    {
      idComentario: 5,
      idProducto: 1,
      nombreUsuario: 'Laura Martín',
      avatarUsuario: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
      calificacion: 5,
      titulo: '¡Los mejores que he tenido!',
      comentario: 'He probado muchos auriculares y estos son definitivamente los mejores en esta gama de precio. El diseño también es muy elegante.',
      fechaComentario: new Date('2024-07-02'),
      verificado: true,
      util: 42
    }
  ];

  getCommentsByProduct(productId: number): Observable<IComment[]> {
    const productComments = this.comments.filter(comment => comment.idProducto === productId);
    return of(productComments);
  }

  getAverageRating(productId: number): Observable<{ average: number; total: number }> {
    const productComments = this.comments.filter(comment => comment.idProducto === productId);
    const total = productComments.length;
    const sum = productComments.reduce((acc, comment) => acc + comment.calificacion, 0);
    const average = total > 0 ? sum / total : 0;

    return of({ average, total });
  }

  getRatingDistribution(productId: number): Observable<{ [key: number]: number }> {
    const productComments = this.comments.filter(comment => comment.idProducto === productId);
    const distribution: { [key: string]: number } = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

    productComments.forEach(comment => {
      distribution[String(comment.calificacion)]++;
    });

    return of(distribution);
  }

  markCommentAsUseful(commentId: number): Observable<boolean> {
    const comment = this.comments.find(c => c.idComentario === commentId);
    if (comment) {
      comment.util++;
      return of(true);
    }
    return of(false);
  }
}
