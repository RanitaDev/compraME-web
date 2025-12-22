import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subject, takeUntil } from 'rxjs';
import { INotification } from '../../../interfaces/notifications.interface';
import { NotificationsService } from '../../../services/notifications.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-notifications-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-modal.component.html',
})
export class NotificationsModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(DynamicDialogRef);
  private notificationsService = inject(NotificationsService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  public notifications: INotification[] = [];
  public isLoading = false;
  public activeTab: 'all' | 'unread' = 'all';

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotifications(): void {
    this.isLoading = true;
    this.notificationsService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notifications = data;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.toastService.warning('Aviso', 'No se pudieron cargar notificaciones');
        }
      });
  }

  public get filteredNotifications(): INotification[] {
    if (this.activeTab === 'unread') {
      return this.notifications.filter(n => !n.isRead);
    }
    return this.notifications;
  }

  public get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  public toggleRead(notification: INotification, event: Event): void {
    event.stopPropagation();
    if (notification.isRead) {
      return;
    }

    this.notificationsService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.isRead = true;
        }
      });
  }

  public markAllAsRead(): void {
    this.notificationsService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.forEach(n => n.isRead = true);
          this.toastService.success('Éxito', 'Todas las notificaciones marcadas como leídas');
        }
      });
  }

  public deleteNotification(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationsService.deleteNotification(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== id);
        }
      });
  }

  public handleNotificationClick(notification: INotification): void {
    if (!notification.isRead) {
      this.toggleRead(notification, new Event('click'));
    }
    if (notification.actionUrl) {
      this.dialogRef.close({ action: 'navigate', url: notification.actionUrl });
    }
  }

  public cerrar(): void {
    this.dialogRef.close();
  }

  public getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'info': 'pi-info-circle',
      'success': 'pi-check-circle',
      'warning': 'pi-exclamation-triangle',
      'error': 'pi-times-circle',
      'order_status': 'pi-box',
      'payment': 'pi-credit-card',
      'message': 'pi-envelope'
    };
    return icons[type] || 'pi-bell';
  }

  public getNotificationColor(type: string): string {
    const colors: { [key: string]: string } = {
      'info': 'text-blue-600',
      'success': 'text-green-600',
      'warning': 'text-yellow-600',
      'error': 'text-red-600',
      'order_status': 'text-purple-600',
      'payment': 'text-emerald-600',
      'message': 'text-indigo-600'
    };
    return colors[type] || 'text-gray-600';
  }

  public getNotificationBgColor(type: string): string {
    const bgColors: { [key: string]: string } = {
      'info': 'bg-blue-50',
      'success': 'bg-green-50',
      'warning': 'bg-yellow-50',
      'error': 'bg-red-50',
      'order_status': 'bg-purple-50',
      'payment': 'bg-emerald-50',
      'message': 'bg-indigo-50'
    };
    return bgColors[type] || 'bg-gray-50';
  }

  public formatTime(date: Date): string {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return notifDate.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short'
    });
  }
}
