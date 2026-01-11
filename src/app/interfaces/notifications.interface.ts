export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'order_status' | 'payment' | 'message';
export type UserRole = 'admin' | 'user' | 'provider';

export interface INotification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  role: UserRole | UserRole[];
  isRead: boolean;
  isAttended?: boolean;
  attendedAt?: Date;
  timestamp: Date;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  relatedId?: string;
}

export interface INotificationResponse {
  success: boolean;
  data?: INotification[];
  message?: string;
}

export interface ICreateNotificationDto {
  usuarioId?: string;
  title: string;
  description: string;
  type: NotificationType;
  role?: UserRole | UserRole[];
  actionUrl?: string;
  actionLabel?: string;
  relatedId?: string;
}
