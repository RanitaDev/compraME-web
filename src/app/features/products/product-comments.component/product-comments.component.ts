import { Component, OnInit, Input, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommentsService } from '../../../services/comments.service';
import { AuthService } from '../../../services/auth.service';
import { IComment, ICreateComment } from '../../../interfaces/comments.interface';

@Component({
  selector: 'app-product-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-comments.component.html',
  styleUrls: ['./product-comments.component.css']
})
export class ProductCommentsComponent implements OnInit {
  @Input() productId!: string;

  private commentsService = inject(CommentsService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  comments = signal<IComment[]>([]);
  ratingStats = signal<{ average: number; total: number; distribution: { [key: number]: number } }>({
    average: 0,
    total: 0,
    distribution: {}
  });
  isLoading = signal(true);
  displayedComments = signal(3);
  showCommentForm = signal(false);
  editingCommentId = signal<string | null>(null);

  commentForm: FormGroup;
  currentUser = this.authService.getCurrentUser();

  visibleComments = computed(() => {
    return this.comments().slice(0, this.displayedComments());
  });

  hasMoreComments = computed(() => {
    return this.comments().length > this.displayedComments();
  });

  isAuthenticated = computed(() => !!this.currentUser);

  constructor() {
    this.commentForm = this.fb.group({
      calificacion: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      texto: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    if (!this.productId) {
      console.error('ProductId is required');
      return;
    }
    this.loadComments();
    this.loadRatingStats();
  }

  private loadComments() {
    this.isLoading.set(true);

    this.commentsService.getCommentsByProduct(this.productId).subscribe({
      next: (comments) => {
        const sortedComments = comments.sort((a, b) => {
          const dateA = new Date(a.fechaCreacion).getTime();
          const dateB = new Date(b.fechaCreacion).getTime();
          if (dateB !== dateA) return dateB - dateA;
          return b.util - a.util;
        });
        this.comments.set(sortedComments);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.isLoading.set(false);
      }
    });
  }

  private loadRatingStats() {
    this.commentsService.getRatingStats(this.productId).subscribe({
      next: (stats) => {
        this.ratingStats.set(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  toggleCommentForm() {
    if (!this.isAuthenticated()) {
      alert('Debes iniciar sesión para dejar un comentario');
      return;
    }
    this.showCommentForm.set(!this.showCommentForm());
    if (!this.showCommentForm()) {
      this.cancelEdit();
    }
  }

  submitComment() {
    if (this.commentForm.invalid || !this.isAuthenticated()) return;

    const commentData: ICreateComment = {
      productoId: this.productId,
      ...this.commentForm.value
    };

    if (this.editingCommentId()) {
      this.updateComment(commentData);
    } else {
      this.createComment(commentData);
    }
  }

  private createComment(commentData: ICreateComment) {
    this.commentsService.createComment(commentData).subscribe({
      next: (newComment) => {
        if (newComment) {
          this.comments.update(comments => [newComment, ...comments]);
          this.commentForm.reset({ calificacion: 5 });
          this.showCommentForm.set(false);
          this.loadRatingStats();
        }
      },
      error: (error) => {
        console.error('Error creating comment:', error);
        alert('Error al crear el comentario');
      }
    });
  }

  private updateComment(commentData: Partial<ICreateComment>) {
    const commentId = this.editingCommentId();
    if (!commentId) return;

    this.commentsService.updateComment(commentId, commentData).subscribe({
      next: (updatedComment) => {
        if (updatedComment) {
          this.comments.update(comments =>
            comments.map(c => c._id === commentId ? updatedComment : c)
          );
          this.cancelEdit();
          this.loadRatingStats();
        }
      },
      error: (error) => {
        console.error('Error updating comment:', error);
        alert('Error al actualizar el comentario');
      }
    });
  }

  startEdit(comment: IComment) {
    if (!this.canModifyComment(comment)) return;

    this.editingCommentId.set(comment._id);
    this.commentForm.patchValue({
      calificacion: comment.calificacion,
      titulo: comment.titulo,
      texto: comment.texto
    });
    this.showCommentForm.set(true);
  }

  cancelEdit() {
    this.editingCommentId.set(null);
    this.commentForm.reset({ calificacion: 5 });
  }

  deleteComment(commentId: string) {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

    this.commentsService.deleteComment(commentId).subscribe({
      next: (success) => {
        if (success) {
          this.comments.update(comments => comments.filter(c => c._id !== commentId));
          this.loadRatingStats();
        }
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        alert('Error al eliminar el comentario');
      }
    });
  }

  toggleUseful(commentId: string, comment: IComment) {
    if (!this.isAuthenticated()) {
      alert('Debes iniciar sesión para marcar como útil');
      return;
    }

    this.commentsService.toggleUseful(commentId).subscribe({
      next: (updatedComment) => {
        if (updatedComment) {
          this.comments.update(comments =>
            comments.map(c => c._id === commentId ? updatedComment : c)
          );
        }
      },
      error: (error) => {
        console.error('Error marking as useful:', error);
      }
    });
  }

  canModifyComment(comment: IComment): boolean {
    return this.currentUser?.id === comment.usuarioId;
  }

  hasMarkedUseful(comment: IComment): boolean {
    return this.currentUser ? comment.usuariosUtil.includes(this.currentUser.id) : false;
  }

  loadMoreComments() {
    const current = this.displayedComments();
    const total = this.comments().length;
    this.displayedComments.set(Math.min(current + 3, total));
  }

  getRatingPercentage(rating: number): number {
    const stats = this.ratingStats();
    if (!stats.distribution || stats.total === 0) return 0;
    return ((stats.distribution[rating] || 0) / stats.total) * 100;
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

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    }
    return commentDate.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
