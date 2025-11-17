// pages/admin/orders/orders-list/orders-list.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { IOrders, IOrderItem } from '../../../interfaces/orders.interface';
import { OrderService } from '../../../services';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.css']
})
export class OrdersListComponent implements OnInit, OnDestroy {
  // Inyección de dependencias usando inject()
  private router = inject(Router);
  private ordersService = inject(OrderService)
  private destroy$ = new Subject<void>();

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
          console.log('Órdenes cargadas:', orders);
          this.allOrders = orders;
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
    console.log('Viendo orden:', order.numeroOrden);
    // Navegar a vista detallada de la orden
    // this.router.navigate(['/admin/orders/detail', order.id]);
  }

  /**
   * Cambiar estado de una orden
   */
  public onChangeStatus(order: IOrders): void {
    // Lógica para cambiar estado (puedes implementar un modal o dropdown)
    const currentStatus = order.estado;
    let newStatus;

    // Lógica simple para demostración
    if (currentStatus === 'pending') {
      newStatus = 'completed';
    } else if (currentStatus === 'delivered') {
      newStatus = 'pending';
    } else {
      newStatus = 'pending';
    }

    // Actualizar estado
    //order.status = newStatus;
    order.updatedAt = new Date();

    // Recalcular estadísticas
    this.calculateStats();
    this.showSuccessMessage(`Estado de orden #${order.numeroOrden} actualizado`);
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
      'proof_uploaded': 'Comprobada',
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
    return items.reduce((total, item) => total + item.quantity, 0);
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
    console.log('✅ Éxito:', message);
    // TODO: Implementar sistema de notificaciones
    // this.messageService.add({severity: 'success', summary: 'Éxito', detail: message});
  }

  /**
   * Muestra mensaje de error
   */
  private showErrorMessage(message: string): void {
    console.error('❌ Error:', message);
    // TODO: Implementar sistema de notificaciones
    // this.messageService.add({severity: 'error', summary: 'Error', detail: message});
  }

  /**
   * Función trackBy para optimización de ngFor
   */
  public trackByOrderId(index: number, order: IOrders): string {
    return order._id;
  }
}
