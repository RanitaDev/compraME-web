// pages/admin/orders/orders-list/orders-list.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { IOrders, IOrderItem } from '../../../interfaces/orders.interface';
import { OrderService } from '../../../services';
import { ToastService } from '../../../core/services/toast.service';
import { ReviewPaymentProofComponent } from '../review-payment-proof.component/review-payment-proof.component';
import { ChangeOrderStatusComponent } from '../change-order-status.component/change-order-status.component';
import { OrderDetailModalComponent } from '../order-detail-modal.component/order-detail-modal.component';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TooltipModule, ConfirmDialogModule],
  providers: [DialogService, ConfirmationService],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.css']
})
export class OrdersListComponent implements OnInit, OnDestroy {
  // Inyección de dependencias usando inject()
  private router = inject(Router);
  private ordersService = inject(OrderService);
  private dialogService = inject(DialogService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private destroy$ = new Subject<void>();
  private dialogRef: DynamicDialogRef | undefined;

  // Propiedades de datos
  public allOrders: IOrders[] = [];
  public filteredOrders: IOrders[] = [];
  public searchTerm = '';
  public statusFilter = '';

  // Estadísticas
  public totalHistoric = 0;
  public totalThisMonth = 0;
  public totalActive = 0;
  public totalDelivered = 0;
  public totalInShipping = 0;
  public hasMoreOrders = false;

  // Paginación
  public currentPage = 1;
  public itemsPerPage = 9;

  // Subject para búsqueda con debounce
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.initializeSearchDebounce();
    this.loadOrders();
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

  private loadOrders(): void {
    this.ordersService.getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.allOrders = orders.filter(order => order.estado !== 'canceled');
          this.updateFilteredOrders();
          this.calculateStats();
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.showErrorMessage('Error al cargar las órdenes');
        }
      });
  }

  /**
   * Actualiza la lista de órdenes filtradas
   */
  private updateFilteredOrders(): void {
    let filtered = [...this.allOrders];

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

    // Ordenar por fecha más reciente
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
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
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    this.totalHistoric = this.allOrders.length;

    this.totalThisMonth = this.allOrders.filter(order => {
      const orderDate = new Date(order.createdAt || 0);
      return orderDate.getMonth() === currentMonth &&
             orderDate.getFullYear() === currentYear;
    }).length;

    this.totalActive = this.allOrders.filter(order => order.estado === 'pending').length;
    this.totalDelivered = this.allOrders.filter(order => order.estado === 'delivered').length;
    // Para este ejemplo, "en envío" será igual a pending (puedes ajustarlo según tu lógica)
    this.totalInShipping = this.allOrders.filter(order => order.estado === 'pending').length;
  }

  /**
   * Realiza la búsqueda filtrada
   */
  private performSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.updateFilteredOrders();
  }

  // Métodos públicos para eventos de la vista

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
   * Cambiar estado de una orden
   */
  public onChangeStatus(order: IOrders): void {
    this.dialogRef = this.dialogService.open(ChangeOrderStatusComponent, {
      header: 'Cambiar Estado de Orden',
      width: '85%',
      modal: true,
      dismissableMask: false,
      data: {
        orden: order
      }
    });

    this.dialogRef.onClose.subscribe((result) => {
      if (result?.updated) {
        this.toastService.success('Estado Actualizado', `La orden ${order.numeroOrden} ha sido actualizada`);
        this.loadOrders(); // Recargar lista
      }
    });
  }

  /**
   * Revisar comprobante de pago
   */
  public onReviewProof(order: IOrders): void {
    this.dialogRef = this.dialogService.open(ReviewPaymentProofComponent, {
      header: 'Revisar Comprobante de Pago',
      width: '900px',
      modal: true,
      dismissableMask: false,
      closable: true,
      data: {
        orden: order
      }
    });

    this.dialogRef.onClose.subscribe((result) => {
      if (result?.approved || result?.rejected) {
        const message = result.approved ? 'Comprobante aprobado' : 'Comprobante rechazado';
        this.toastService.success('Revisión Completada', message);
        this.loadOrders(); // Recargar lista
      }
    });
  }

  /**
   * Verificar si una orden tiene comprobante por revisar
   */
  public hasProofToReview(order: IOrders): boolean {
    return order.estado === 'proof_uploaded' && !!order.comprobanteUrl;
  }

  /**
   * Archiva una orden
   */
  public onArchiveOrder(order: IOrders, event: Event): void {
    event.stopPropagation();

    this.confirmationService.confirm({
      message: `¿Deseas archivar la orden #${order.numeroOrden}? Se moverá a la sección de archivadas.`,
      header: 'Archivar Orden',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Sí, archivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success mt-2',
      rejectButtonStyleClass: 'p-button-secondary mt-2',
      accept: () => {
        this.ordersService.archiveOrder(order._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (result) => {
              // Remover del array local
              this.allOrders = this.allOrders.filter(o => o._id !== order._id);
              this.updateFilteredOrders();
              this.calculateStats();
              this.toastService.success('Éxito', `Orden #${order.numeroOrden} archivada correctamente`);
            },
            error: (error) => {
              console.error('Error archiving order:', error);
              this.toastService.error('Error', 'Error al archivar la orden');
            }
          });
      },
      reject: () => {
        // Usuario canceló
      }
    });
  }

  /**
   * Exportar órdenes
   */
  public onExportOrders(): void {
    // Implementar lógica de exportación
    this.showSuccessMessage('Exportación iniciada');
  }

  /**
   * Carga más órdenes
   */
  public loadMoreOrders(): void {
    this.currentPage++;
    this.updateFilteredOrders();
  }

  // Métodos utilitarios

  /**
   * Obtiene la clase CSS para el badge de estado
   */
  public getStatusBadgeClass(estado: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-800',
      'proof_uploaded': 'bg-blue-800',
      'paid': 'bg-green-800',
      'shipped': 'bg-green-800',
      'completed': 'bg-green-800',
      'canceled': 'bg-red-800'
    };

    return statusClasses[estado] || 'bg-gray-100';
  }

  /**
   * Obtiene el texto del estado
   */
  public getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente',
      'proof_uploaded': 'Comprobante subido',
      'paid': 'Pagada',
      'shipped': 'Enviada',
      'completed': 'Completada',
      'canceled': 'Cancelada',
      'expired': 'Expirada'
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
   * Muestra mensaje de éxito
   */
  private showSuccessMessage(message: string): void {
    // TODO: Implementar sistema de notificaciones
    // this.messageService.add({severity: 'success', summary: 'Éxito', detail: message});
  }

  /**
   * Muestra mensaje de error
   */
  private showErrorMessage(message: string): void {
    console.error('❌ Error:', message);
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
