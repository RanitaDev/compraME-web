
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../primeng.module';
import { CarouselBannerComponent } from './components/carousel-banner/carousel-banner.component';
import { CategoryCardsComponent } from './components/category-cards/category-cards.component';
import { ProductCardsComponent } from '../products/product-cards.component/product-cards.component';
import { Subscription } from 'rxjs';
import { IUser } from '../../interfaces/auth.interface';
import { AuthService } from '../../services';

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
export class HomeComponent implements OnInit {
  // Propiedades para manejo de usuario
  currentUser: IUser | null = null;
  isAuthenticated = false;
  isClient = false; // ← Nueva propiedad para controlar visibilidad
  private userSubscription?: Subscription;
  private authSubscription?: Subscription;

  constructor(
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Obtener usuario actual inmediatamente
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = this.authService.isAuthenticated();
    this.updateClientStatus(); // ← Verificar si es cliente

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
        if (!isAuth) {
          this.isClient = false; // ← Si no está autenticado, no es cliente
        }
      }
    );
  }

  /**
   * Actualiza el estado de si el usuario es cliente
   */
  private updateClientStatus(): void {
    this.isClient = this.currentUser?.rolId === 'cliente';
  }
}

