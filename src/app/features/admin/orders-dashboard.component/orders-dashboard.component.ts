import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, interval, takeUntil } from 'rxjs';
import { IOrders } from '../../../interfaces/orders.interface';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';

interface OrderStats {
  total: number;
  pending: number;
  proofUploaded: number;
  paid: number;
  shipped: number;
  completed: number;
  canceled: number;
  expired: number;
}

interface RevenueStats {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  completedRevenue: number;
}

interface RecentActivity {
  orden: IOrders;
  timestamp: Date;
  action: string;
}

@Component({
  selector: 'app-orders-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders-dashboard.component.html',
  styleUrls: ['./orders-dashboard.component.css']
})
export class OrdersDashboardComponent implements OnInit, OnDestroy {
  // Inyecciones
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);

  private destroy$ = new Subject<void>();

  // Signals
  public orders = signal<IOrders[]>([]);
  public isLoading = signal<boolean>(true);

  // Computed signals para estadísticas
  public orderStats = computed<OrderStats>(() => {
    const allOrders = this.orders();
    return {
      total: allOrders.length,
      pending: allOrders.filter(o => o.estado === 'pending').length,
      proofUploaded: allOrders.filter(o => o.estado === 'proof_uploaded').length,
      paid: allOrders.filter(o => o.estado === 'paid').length,
      shipped: allOrders.filter(o => o.estado === 'shipped').length,
      completed: allOrders.filter(o => o.estado === 'delivered').length,
      canceled: allOrders.filter(o => o.estado === 'canceled').length,
      expired: allOrders.filter(o => o.estado === 'expired').length
    };
  });

  public revenueStats = computed<RevenueStats>(() => {
    const allOrders: IOrders[] = this.orders();
    return {
      totalRevenue: allOrders.reduce((sum, o) => sum + o.total, 0),
      paidRevenue: allOrders.filter(o => o.estado === 'paid' || o.estado === 'shipped' || o.estado === 'delivered').reduce((sum, o) => sum + o.total, 0),
      pendingRevenue: allOrders.filter(o => o.estado === 'pending' || o.estado === 'proof_uploaded').reduce((sum, o) => sum + o.total, 0),
      completedRevenue: allOrders.filter(o => o.estado === 'delivered').reduce((sum, o) => sum + o.total, 0)
    };
  });

  public recentOrders = computed<IOrders[]>(() => {
    return this.orders()
      .sort((a, b) => new Date(b.createdAt ?? new Date()).getTime() - new Date(a.createdAt ?? new Date()).getTime())
      .slice(0, 5);
  });

  public urgentOrders = computed<IOrders[]>(() => {
    const now = new Date().getTime();
    return this.orders()
      .filter(o => o.estado === 'pending' || o.estado === 'proof_uploaded')
      .filter(o => {
        if (!o.fechaLimitePago) return false;
        const limitTime = new Date(o.fechaLimitePago).getTime();
        const hoursRemaining = (limitTime - now) / (1000 * 60 * 60);
        return hoursRemaining <= 24 && hoursRemaining > 0;
      })
      .sort((a, b) => new Date(a.fechaLimitePago!).getTime() - new Date(b.fechaLimitePago!).getTime())
      .slice(0, 5);
  });

  public proofsToReview = computed<IOrders[]>(() => {
    return this.orders()
      .filter(o => o.estado === 'proof_uploaded')
      .sort((a, b) =>
        new Date((b.uploadedFileDate ?? b.updatedAt) as Date).getTime() -
        new Date((a.uploadedFileDate ?? a.updatedAt) as Date).getTime()
      )
      .slice(0, 5);
  });


  ngOnInit(): void {
    this.loadAllOrders();

    // Actualizar cada 30 segundos
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadAllOrders());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar todas las órdenes
   */
  private loadAllOrders(): void {
    this.isLoading.set(true);

    this.orderService.getAllOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.isLoading.set(false);
          this.toastService.error('Error', 'No se pudieron cargar las órdenes');
        }
      });
  }

  /**
   * Recargar datos manualmente
   */
  public refreshData(): void {
    this.loadAllOrders();
    this.toastService.success('Actualizado', 'Datos actualizados correctamente');
  }

  /**
   * Formatear precio
   */
  public formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Formatear fecha
   */
  public formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';

    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short'
      }).format(d);
    }
  }

  /**
   * Calcular tiempo restante
   */
  public getTimeRemaining(fechaLimite: Date | undefined): string {
    if (!fechaLimite) return 'N/A';

    const now = new Date().getTime();
    const limit = new Date(fechaLimite).getTime();
    const diff = limit - now;

    if (diff <= 0) return 'Expirado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 24) {
      return `${hours}h ${minutes}m`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
  }

  /**
   * Obtener badge del estado
   */
  public getStatusBadge(status: string): { class: string; label: string; icon: string } {
    const badges: { [key: string]: { class: string; label: string; icon: string } } = {
      'pending': { class: 'badge-warning', label: 'Pendiente', icon: 'pi-clock' },
      'proof_uploaded': { class: 'badge-info', label: 'Por Revisar', icon: 'pi-upload' },
      'paid': { class: 'badge-success', label: 'Pagado', icon: 'pi-check-circle' },
      'shipped': { class: 'badge-primary', label: 'Enviado', icon: 'pi-send' },
      'completed': { class: 'badge-completed', label: 'Completado', icon: 'pi-verified' },
      'canceled': { class: 'badge-danger', label: 'Cancelado', icon: 'pi-times-circle' },
      'expired': { class: 'badge-secondary', label: 'Expirado', icon: 'pi-ban' }
    };

    return badges[status] || { class: 'badge-secondary', label: status, icon: 'pi-circle' };
  }

  /**
   * Calcular porcentaje de un estado
   */
  public getPercentage(count: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }
}
