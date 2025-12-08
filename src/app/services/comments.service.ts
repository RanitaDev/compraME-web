import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, timeout } from 'rxjs';
import { IComment, ICreateComment, IUpdateComment, IRatingStats } from '../interfaces/comments.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/comments`;

  getCommentsByProduct(productId: string): Observable<IComment[]> {
    // TODO: Descomentar cuando el backend esté listo
    // return this.http.get<{ data: IComment[] }>(`${this.apiUrl}/product/${productId}`)
    //   .pipe(
    //     timeout(10000),
    //     map(response => response.data || []),
    //     catchError(error => {
    //       console.error('Error obteniendo comentarios:', error);
    //       return of([]);
    //     })
    //   );

    // Mock data temporal - devuelve array vacío para mostrar el estado vacío
    return of([]);
  }

  getRatingStats(productId: string): Observable<IRatingStats> {
    // TODO: Descomentar cuando el backend esté listo
    // return this.http.get<{ data: IRatingStats }>(`${this.apiUrl}/product/${productId}/stats`)
    //   .pipe(
    //     timeout(10000),
    //     map(response => response.data),
    //     catchError(error => {
    //       console.error('Error obteniendo estadísticas:', error);
    //       return of({ average: 0, total: 0, distribution: {} });
    //     })
    //   );

    // Mock data temporal - devuelve estadísticas vacías
    return of({ average: 0, total: 0, distribution: {} });
  }

  createComment(comment: ICreateComment): Observable<IComment | null> {
    return this.http.post<{ data: IComment }>(`${this.apiUrl}`, comment)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error creando comentario:', error);
          return of(null);
        })
      );
  }

  updateComment(commentId: string, updates: IUpdateComment): Observable<IComment | null> {
    return this.http.put<{ data: IComment }>(`${this.apiUrl}/${commentId}`, updates)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error actualizando comentario:', error);
          return of(null);
        })
      );
  }

  deleteComment(commentId: string): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${commentId}`)
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error eliminando comentario:', error);
          return of(false);
        })
      );
  }

  toggleUseful(commentId: string): Observable<IComment | null> {
    return this.http.post<{ data: IComment }>(`${this.apiUrl}/${commentId}/useful`, {})
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error marcando comentario como útil:', error);
          return of(null);
        })
      );
  }
}
