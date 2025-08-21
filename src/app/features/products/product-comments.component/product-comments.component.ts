import { Component, OnInit, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentsService } from '../../../services/comments.service';
import { IComment } from '../../../interfaces/comments.interface';

@Component({
  selector: 'app-product-comments',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-comments.component.html',
  styleUrls: ['./product-comments.component.css']
})
export class ProductCommentsComponent implements OnInit {
  @Input() productId: number = 1;

  comments = signal<IComment[]>([]);
  averageRating = signal<{ average: number; total: number } | null>(null);
  ratingDistribution = signal<{ [key: number]: number } | null>(null);
  isLoading = signal(true);
  displayedComments = signal(3); // Mostrar 3 inicialmente

  // Computed para mostrar solo los comentarios visibles
  visibleComments = computed(() => {
    return this.comments().slice(0, this.displayedComments());
  });

  // Computed para verificar si hay más comentarios
  hasMoreComments = computed(() => {
    return this.comments().length > this.displayedComments();
  });

  constructor(private commentsService: CommentsService) {}

  ngOnInit() {
    this.loadComments();
    this.loadRatingStats();
  }

  private loadComments() {
    this.isLoading.set(true);

    setTimeout(() => {
      this.commentsService.getCommentsByProduct(this.productId).subscribe({
        next: (comments) => {
          // Ordenar por fecha más reciente y luego por utilidad
          const sortedComments = comments.sort((a, b) => {
            const dateA = new Date(a.fechaComentario).getTime();
            const dateB = new Date(b.fechaComentario).getTime();
            if (dateB !== dateA) {
              return dateB - dateA; // Más reciente primero
            }
            return b.util - a.util; // Más útil primero si la fecha es igual
          });

          this.comments.set(sortedComments);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading comments:', error);
          this.isLoading.set(false);
        }
      });
    }, 800);
  }

  private loadRatingStats() {
    // Cargar promedio de calificaciones
    this.commentsService.getAverageRating(this.productId).subscribe({
      next: (stats) => {
        this.averageRating.set(stats);
      }
    });

    // Cargar distribución de calificaciones
    this.commentsService.getRatingDistribution(this.productId).subscribe({
      next: (distribution) => {
        this.ratingDistribution.set(distribution);
      }
    });
  }

  loadMoreComments() {
    const current = this.displayedComments();
    const increment = 3;
    const total = this.comments().length;
    const newCount = Math.min(current + increment, total);

    this.displayedComments.set(newCount);
  }

  markAsUseful(commentId: number) {
    this.commentsService.markCommentAsUseful(commentId).subscribe({
      next: (success) => {
        if (success) {
          // Actualizar el comentario localmente
          const updatedComments = this.comments().map(comment => {
            if (comment.idComentario === commentId) {
              return { ...comment, util: comment.util + 1 };
            }
            return comment;
          });
          this.comments.set(updatedComments);
        }
      }
    });
  }

  getRatingPercentage(rating: number): number {
    const distribution = this.ratingDistribution();
    if (!distribution) return 0;

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    return total > 0 ? (distribution[rating] / total) * 100 : 0;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  formatDate(date: Date): string {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Hoy';
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    } else {
      return commentDate.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
}
