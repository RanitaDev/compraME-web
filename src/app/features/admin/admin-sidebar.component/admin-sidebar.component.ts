// layouts/admin-sidebar/admin-sidebar.component.ts
import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { AdminNavigationService } from '../../../services/admin/admin-navigation.service';
import { AdminMenuItem, AdminMenuSubItem, AdminUser } from './../../../interfaces/admin/admin-menu.interface';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AddProductModalComponent } from '../products/add-product-modal.component/add-product-modal.component';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { CategoryModalComponent } from '../categories/category-modal.component/category-modal.component';


@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, DynamicDialogModule],
  providers: [DialogService],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('300ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class AdminSidebarComponent implements OnInit, OnDestroy {
  @Output() menuItemSelected = new EventEmitter<{ itemId: string; route: string; item: AdminMenuItem | AdminMenuSubItem }>();
  @Output() sidebarToggled = new EventEmitter<boolean>();

  menuItems: AdminMenuItem[] = [];
  currentUser: AdminUser | null = null;
  isCollapsed = false;
  showSubMenu: { [key: string]: boolean } = {};

  private destroy$ = new Subject<void>();
  ref!: DynamicDialogRef;

  constructor(
    private adminNavService: AdminNavigationService,
    private router: Router,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.loadMenuItems();
    this.loadCurrentUser();
    this.subscribeToSidebarState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMenuItems(): void {
    this.adminNavService.getMenuItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.menuItems = items;
        this.initializeSubMenuState();
      });
  }

  private loadCurrentUser(): void {
    this.adminNavService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  private subscribeToSidebarState(): void {
    this.adminNavService.sidebarCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(collapsed => {
        this.isCollapsed = collapsed;
        if (collapsed) {
          // Cerrar todos los submenús al colapsar
          this.showSubMenu = {};
        }
        this.sidebarToggled.emit(collapsed);
      });
  }

  private initializeSubMenuState(): void {
    this.menuItems.forEach(item => {
      if (item.subItems && item.subItems.length > 0) {
        this.showSubMenu[item.id] = item.isActive || false;
      }
    });
  }

  onMenuItemClick(item: AdminMenuItem): void {
    // Si tiene submenús, toggle del submenú
    if (item.subItems && item.subItems.length > 0 && !this.isCollapsed) {
      this.showSubMenu[item.id] = !this.showSubMenu[item.id];

      // Si se está abriendo el submenú, cerrar otros
      if (this.showSubMenu[item.id]) {
        Object.keys(this.showSubMenu).forEach(key => {
          if (key !== item.id) {
            this.showSubMenu[key] = false;
          }
        });
      }
    }

    // Actualizar estado activo
    this.adminNavService.setActiveMenuItem(item.id);

    // Emitir evento de selección
    this.menuItemSelected.emit({
      itemId: item.id,
      route: item.route,
      item: item
    });

  }

  onSubMenuItemClick(parentId: string, subItem: AdminMenuSubItem): void {
    // Actualizar estado activo del subitem
    this.adminNavService.setActiveSubMenuItem(parentId, subItem.id);

    // Emitir evento de selección
    this.menuItemSelected.emit({
      itemId: subItem.id,
      route: subItem.route,
      item: subItem
    });

    console.log('Submenu item clicked:', subItem);
    if(subItem.id.includes('add') || subItem.id.includes('modal')) {
      this.openModal(subItem, false);
      return;
    }

    //AGREGAR A LA RUTA ACTUAL LA RUTA DEL SUBMENÚ
    this.router.navigate([`${subItem.route}`]);
  }

  public openModal(subMenuItem: AdminMenuSubItem, isEditMode: boolean): void {
    // ABRIMOS LA MODAL, DESDE AQUÍ SIEMPRE SERÁ SIN MODO EDICIÓN
    console.log('ABRIENDO MODAL', subMenuItem);
    let componentToOpen: any;
    let titleModal: string = '';

    switch (subMenuItem.id) {
      case 'product-add':
        componentToOpen = AddProductModalComponent;
        titleModal = 'Agregar Producto';
        break;
      case 'categories-add':
        componentToOpen = CategoryModalComponent;
        titleModal = 'Agregar Categoría';
        break;
    }

    this.ref = this.dialog.open(componentToOpen, {
      header: titleModal,
      width: '800px',
      modal: true,
      data: {
        isEditMode: 'crear'
      }
    });

    this.ref.onClose.subscribe((resultado) => {
      if (resultado) {
        // manejar lo que regresó el dialog (ej. guardar, refrescar lista, etc.)
        console.log('Resultado:', resultado);
      }
    });
  }

  toggleSidebar(): void {
    this.adminNavService.toggleSidebar();
  }

  onLogout(): void {
    console.log('Logout clicked');
    // Implementar lógica de logout
    // Por ejemplo:
    // this.authService.logout();
    // this.router.navigate(['/login']);

    // Mostrar confirmación
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // Realizar logout
      console.log('User logged out');
    }
  }

  // Método para tracking en ngFor (optimización)
  trackByMenuId(index: number, item: AdminMenuItem): string {
    return item.id;
  }

  trackBySubMenuId(index: number, item: AdminMenuSubItem): string {
    return item.id;
  }

  // Método para obtener la ruta activa actual
  getCurrentRoute(): string {
    return window.location.pathname;
  }

  // Método para verificar si una ruta está activa
  isRouteActive(route: string): boolean {
    return this.getCurrentRoute().includes(route);
  }
}
