import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { IUser } from '../../interfaces/auth.interface';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="user" class="user-profile-container">
      <div class="user-info">
        <h3>Información del Usuario</h3>

        <div class="info-item">
          <label>Nombre:</label>
          <span>{{ user.name }}</span>
        </div>

        <div class="info-item" *ngIf="user.lastName">
          <label>Apellido:</label>
          <span>{{ user.lastName }}</span>
        </div>

        <div class="info-item">
          <label>Email:</label>
          <span>{{ user.email }}</span>
        </div>

        <div class="info-item" *ngIf="user.telefono">
          <label>Teléfono:</label>
          <span>{{ user.telefono }}</span>
        </div>

        <div class="info-item" *ngIf="user.direccion">
          <label>Dirección:</label>
          <span>{{ user.direccion }}</span>
        </div>

        <div class="info-item" *ngIf="user.role">
          <label>Rol:</label>
          <span>{{ user.role }}</span>
        </div>
      </div>

      <div class="user-actions">
        <button (click)="logout()" class="logout-btn">
          Cerrar Sesión
        </button>
      </div>
    </div>

    <div *ngIf="!user" class="no-user">
      <p>No hay usuario autenticado</p>
    </div>
  `,
  styles: [`
    .user-profile-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
    }

    .user-info h3 {
      margin-bottom: 20px;
      color: #333;
    }

    .info-item {
      display: flex;
      margin-bottom: 10px;
      align-items: center;
    }

    .info-item label {
      font-weight: bold;
      margin-right: 10px;
      min-width: 100px;
      color: #555;
    }

    .info-item span {
      color: #333;
    }

    .user-actions {
      margin-top: 30px;
      text-align: center;
    }

    .logout-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }

    .logout-btn:hover {
      background: #c82333;
    }

    .no-user {
      text-align: center;
      padding: 40px;
      color: #666;
    }
  `]
})
export class UserProfileComponent implements OnInit, OnDestroy {
  user: IUser | null = null;
  private userSubscription?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Obtener el usuario actual inmediatamente
    this.user = this.authService.getCurrentUser();

    // Suscribirse a cambios en el estado del usuario
    this.userSubscription = this.authService.currentUser$.subscribe(
      (user) => {
        this.user = user;
        console.log('Usuario actualizado:', user);
      }
    );
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  logout() {
    this.authService.logout();
  }
}
