
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../primeng.module';
import { CarouselBannerComponent } from './components/carousel-banner/carousel-banner.component';
import { CategoryCardsComponent } from './components/category-cards/category-cards.component';
import { ProductCardsComponent } from '../products/product-cards.component/product-cards.component';
import { Subscription } from 'rxjs';
import { IUser } from '../../interfaces/auth.interface';
import { AuthService } from '../../services';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    PrimeNgModule,
    CarouselBannerComponent,
    CategoryCardsComponent,
    ProductCardsComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  // Propiedades para manejo de usuario
  currentUser: IUser | null = null;
  isAuthenticated = false;
  isClient = false; // ← Nueva propiedad para controlar visibilidad
  isAuthRoute = false; // ← Nueva propiedad para ocultar en auth
  private userSubscription?: Subscription;
  private authSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Obtener usuario actual inmediatamente
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = this.authService.isAuthenticated();
    this.updateClientStatus(); // ← Verificar si es cliente
    this.updateAuthRouteStatus(); // ← Verificar si estamos en auth

    // Suscribirse a cambios del usuario
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
        this.updateClientStatus(); // ← Actualizar estado cuando cambie el usuario
      }
    );

    // Suscribirse a cambios de autenticación
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => {
        this.isAuthenticated = isAuth;
        this.updateClientStatus(); // ← Actualizar estado cuando cambie la autenticación
      }
    );

    // Suscribirse a cambios de ruta
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateAuthRouteStatus();
    });
  }

  /**
   * Actualiza el estado de si el usuario es cliente
   */
  private updateClientStatus(): void {
    // Mostrar para usuarios no autenticados y clientes autenticados (no admins)
    this.isClient = !this.currentUser || this.currentUser?.rolId === 'cliente';
  }

  /**
   * Actualiza el estado de si estamos en la ruta de autenticación
   */
  private updateAuthRouteStatus(): void {
    this.isAuthRoute = this.router.url.startsWith('/auth');
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}

