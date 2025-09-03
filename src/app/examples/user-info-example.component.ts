import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { IUser } from '../interfaces/auth.interface';

@Component({
  selector: 'app-user-info-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-info-example p-4 bg-gray-50 rounded-lg">
      <h3 class="text-lg font-bold mb-4">Ejemplo de uso de datos del usuario</h3>

      <!-- Mostrar datos del usuario desde JWT -->
      @if (user) {
        <div class="user-data">
          <h4 class="font-semibold mb-2">Datos obtenidos del JWT:</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="data-item">
              <span class="font-medium">ID:</span>
              <span class="ml-2">{{ user.id }}</span>
            </div>
            <div class="data-item">
              <span class="font-medium">Nombre:</span>
              <span class="ml-2">{{ user.name }}</span>
            </div>
            @if (user.lastName) {
              <div class="data-item">
                <span class="font-medium">Apellido:</span>
                <span class="ml-2">{{ user.lastName }}</span>
              </div>
            }
            <div class="data-item">
              <span class="font-medium">Email:</span>
              <span class="ml-2">{{ user.email }}</span>
            </div>
            @if (user.telefono) {
              <div class="data-item">
                <span class="font-medium">Teléfono:</span>
                <span class="ml-2">{{ user.telefono }}</span>
              </div>
            }
            @if (user.direccion) {
              <div class="data-item">
                <span class="font-medium">Dirección:</span>
                <span class="ml-2">{{ user.direccion }}</span>
              </div>
            }
            @if (user.role) {
              <div class="data-item">
                <span class="font-medium">Rol:</span>
                <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{{ user.role }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Ejemplos de uso en templates -->
        <div class="mt-6">
          <h4 class="font-semibold mb-2">Ejemplos de uso:</h4>
          <div class="examples space-y-2">
            <div class="example bg-white p-3 rounded border">
              <code class="text-sm">Saludo personalizado: ¡Hola {{ user.name }}!</code>
            </div>
            <div class="example bg-white p-3 rounded border">
              <code class="text-sm">Nombre completo: {{ getFullName() }}</code>
            </div>
            <div class="example bg-white p-3 rounded border">
              <code class="text-sm">Iniciales: {{ getInitials() }}</code>
            </div>
          </div>
        </div>

      } @else {
        <div class="no-user text-center py-8">
          <p class="text-gray-500">No hay usuario autenticado</p>
          <p class="text-sm text-gray-400">Inicia sesión para ver los datos del usuario</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .data-item {
      padding: 8px 12px;
      background: white;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .example {
      font-family: 'Courier New', monospace;
    }
  `]
})
export class UserInfoExampleComponent implements OnInit {
  user: IUser | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Método 1: Obtener usuario actual (síncrono)
    this.user = this.authService.getCurrentUser();

    // Método 2: Suscribirse a cambios (reactivo)
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        console.log('✅ Usuario cargado:', user);
        console.log('📧 Email del usuario:', user.email);
        console.log('👤 Nombre del usuario:', user.name);
        console.log('📱 Teléfono del usuario:', user.telefono);
      }
    });
  }

  getFullName(): string {
    if (!this.user) return '';

    const parts = [];
    if (this.user.name) parts.push(this.user.name);
    if (this.user.lastName) parts.push(this.user.lastName);

    return parts.join(' ') || this.user.email || 'Usuario';
  }

  getInitials(): string {
    if (!this.user) return '';

    const name = this.user.name || '';
    const lastName = this.user.lastName || '';

    if (name && lastName) {
      return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    if (name) {
      return name.charAt(0).toUpperCase();
    }

    return this.user.email?.charAt(0).toUpperCase() || 'U';
  }
}
