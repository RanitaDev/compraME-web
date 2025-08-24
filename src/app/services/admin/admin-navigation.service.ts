// services/admin/admin-navigation.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdminMenuItem, AdminUser } from '../../interfaces/admin/admin-menu.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminNavigationService {
  private activeMenuItemSubject = new BehaviorSubject<string>('dashboard');
  private sidebarCollapsedSubject = new BehaviorSubject<boolean>(false);

  activeMenuItem$ = this.activeMenuItemSubject.asObservable();
  sidebarCollapsed$ = this.sidebarCollapsedSubject.asObservable();

  // Datos hardcodeados del menú (posteriormente vendrán de MongoDB)
  private menuItems: AdminMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'pi pi-th-large',
      route: '/admin/dashboard',
      isActive: true
    },
    {
      id: 'products',
      label: 'Productos',
      icon: 'pi pi-box',
      route: '/admin/products',
      badge: 145,
      subItems: [
        {
          id: 'product-list',
          label: 'Lista de Productos',
          route: '/admin/product-list',
          icon: 'pi pi-list'
        },
        {
          id: 'product-add',
          label: 'Agregar Producto',
          route: '/admin/product-add',
          icon: 'pi pi-plus'
        },
        {
          id: 'product-stock',
          label: 'Control de Stock',
          route: '/admin/product-stock',
          icon: 'pi pi-database'
        }
      ]
    },
    {
      id: 'categories',
      label: 'Categorías',
      icon: 'pi pi-tags',
      route: '/admin/categories',
      badge: 8,
      subItems: [
        {
          id: 'categories-list',
          label: 'Lista de Categorías',
          route: '/admin/categories/list'
        },
        {
          id: 'categories-add',
          label: 'Nueva Categoría',
          route: '/admin/categories/add'
        }
      ]
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: 'pi pi-users',
      route: '/admin/users',
      badge: 24,
      subItems: [
        {
          id: 'users-list',
          label: 'Lista de Usuarios',
          route: '/admin/users/list'
        },
        {
          id: 'users-admins',
          label: 'Administradores',
          route: '/admin/users/admins'
        },
        {
          id: 'users-permissions',
          label: 'Permisos',
          route: '/admin/users/permissions'
        }
      ]
    },
    {
      id: 'sales',
      label: 'Ventas',
      icon: 'pi pi-chart-bar',
      route: '/admin/sales',
      badge: 3,
      subItems: [
        {
          id: 'sales-orders',
          label: 'Órdenes',
          route: '/admin/sales/orders'
        },
        {
          id: 'sales-reports',
          label: 'Reportes',
          route: '/admin/sales/reports'
        },
        {
          id: 'sales-analytics',
          label: 'Analytics',
          route: '/admin/sales/analytics'
        }
      ]
    }
  ];

  // Usuario admin hardcodeado
  private currentUser: AdminUser = {
    id: 'admin-001',
    name: 'María González',
    email: 'maria.admin@comprame.com',
    role: 'Super Administrador',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b550?w=150&h=150&fit=crop&crop=face',
    lastLogin: new Date()
  };

  getMenuItems(): Observable<AdminMenuItem[]> {
    return new BehaviorSubject(this.menuItems).asObservable();
  }

  getCurrentUser(): Observable<AdminUser> {
    return new BehaviorSubject(this.currentUser).asObservable();
  }

  setActiveMenuItem(itemId: string): void {
    // Actualizar item activo
    this.menuItems = this.menuItems.map(item => ({
      ...item,
      isActive: item.id === itemId,
      subItems: item.subItems?.map(subItem => ({
        ...subItem,
        isActive: false
      }))
    }));

    this.activeMenuItemSubject.next(itemId);
  }

  setActiveSubMenuItem(parentId: string, subItemId: string): void {
    this.menuItems = this.menuItems.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          isActive: true,
          subItems: item.subItems?.map(subItem => ({
            ...subItem,
            isActive: subItem.id === subItemId
          }))
        };
      }
      return {
        ...item,
        isActive: false,
        subItems: item.subItems?.map(subItem => ({
          ...subItem,
          isActive: false
        }))
      };
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsedSubject.next(!this.sidebarCollapsedSubject.value);
  }

  collapseSidebar(): void {
    this.sidebarCollapsedSubject.next(true);
  }

  expandSidebar(): void {
    this.sidebarCollapsedSubject.next(false);
  }
}
