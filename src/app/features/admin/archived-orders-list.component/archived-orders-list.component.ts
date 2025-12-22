// pages/admin/orders/archived-orders-list/archived-orders-list.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { IOrders, IOrderItem } from '../../../interfaces/orders.interface';
import { OrderService } from '../../../services';
import { ToastService } from '../../../core/services/toast.service';
import { OrderDetailModalComponent } from '../order-detail-modal.component/order-detail-modal.component';

@Component({
  selector: 'app-archived-orders-list',
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf, FormsModule, DialogModule],
  providers: [DialogService],
  templateUrl: './archived-orders-list.component.html',
  styleUrls: ['./archived-orders-list.component.css']
})
export class ArchivedOrdersListComponent implements OnInit, OnDestroy {
  // Inyección de dependencias usando inject()
  private router = inject(Router);
  private ordersService = inject(OrderService);
  private dialogService = inject(DialogService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private destroy$ = new Subject<void>();
  private dialogRef: DynamicDialogRef | undefined;

  // Propiedades de datos
  public allArchivedOrders: IOrders[] = [];
  public filteredOrders: IOrders[] = [];
  public searchTerm = '';
  public statusFilter = '';
  public isLoading = false;

  // Estadísticas
  public totalArchived = 0;
  public totalCanceled = 0;
  public pendingDelete = 0;

  // Paginación
  public currentPage = 1;
  public itemsPerPage = 9;
  public hasMoreOrders = false;

  // Subject para búsqueda con debounce
  private searchSubject = new Subject<string>();

  // Propiedades para el dialog de confirmación de eliminación
  public showDeleteConfirmDialog = false;
  public deleteConfirmText = '';
  public pendingDeleteOrder: IOrders | null = null;

  ngOnInit(): void {
    this.initializeSearchDebounce();
    this.loadArchivedOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  /**
   * Inicializa el debounce para la búsqueda
   */
  private initializeSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm);
      });
  }

  /**
   * Carga las órdenes archivadas
   */
  private loadArchivedOrders(): void {
    this.isLoading = true;
    this.ordersService.getArchivedOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.allArchivedOrders = orders;
          this.updateFilteredOrders();
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading archived orders:', error);
          this.toastService.error('Error', 'Error al cargar las órdenes archivadas');
          this.isLoading = false;
        }
      });
  }

  /**
   * Actualiza la lista de órdenes filtradas
   */
  private updateFilteredOrders(): void {
    let filtered = [...this.allArchivedOrders];

    // Aplicar filtro de búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.numeroOrden?.toLowerCase().includes(searchLower) ||
        order._id.toLowerCase().includes(searchLower) ||
        order.usuarioId.toLowerCase().includes(searchLower) ||
        order.metodoPago?.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtro de estado
    if (this.statusFilter) {
      filtered = filtered.filter(order => order.estado === this.statusFilter);
    }

    // Ordenar por fecha de archivo más reciente
    filtered.sort((a, b) => {
      const dateA = new Date(a.fechaArchivado || a.createdAt || 0);
      const dateB = new Date(b.fechaArchivado || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Aplicar paginación
    const startIndex = 0;
    const endIndex = this.currentPage * this.itemsPerPage;
    this.filteredOrders = filtered.slice(startIndex, endIndex);
    this.hasMoreOrders = filtered.length > endIndex;
  }

  /**
   * Calcula las estadísticas de órdenes
   */
  private calculateStats(): void {
    this.totalArchived = this.allArchivedOrders.filter(order => order.archivada).length;
    this.totalCanceled = this.allArchivedOrders.filter(order => order.estado === 'canceled').length;

    // Contar órdenes pendientes para eliminar (canceladas con más de 30 días)
    this.pendingDelete = this.allArchivedOrders.filter(order => {
      if (order.estado !== 'canceled') return false;
      const deleteInfo = this.ordersService.canDeleteOrder(order);
      return deleteInfo.canDelete;
    }).length;
  }

  /**
   * Realiza la búsqueda filtrada
   */
  private performSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.updateFilteredOrders();
  }

  /**
   * Maneja el evento de búsqueda
   */
  public onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Maneja el cambio de filtro de estado
   */
  public onFilterChange(): void {
    this.currentPage = 1;
    this.updateFilteredOrders();
  }

  /**
   * Limpia todos los filtros
   */
  public clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.updateFilteredOrders();
  }

  /**
   * Ver detalles de una orden
   */
  public onViewOrder(order: IOrders): void {
    this.dialogRef = this.dialogService.open(OrderDetailModalComponent, {
      header: `Detalles de Orden #${order.numeroOrden}`,
      width: '600px',
      modal: true,
      dismissableMask: true,
      data: {
        orden: order
      }
    });
  }

  /**
   * Desarchiva una orden
   */
  public onUnarchiveOrder(order: IOrders, event: Event): void {
    event.stopPropagation();

    this.confirmationService.confirm({
      message: `¿Desarchivas la orden #${order.numeroOrden}?`,
      header: 'Desarchiva Orden',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.ordersService.unarchiveOrder(order._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (result) => {
              this.toastService.success('Éxito', `Orden #${order.numeroOrden} desarchivada`);
              this.loadArchivedOrders();
            },
            error: (error) => {
              console.error('Error unarchiving order:', error);
              this.toastService.error('Error', 'Error al desarchivas la orden');
            }
          });
      }
    });
  }

  /**
   * Elimina una orden archivada (solo después de 30 días para órdenes canceladas)
   */
  public onDeleteOrder(order: IOrders, event: Event): void {
    event.stopPropagation();
    const deleteInfo = this.ordersService.canDeleteOrder(order);

    if (!deleteInfo.canDelete && order.estado === 'canceled') {
      const days = deleteInfo.daysRemaining;
      this.toastService.warning(
        'No se puede eliminar',
        `Debe esperar ${days} día(s) más para eliminar esta orden`
      );
      return;
    }

    // Mostrar dialog pidiendo escribir "eliminar"
    this.pendingDeleteOrder = order;
    this.deleteConfirmText = '';
    this.showDeleteConfirmDialog = true;
  }

  /**
   * Procede con la eliminación después de escribir "eliminar"
   */
  public confirmDelete(): void {
    if (this.deleteConfirmText !== 'eliminar' || !this.pendingDeleteOrder) {
      this.toastService.error('Error', 'Debes escribir exactamente "eliminar" para confirmar');
      return;
    }
    const order = this.pendingDeleteOrder;

    // Cerrar inmediatamente el dialog de escritura para evitar solapamientos
    this.showDeleteConfirmDialog = false;
    this.deleteConfirmText = '';

    // Mostrar la modal de confirmación compartida
    this.confirmationService.confirm({
      message: `¿Quieres eliminar permanentemente la orden #${order.numeroOrden}? Esta acción no se puede deshacer.`,
      header: 'Eliminar Orden',
      acceptButtonStyleClass: 'cm-confirm-btn-accept mt-2',
      rejectButtonStyleClass: 'cm-confirm-btn-reject mt-2',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        // Remover localmente del array para evitar recarga
        this.allArchivedOrders = this.allArchivedOrders.filter(o => o._id !== order._id);
        this.updateFilteredOrders();
        this.calculateStats();

        // Mostrar toast de éxito inmediatamente
        this.toastService.success('Éxito', `Orden #${order.numeroOrden} eliminada permanentemente`);

        // Luego actualizar en BD
        this.ordersService.deleteArchivedOrder(order._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (result) => {
              this.pendingDeleteOrder = null;
            },
            error: (error) => {
              console.error('Error deleting order:', error);
              const errorMsg = error?.error?.message || 'Error al eliminar la orden';
              this.toastService.error('Error', errorMsg);
              // Restaurar en array si hay error
              this.allArchivedOrders = [order, ...this.allArchivedOrders];
              this.updateFilteredOrders();
              this.calculateStats();
              this.pendingDeleteOrder = null;
            }
          });
      },
      reject: () => {
        // Asegurar que ambos modales estén cerrados y limpiar estado
        this.showDeleteConfirmDialog = false;
        this.deleteConfirmText = '';
        this.pendingDeleteOrder = null;
      }
    });
  }

  /**
   * Cierra el dialog de confirmación de eliminación
   */
  public closeDeleteConfirmDialog(): void {
    this.showDeleteConfirmDialog = false;
    this.deleteConfirmText = '';
    this.pendingDeleteOrder = null;
  }

  /**
   * Verifica si una orden puede ser eliminada
   */
  public canDeleteOrder(order: IOrders): boolean {
    if(order.archivada) return true;
    return this.ordersService.canDeleteOrder(order).canDelete;
  }

  /**
   * Obtiene los días restantes para poder eliminar una orden
   */
  public getDaysRemaining(order: IOrders): number {
    return this.ordersService.canDeleteOrder(order).daysRemaining;
  }

  /**
   * Obtiene la clase CSS para el badge de estado
   */
  public getStatusBadgeClass(estado: string): string {
    const statusClasses: { [key: string]: string } = {
      'canceled': 'bg-red-800',
      'pending': 'bg-yellow-800',
      'completed': 'bg-green-800',
      'proof_uploaded': 'bg-blue-800',
      'deleted': 'bg-gray-700'
    };

    return statusClasses[estado] || 'bg-gray-800';
  }

  /**
   * Obtiene el texto del estado
   */
  public getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'canceled': 'Cancelada',
      'pending': 'Pendiente',
      'completed': 'Completada',
      'paid': 'Pagada',
      'shipped': 'Enviada',
      'proof_uploaded': 'comprobante subido',
      'expired': 'Expirada',
      'deleted': 'Eliminada'
    };

    return statusTexts[status] || 'Desconocido';
  }

  /**
   * Calcula el total de items en una orden
   */
  public getTotalItems(items: IOrderItem[]): number {
    return items.reduce((total, item) => total + (item.cantidad ?? (item as any).quantity ?? 0), 0);
  }

  /**
   * Formatea fecha para mostrar
   */
  public formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Formatea precio
   */
  public formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Carga más órdenes
   */
  public loadMoreOrders(): void {
    this.currentPage++;
    this.updateFilteredOrders();
  }

  public trackByOrderId(index: number, order: IOrders): string {
    return order._id;
  }

  public scrollToTop(): void {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
