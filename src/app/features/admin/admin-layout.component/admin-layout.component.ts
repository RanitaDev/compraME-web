// layouts/admin-layout/admin-layout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AdminSidebarComponent } from '../admin-sidebar.component/admin-sidebar.component';
import { AdminNavigationService } from '../../../services/admin/admin-navigation.service';
import { AdminMenuItem, AdminMenuSubItem } from '../../../interfaces/admin/admin-menu.interface';
import { Router, RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  currentPageTitle = 'Dashboard';
  sidebarCollapsed = false;
  showMobileSidebar = false;
  showUserMenu = false;

  private destroy$ = new Subject<void>();

  // Page title mapping
  private pageTitleMap: { [key: string]: string } = {
    'dashboard': 'Dashboard',
    'products': 'Gestión de Productos',
    'products-list': 'Lista de Productos',
    'products-add': 'Agregar Producto',
    'products-stock': 'Control de Stock',
    'categories': 'Gestión de Categorías',
    'categories-list': 'Lista de Categorías',
    'categories-add': 'Nueva Categoría',
    'users': 'Gestión de Usuarios',
    'users-list': 'Lista de Usuarios',
    'users-admins': 'Administradores',
    'users-permissions': 'Permisos',
    'sales': 'Gestión de Ventas',
    'sales-orders': 'Órdenes',
    'sales-reports': 'Reportes',
    'sales-analytics': 'Analytics'
  };

  constructor(
    private adminNavService: AdminNavigationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscribeToSidebarState();
    this.subscribeToActiveMenuItem();
    this.setupClickOutsideHandler();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToSidebarState(): void {
    this.adminNavService.sidebarCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(collapsed => {
        this.sidebarCollapsed = collapsed;
      });
  }

  private subscribeToActiveMenuItem(): void {
    this.adminNavService.activeMenuItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe(itemId => {
        this.updatePageTitle(itemId);
      });
  }

  private setupClickOutsideHandler(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        this.showUserMenu = false;
      }
    });
  }

  onMenuItemSelected(event: { itemId: string; route: string; item: AdminMenuItem | AdminMenuSubItem }): void {

    // Actualizar el título de la página
    this.updatePageTitle(event.itemId);

    // Cerrar sidebar móvil si está abierto
    if (this.showMobileSidebar) {
      this.closeMobileSidebar();
    }

    // Aquí implementarías la navegación real
    // Por ejemplo: this.router.navigate([event.route]);

    // Por ahora solo log para demostración
    // console.log('Navigating to:', event.route);
  }

  onSidebarToggled(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    console.log('Sidebar toggled:', collapsed ? 'collapsed' : 'expanded');
  }

  toggleMobileSidebar(): void {
    this.showMobileSidebar = !this.showMobileSidebar;

    // Manejar scroll del body cuando el sidebar móvil está abierto
    if (this.showMobileSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileSidebar(): void {
    this.showMobileSidebar = false;
    document.body.style.overflow = '';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  private updatePageTitle(itemId: string): void {
    const title = this.pageTitleMap[itemId];
    if (title) {
      this.currentPageTitle = title;
      // También actualizar el título del documento
      document.title = `${title} - compraME! Admin`;
    }
  }

  // Quick action methods for the dashboard stats
  onQuickActionProducts(): void {
    console.log('Quick action: Navigate to products');
    this.adminNavService.setActiveMenuItem('products');
    this.updatePageTitle('products');
  }

  onQuickActionCategories(): void {
    console.log('Quick action: Navigate to categories');
    this.adminNavService.setActiveMenuItem('categories');
    this.updatePageTitle('categories');
  }

  onQuickActionUsers(): void {
    console.log('Quick action: Navigate to users');
    this.adminNavService.setActiveMenuItem('users');
    this.updatePageTitle('users');
  }

  onQuickActionSales(): void {
    console.log('Quick action: Navigate to sales');
    this.adminNavService.setActiveMenuItem('sales');
    this.updatePageTitle('sales');
  }

  // Search functionality
  onSearch(query: Event): void {
    console.log('Search query:', query);
    // Implementar lógica de búsqueda
    // Por ejemplo: this.searchService.search(query);
  }

  // Notification methods
  onNotificationClick(): void {
    console.log('Notifications clicked');
    // Implementar panel de notificaciones
    // Por ejemplo: this.notificationService.markAsRead();
  }

  // User menu methods
  onProfileClick(): void {
    console.log('Profile clicked');
    // Implementar navegación al perfil
  }

  onSettingsClick(): void {
    console.log('Settings clicked');
    // Implementar navegación a configuración
  }

  onLogoutClick(): void {
    console.log('Logout clicked');
    // Implementar lógica de logout
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // this.authService.logout();
      // this.router.navigate(['/login']);
    }
  }

  // Utility methods
  getCurrentRoute(): string {
    return window.location.pathname;
  }

  isCurrentRoute(route: string): boolean {
    return this.getCurrentRoute().includes(route);
  }

  public navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
