import { Component, ViewChild, OnInit, OnDestroy, effect, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from "primeng/button";
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { CartModalComponent } from '../../features/cart/cart-modal.component/cart-modal.component';
import { UserProfileModalComponent } from '../../features/user/user-profile-modal/user-profile-modal.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/products.service';
import { IUser } from '../../interfaces/auth.interface';
import { IProduct } from '../../interfaces/products.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    //PRIMENG
    AvatarModule,
    DividerModule,
    ButtonModule,
    InputTextModule,
    MenuModule,
    //COMPONENTES
    CartModalComponent,
    UserProfileModalComponent
],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  @ViewChild(CartModalComponent) modalCarrito!: CartModalComponent;
  @ViewChild(UserProfileModalComponent) modalPerfil!: UserProfileModalComponent;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Propiedades para manejo de usuario
  currentUser: IUser | null = null;
  isAuthenticated = false;
  private userSubscription?: Subscription;
  private authSubscription?: Subscription;

  // Propiedades para animación del carrito
  cartAnimated = false;
  cartTotalItems = 0;
  private cartSubscription?: Subscription;

  // Propiedades para búsqueda
  public searchTerm = '';
  public showSearchDropdown = false;
  public searchResults: IProduct[] = [];
  public isSearchLoading = false;
  public searchFocused = false;
  private searchTimeout?: number;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private productService: ProductService
  ){
    // Effect para escuchar cambios en el carrito y activar animación
    effect(() => {
      const currentTotal = this.cartService.totalItems();
      const prevTotal = this.cartTotalItems;
      this.cartTotalItems = currentTotal;

      // Activar animación solo cuando se agregue un producto (no cuando se quita)
      if (currentTotal > prevTotal && prevTotal >= 0) {
        this.triggerCartAnimation();
      }
    });
  }

  ngOnInit() {
    // Obtener usuario actual inmediatamente
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = this.authService.isAuthenticated();

    // Suscribirse a cambios del usuario
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
        console.log('👤 Usuario en header:', user);
      }
    );

    // Suscribirse a cambios de autenticación
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => {
        this.isAuthenticated = isAuth;
        console.log('🔐 Estado de autenticación:', isAuth);
      }
    );
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  /**
   * Activa la animación del carrito cuando se agrega un producto
   */
  private triggerCartAnimation(): void {
    this.cartAnimated = true;
    // Resetear la animación después de que termine
    setTimeout(() => {
      this.cartAnimated = false;
    }, 600);
  }

  /**
   * @description: Función que controla la visibilidad de la modal.
   */
  public abrirCarrito(): void {
    this.modalCarrito.openModal();
  }

  onCheckout(): void {
    // Verificar estado real del servicio de autenticación
    const serviceAuth = this.authService.isAuthenticated();
    const serviceUser = this.authService.getCurrentUser();
    if (!serviceAuth) {
      console.warn('⚠️ Usuario no autenticado, el guard redirigirá al login');
    }
    // Navegar al checkout cuando se solicita desde el carrito
    this.router.navigate(['/checkout'], {
      queryParams: {
        type: 'cart'
      }
    });
  }

  public modalCarritoCerrada(): void {
    console.log("Modal carrito cerrada");
  }

  public modalPerfilCerrada(): void {
    console.log("Modal perfil cerrada");
  }

  public usuarioCerroSesion(): void {
    console.log("Usuario cerró sesión desde la modal");
    // La modal ya manejó el logout, aquí podemos hacer acciones adicionales si es necesario
  }

  public goHome(): void {
    this.router.navigate(['/']);
  }

  // Nuevos métodos para manejo de sesión
  public goToLogin(): void {
    this.router.navigate(['/auth']);
  }

  public logout(): void {
    this.authService.logout();
  }

  public goToProfile(): void {
    // Abrir la modal de perfil de usuario
    this.modalPerfil.abrirModal();
  }

  public getUserDisplayName(): string {
    if (!this.currentUser) return '';

    // Usar el campo 'nombre' que viene del backend
    return this.currentUser.nombre || this.currentUser.email || '';
  }

  public getUserInitials(): string {
    if (!this.currentUser) return '';

    const nombre = this.currentUser.nombre || '';

    if (nombre) {
      // Si el nombre tiene espacios, tomar las primeras letras de las primeras dos palabras
      const palabras = nombre.split(' ');
      if (palabras.length >= 2) {
        return `${palabras[0].charAt(0)}${palabras[1].charAt(0)}`.toUpperCase();
      }
      return nombre.charAt(0).toUpperCase();
    }

    return this.currentUser.email?.charAt(0).toUpperCase() || 'U';
  }

  // Métodos de búsqueda
  public onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    this.searchTerm = value;

    // Limpiar timeout anterior
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (value.length >= 2) {
      this.showSearchDropdown = true;
      this.isSearchLoading = true;

      // Debounce la búsqueda
      this.searchTimeout = setTimeout(() => {
        this.performSearch(value);
      }, 300);
    } else {
      this.showSearchDropdown = false;
      this.searchResults = [];
      this.isSearchLoading = false;
    }
  }

  private performSearch(term: string): void {
    this.productService.searchProducts(term).subscribe({
      next: (products) => {
        this.searchResults = products.slice(0, 8); // Limitar a 8 resultados
        this.isSearchLoading = false;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.searchResults = [];
        this.isSearchLoading = false;
      }
    });
  }

  public onSearchFocus(): void {
    this.searchFocused = true;
    if (this.searchTerm.length >= 2) {
      this.showSearchDropdown = true;
    }
  }

  public onSearchBlur(): void {
    // Delay más largo para permitir clicks en el dropdown y evitar cerrar muy rápido
    setTimeout(() => {
      this.searchFocused = false;
      // Solo cerrar dropdown si no hay texto de búsqueda
      if (!this.searchTerm.trim()) {
        this.showSearchDropdown = false;
      }
    }, 300); // Aumentado de 150ms a 300ms para mejor UX
  }

  public onProductSelect(product: IProduct): void {
    console.log('🎯 Producto seleccionado:', product);
    console.log('🔍 Término de búsqueda actual:', this.searchTerm);
    console.log('📋 Resultados actuales:', this.searchResults.length);

    // Guardar el término de búsqueda antes de limpiar
    const currentSearchTerm = this.searchTerm;
    const currentResults = [...this.searchResults];

    // Crear el estado de navegación
    const navigationState = {
      products: currentResults,
      selectedProduct: product
    };

    console.log('🚀 Estado de navegación:', navigationState);

    this.clearSearch();

    // Navegar a la vista de resultados con todos los productos encontrados
    this.router.navigate(['/search-results'], {
      queryParams: {
        query: currentSearchTerm || 'búsqueda',
        selectedId: product._id
      },
      state: navigationState
    }).then(success => {
      if (!success) {
        console.error('❌ Error en navegación a search-results');
      } else {
        console.log('✅ Navegación exitosa a search-results');
      }
    }).catch(error => {
      console.error('❌ Error en navegación:', error);
    });
  }

  public onSearchDropdownClose(): void {
    this.showSearchDropdown = false;
  }

  public clearSearch(): void {
    this.searchTerm = '';
    this.showSearchDropdown = false;
    this.searchResults = [];
    this.isSearchLoading = false;

    // Limpiar timeout si existe
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
      // No hacer blur aquí para evitar problemas de navegación
    }
  }

  public trackByProductId(index: number, product: IProduct): string {
    return product._id;
  }

  public onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/placeholderImage.webp';
  }
}
