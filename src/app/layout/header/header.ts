import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from "primeng/button";
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { CartModalComponent } from '../../features/cart/cart-modal.component/cart-modal.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IUser } from '../../interfaces/auth.interface';
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
    TooltipModule,
    //COMPONENTES
    CartModalComponent
],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  @ViewChild(CartModalComponent) modalCarrito!: CartModalComponent;

  // Propiedades para manejo de usuario
  currentUser: IUser | null = null;
  isAuthenticated = false;
  private userSubscription?: Subscription;
  private authSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService
  ){}

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
   * @description: Función que controla la visibilidad de la modal.
   */
  public abrirCarrito(): void {
    this.modalCarrito.openModal();
  }

  onCheckout(): void {
    console.log('🛒 Navegando al checkout desde header...');
    console.log('🔐 Estado de autenticación actual:', this.isAuthenticated);
    console.log('👤 Usuario actual:', this.currentUser);

    // Verificar estado real del servicio de autenticación
    const serviceAuth = this.authService.isAuthenticated();
    const serviceUser = this.authService.getCurrentUser();
    console.log('🔍 AuthService - isAuthenticated():', serviceAuth);
    console.log('🔍 AuthService - getCurrentUser():', serviceUser);

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
    console.log("Modal cerrada");
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
    // Aquí puedes navegar a una página de perfil si la tienes
    console.log('Ir a perfil del usuario:', this.currentUser);
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
}
