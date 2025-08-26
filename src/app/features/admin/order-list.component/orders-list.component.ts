// pages/admin/orders/orders-list/orders-list.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { IOrders, IOrderItem } from '../../../interfaces/orders.interface';

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
  private destroy$ = new Subject<void>();

  // Propiedades de datos
  allOrders: IOrders[] = [];
  filteredOrders: IOrders[] = [];
  searchTerm = '';
  statusFilter = '';

  // Estadísticas
  totalHistoric = 0;
  totalThisMonth = 0;
  totalActive = 0;
  totalDelivered = 0;
  totalInShipping = 0;
  hasMoreOrders = false;

  // Paginación
  currentPage = 1;
  itemsPerPage = 9;

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

  /**
   * Carga las órdenes hardcodeadas
   */
  private loadOrders(): void {
    // Datos hardcodeados de órdenes para demostración
    this.allOrders = [
      {
        id: 'ORD-001',
        orderNumber: '2024-0001',
        userId: 'USER-123',
        items: [
          { productId: 'PROD-001', quantity: 2, price: 299.99, productName: 'Auriculares Bluetooth', subtotal: 599.98 },
          { productId: 'PROD-002', quantity: 1, price: 199.99, productName: 'Mouse Gaming', subtotal: 199.99 }
        ],
        totalAmount: 899.97,
        subtotal: 799.97,
        shippingCost: 100.00,
        status: 'pending',
        paymentMethod: 'Tarjeta de Crédito',
        createdAt: new Date('2024-08-20'),
        updatedAt: new Date('2024-08-20')
      },
      {
        id: 'ORD-002',
        orderNumber: '2024-0002',
        userId: 'USER-456',
        items: [
          { productId: 'PROD-003', quantity: 1, price: 1499.99, productName: 'Laptop Gaming', subtotal: 1499.99 }
        ],
        totalAmount: 1649.99,
        subtotal: 1499.99,
        shippingCost: 150.00,
        status: 'completed',
        paymentMethod: 'PayPal',
        createdAt: new Date('2024-08-19'),
        updatedAt: new Date('2024-08-21')
      },
      {
        id: 'ORD-003',
        orderNumber: '2024-0003',
        userId: 'USER-789',
        items: [
          { productId: 'PROD-004', quantity: 3, price: 99.99, productName: 'Teclado Mecánico', subtotal: 299.97 },
          { productId: 'PROD-005', quantity: 1, price: 399.99, productName: 'Monitor 4K', subtotal: 399.99 }
        ],
        totalAmount: 799.96,
        subtotal: 699.96,
        shippingCost: 100.00,
        status: 'pending',
        paymentMethod: 'Transferencia Bancaria',
        createdAt: new Date('2024-08-18'),
        updatedAt: new Date('2024-08-18')
      },
      {
        id: 'ORD-004',
        orderNumber: '2024-0004',
        userId: 'USER-101',
        items: [
          { productId: 'PROD-006', quantity: 2, price: 249.99, productName: 'Smartwatch', subtotal: 499.98 }
        ],
        totalAmount: 599.98,
        subtotal: 499.98,
        shippingCost: 100.00,
        status: 'completed',
        paymentMethod: 'Tarjeta de Débito',
        createdAt: new Date('2024-08-17'),
        updatedAt: new Date('2024-08-19')
      },
      {
        id: 'ORD-005',
        orderNumber: '2024-0005',
        userId: 'USER-202',
        items: [
          { productId: 'PROD-007', quantity: 1, price: 899.99, productName: 'Cámara Digital', subtotal: 899.99 }
        ],
        totalAmount: 999.99,
        subtotal: 899.99,
        shippingCost: 100.00,
        status: 'canceled',
        paymentMethod: 'Tarjeta de Crédito',
        createdAt: new Date('2024-08-16'),
        updatedAt: new Date('2024-08-17')
      }
    ];

    this.updateFilteredOrders();
    this.calculateStats();
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
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower) ||
        order.userId.toLowerCase().includes(searchLower) ||
        order.paymentMethod?.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtro de estado
    if (this.statusFilter) {
      filtered = filtered.filter(order => order.status === this.statusFilter);
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

    this.totalActive = this.allOrders.filter(order => order.status === 'pending').length;
    this.totalDelivered = this.allOrders.filter(order => order.status === 'completed').length;
    // Para este ejemplo, "en envío" será igual a pending (puedes ajustarlo según tu lógica)
    this.totalInShipping = this.allOrders.filter(order => order.status === 'pending').length;
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
  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Maneja el cambio de filtro de estado
   */
  onFilterChange(): void {
    this.currentPage = 1;
    this.updateFilteredOrders();
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.updateFilteredOrders();
  }

  /**
   * Ver detalles de una orden
   */
  onViewOrder(order: IOrders): void {
    console.log('Viendo orden:', order.orderNumber);
    // Navegar a vista detallada de la orden
    // this.router.navigate(['/admin/orders/detail', order.id]);
  }

  /**
   * Cambiar estado de una orden
   */
  onChangeStatus(order: IOrders): void {
    console.log('Cambiando estado de orden:', order.orderNumber);

    // Lógica para cambiar estado (puedes implementar un modal o dropdown)
    const currentStatus = order.status;
    let newStatus: 'pending' | 'completed' | 'canceled';

    // Lógica simple para demostración
    if (currentStatus === 'pending') {
      newStatus = 'completed';
    } else if (currentStatus === 'completed') {
      newStatus = 'pending';
    } else {
      newStatus = 'pending';
    }

    // Actualizar estado
    order.status = newStatus;
    order.updatedAt = new Date();

    // Recalcular estadísticas
    this.calculateStats();

    console.log(`Estado cambiado de ${currentStatus} a ${newStatus}`);
    this.showSuccessMessage(`Estado de orden #${order.orderNumber} actualizado`);
  }

  /**
   * Exportar órdenes
   */
  onExportOrders(): void {
    console.log('Exportando órdenes...');
    // Implementar lógica de exportación
    this.showSuccessMessage('Exportación iniciada');
  }

  /**
   * Carga más órdenes
   */
  loadMoreOrders(): void {
    this.currentPage++;
    this.updateFilteredOrders();
  }

  // Métodos utilitarios

  /**
   * Obtiene la clase CSS para el badge de estado
   */
  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'canceled': 'bg-red-100 text-red-800'
    };

    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtiene el texto del estado
   */
  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente',
      'completed': 'Completada',
      'canceled': 'Cancelada'
    };

    return statusTexts[status] || 'Desconocido';
  }

  /**
   * Calcula el total de items en una orden
   */
  getTotalItems(items: IOrderItem[]): number {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Formatea fecha para mostrar
   */
  formatDate(date: Date | undefined): string {
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
  formatPrice(price: number): string {
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
  trackByOrderId(index: number, order: IOrders): string {
    return order.id;
  }
}
