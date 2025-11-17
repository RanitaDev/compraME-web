import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService } from '../../../../services/user.service';
import { IUsuario } from '../../../../interfaces/users.interface';
import { UserDetailModalComponent } from '../user-detail-modal.component/user-detail-modal.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
  providers: [DialogService]
})
export class UsersListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private dialog = inject(DialogService);
  private destroy$ = new Subject<void>();

  allUsers: IUsuario[] = [];
  filteredUsers: IUsuario[] = [];
  searchTerm = '';

  totalUsers = 0;
  adminUsers = 0;
  clientUsers = 0;

  private modalRef?: DynamicDialogRef;
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.initializeSearchDebounce();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.modalRef?.close();
  }

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

  private loadUsers(): void {
    this.userService.obtenerTodosUsuarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          console.log('Usuarios cargados:', users);
          this.allUsers = users;
          this.updateFilteredUsers();
          this.calculateStats();
        },
        error: (error) => {
          console.error('Error cargando usuarios:', error);
        }
      });
  }

  private updateFilteredUsers(): void {
    let filtered = [...this.allUsers];

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.nombre.toLowerCase().includes(searchLower) ||
        user.apellidos.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    this.filteredUsers = filtered;
  }

  private calculateStats(): void {
    this.totalUsers = this.allUsers.length;
    this.adminUsers = this.allUsers.filter(u => u.rolId === 'admin').length;
    this.clientUsers = this.allUsers.filter(u => u.rolId === 'cliente').length;
  }

  private performSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.updateFilteredUsers();
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onViewUser(user: IUsuario): void {
    this.modalRef = this.dialog.open(UserDetailModalComponent, {
      header: 'Detalles del Usuario',
      width: '900px',
      modal: true,
      closable: true,
      data: {
        userId: user.id
      }
    });

    this.modalRef.onClose.subscribe((resultado) => {
      if (resultado && resultado.action === 'deleted') {
        this.loadUsers();
      }
    });
  }

  getInitials(nombre: string, apellidos: string): string {
    const firstInitial = nombre?.charAt(0).toUpperCase() || '';
    const lastInitial = apellidos?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  getRolBadgeClass(rolId: string): string {
    const classes: { [key: string]: string } = {
      'admin': 'bg-purple-100 text-purple-800',
      'cliente': 'bg-blue-100 text-blue-800'
    };
    return classes[rolId] || 'bg-gray-100 text-gray-800';
  }

  getRolText(rolId: string): string {
    const roles: { [key: string]: string } = {
      'admin': 'Admin',
      'cliente': 'Cliente'
    };
    return roles[rolId] || 'Desconocido';
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(dateObj);
  }

  trackByUserId(index: number, user: IUsuario): string {
    return user.id;
  }
}
