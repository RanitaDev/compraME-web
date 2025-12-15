import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, interval } from 'rxjs';
import { EstadoPedido, IOrders } from '../../../interfaces/orders.interface';
import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { OrderCheckoutService } from '../../../services/order-checkout.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.css']
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  // Inyecciones
  private router = inject(Router);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  private orderCheckoutService = inject(OrderCheckoutService);

  private destroy$ = new Subject<void>();

  // Propiedades
  public myOrders: IOrders[] = [];
  public filteredOrders: IOrders[] = [];
  public searchTerm = '';
  public statusFilter = '';
  public isLoading = false;

  // Estados y tiempos restantes
  public tiemposRestantes: { [key: string]: any } = {};

  // Paginación
  public currentPage = 1;
  public itemsPerPage = 6;
  public hasMoreOrders = false;

  // Subject para búsqueda con debounce
  private searchSubject = new Subject<string>();

  // Status options
  public statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendientes de Pago' },
    { value: 'proof_uploaded', label: 'Comprobante Subido' },
    { value: 'paid', label: 'Pagadas' },
    { value: 'shipped', label: 'En Envío' },
    { value: 'completed', label: 'Entregadas' },
    { value: 'canceled', label: 'Canceladas' },
    { value: 'expired', label: 'Expiradas' }
  ];

  ngOnInit(): void {
    this.initializeSearchDebounce();
    this.loadUserOrders();

    // Actualizar tiempos restantes cada segundo
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.actualizarTiemposRestantes());
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
   * Cargar órdenes del usuario autenticado
   */
  private loadUserOrders(): void {
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.toastService.warning('No autenticado', 'Debes iniciar sesión para ver tus órdenes');
      this.router.navigate(['/auth']);
      return;
    }

    this.isLoading = true;
    this.spinnerService.show();

    this.orderService.getUserOrders(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.myOrders = orders;
          this.updateFilteredOrders();
          this.actualizarTiemposRestantes();
          this.isLoading = false;
          this.spinnerService.hide();
        },
        error: (error) => {
          console.error('Error loading user orders:', error);
          this.isLoading = false;
          this.spinnerService.hide();
          this.toastService.error('Error', 'No se pudieron cargar tus órdenes. Intenta nuevamente.');
        }
      });
  }

  /**
   * Actualizar la lista de órdenes filtradas
   */
  private updateFilteredOrders(): void {
    let filtered = [...this.myOrders];

    // Aplicar filtro de búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.numeroOrden?.toLowerCase().includes(searchLower) ||
        order._id.toLowerCase().includes(searchLower) ||
        order.direccionEnvio?.nombreCompleto?.toLowerCase().includes(searchLower)
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
   * Realizar búsqueda
   */
  private performSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.updateFilteredOrders();
  }

  /**
   * Actualizar tiempos restantes para órdenes pendientes
   */
  private actualizarTiemposRestantes(): void {
    this.myOrders.forEach(orden => {
      if (orden.estado === 'pending' || orden.estado === 'proof_uploaded') {
        this.tiemposRestantes[orden._id] = this.orderCheckoutService.calcularTiempoRestante(
          orden.fechaLimitePago
        );
      }
    });
  }

  // Métodos públicos para eventos de la vista

  /**
   * Manejar el evento de búsqueda
   */
  public onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Manejar el cambio de filtro de estado
   */
  public onFilterChange(): void {
    this.currentPage = 1;
    this.updateFilteredOrders();
  }

  /**
   * Limpiar filtros
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
  public viewOrderDetails(orden: IOrders): void {
    this.router.navigate(['/checkout/order-created', orden._id]);
  }

  /**
   * Ir a subir comprobante
   */
  public uploadProof(orden: IOrders): void {
    if (orden.estado !== 'pending' && orden.estado !== 'proof_uploaded') {
      this.toastService.warning('Estado inválido', 'No puedes subir comprobante en este estado');
      return;
    }

    if (this.hasExpired(orden)) {
      this.toastService.warning('Orden expirada', 'El tiempo para pagar esta orden ha expirado');
      return;
    }

    this.router.navigate(['/checkout/payment-proof', orden._id]);
  }

  /**
   * Cancelar una orden
   */
  public cancelOrder(orden: IOrders): void {
    if (!confirm(`¿Estás seguro de que deseas cancelar la orden ${orden.numeroOrden}?`)) {
      return;
    }

    this.spinnerService.show();

    this.orderCheckoutService.cancelOrder(orden._id, 'Cancelado por el usuario')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.spinnerService.hide();

          if (response.success) {
            this.toastService.success('Orden cancelada', 'Tu orden ha sido cancelada exitosamente');

            // Actualizar estado local
            const orderIndex = this.myOrders.findIndex(o => o._id === orden._id);
            if (orderIndex !== -1) {
              this.myOrders[orderIndex].estado = EstadoPedido.CANCELED;
              this.updateFilteredOrders();
            }
          } else {
            this.toastService.error('Error', response.message || 'No se pudo cancelar la orden');
          }
        },
        error: (error) => {
          this.spinnerService.hide();
          console.error('Error canceling order:', error);
          this.toastService.error('Error', 'Ocurrió un error al cancelar la orden');
        }
      });
  }

  /**
   * Cargar más órdenes
   */
  public loadMoreOrders(): void {
    this.currentPage++;
    this.updateFilteredOrders();
  }

  // Métodos utilitarios

  /**
   * Obtener la clase CSS para el badge de estado
   */
  public getStatusBadgeClass(estado: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'proof_uploaded': 'bg-blue-100 text-blue-800 border-blue-300',
      'paid': 'bg-green-100 text-green-800 border-green-300',
      'shipped': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'completed': 'bg-green-100 text-green-800 border-green-300',
      'canceled': 'bg-red-100 text-red-800 border-red-300',
      'expired': 'bg-gray-100 text-gray-800 border-gray-300'
    };

    return statusClasses[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  /**
   * Obtener el texto del estado
   */
  public getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente de Pago',
      'proof_uploaded': 'Comprobante Subido',
      'paid': 'Pagada',
      'shipped': 'En Envío',
      'completed': 'Entregada',
      'canceled': 'Cancelada',
      'expired': 'Expirada'
    };

    return statusTexts[status] || 'Desconocido';
  }

  /**
   * Obtener ícono según estado
   */
  public getStatusIcon(estado: string): string {
    const statusIcons: { [key: string]: string } = {
      'pending': 'pi-clock',
      'proof_uploaded': 'pi-file-check',
      'paid': 'pi-check-circle',
      'shipped': 'pi-truck',
      'completed': 'pi-box',
      'canceled': 'pi-times-circle',
      'expired': 'pi-exclamation-circle'
    };

    return statusIcons[estado] || 'pi-info-circle';
  }

  /**
   * Verificar si la orden ha expirado
   */
  public hasExpired(orden: IOrders): boolean {
    if (!orden.fechaLimitePago) return false;
    return new Date() > new Date(orden.fechaLimitePago);
  }

  /**
   * Obtener el tiempo restante formateado
   */
  public getTimeRemaining(ordenId: string): string {
    const tiempo = this.tiemposRestantes[ordenId];
    if (!tiempo) return '...';

    if (tiempo.expirado) return 'Expirado';

    if (tiempo.dias > 0) {
      return `${tiempo.dias}d ${tiempo.horas}h`;
    } else if (tiempo.horas > 0) {
      return `${tiempo.horas}h ${tiempo.minutos}m`;
    } else {
      return `${tiempo.minutos}m`;
    }
  }

  /**
   * Formatear fecha para mostrar
   */
  public formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
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
   * Contar total de items en una orden
   */
  public getTotalItems(orden: IOrders): number {
    return orden.productos?.reduce((total, item) => total + item.cantidad, 0) || 0;
  }

  /**
   * Ir a continuar comprando
   */
  public continueShopping(): void {
    this.router.navigate(['/']);
  }

  public trackByOrderId(index: number, order: IOrders): string {
    return order._id;
  }

  /**
   * Scroll hacia arriba
   */
  public scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
