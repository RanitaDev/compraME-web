// pages/admin/categories/categories-list/categories-list.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { CategoryService } from '../../../../services/category.service';
import { CategoryModalComponent } from '../category-modal.component/category-modal.component';
import { Category } from '../../../../interfaces/categories.interface';
import { PrimeNgModule } from '../../../../primeng.module';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimeNgModule],
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.css'],
  providers: [DialogService]
})
export class CategoriesListComponent implements OnInit, OnDestroy {
  // Inyección de dependencias usando inject()
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private dialog = inject(DialogService);
  private destroy$ = new Subject<void>();

  // Propiedades de datos
  allCategories: Category[] = [];
  filteredCategories: Category[] = [];
  searchTerm = '';

  // Estadísticas
  totalCategories = 0;
  activeCategories = 0;
  hasMoreCategories = false;

  // Paginación
  currentPage = 1;
  itemsPerPage = 12;

  // Referencia del modal
  private modalRef?: DynamicDialogRef;

  // Subject para búsqueda con debounce
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.initializeSearchDebounce();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.modalRef?.close();
  }

  /**
   * Inicializa el debounce para la búsqueda
   */
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

  /**
   * Carga las categorías desde el servicio
   */
  private loadCategories(): void {
    this.categoryService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.allCategories = categories;
          this.updateFilteredCategories();
          this.calculateStats();
        },
        error: (error) => {
          console.error('Error cargando categorías:', error);
          this.showErrorMessage('Error al cargar las categorías');
        }
      });
  }

  /**
   * Actualiza la lista de categorías filtradas
   */
  private updateFilteredCategories(): void {
    let filtered = [...this.allCategories];

    // Aplicar filtro de búsqueda si existe
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(category =>
        category.nombre.toLowerCase().includes(searchLower) ||
        category.descripcion.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar paginación
    const startIndex = 0;
    const endIndex = this.currentPage * this.itemsPerPage;
    this.filteredCategories = filtered.slice(startIndex, endIndex);
    this.hasMoreCategories = filtered.length > endIndex;

    console.log('CATEGORÍAS FILTRADAS:', this.filteredCategories);
  }

  /**
   * Calcula las estadísticas de categorías
   */
  private calculateStats(): void {
    this.totalCategories = this.allCategories.length;
    this.activeCategories = this.allCategories.filter(c => c.activa).length;
  }

  /**
   * Realiza la búsqueda filtrada
   */
  private performSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.updateFilteredCategories();
  }

  // Métodos públicos para eventos de la vista

  /**
   * Maneja el evento de búsqueda
   */
  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Abre el modal para agregar nueva categoría
   */
  onAddCategory(): void {
    this.modalRef = this.dialog.open(CategoryModalComponent, {
      header: 'Nueva Categoría',
      width: '500px',
      modal: true,
      closable: true,
      data: {
        isEditMode: 'crear'
      }
    });

    this.modalRef.onClose.subscribe((resultado) => {
      console.log('Modal cerrado con resultado:', resultado);
      if (resultado && resultado.action === 'saved') {
        console.log('Categoría creada:', resultado.category);
        this.onCategoryCreated(resultado.category);
      }
    });
  }

  /**
   * Abre el modal para editar categoría existente
   */
  onEditCategory(category: Category): void {

    this.modalRef = this.dialog.open(CategoryModalComponent, {
      header: 'Editar Categoría',
      width: '500px',
      modal: true,
      closable: true,
      data: {
        isEditMode: 'editar',
        category: category
      }
    });

    this.modalRef.onClose.subscribe((resultado) => {
      if (resultado && resultado.action === 'saved') {
        console.log('Categoría actualizada:', resultado.category);
        this.onCategoryUpdated(resultado.category);
      }
    });
  }

  /**
   * Muestra información detallada de la categoría
   */
  onViewCategory(category: Category): void {
    console.log('Viendo categoría:', category.nombre);
    // Implementar vista detallada o modal de información
    // this.router.navigate(['/admin/categories/view', category.idCateogria]);
  }

  /**
   * Alterna el estado activo/inactivo de una categoría
   */
  toggleCategoryStatus(category: Category): void {
    const previousStatus = category.activa;
    category.activa = !category.activa;

    console.log(`Categoría ${category.nombre} ${category.activa ? 'activada' : 'desactivada'}`);

    // TODO: Conectar con el backend
    // this.categoryService.updateCategory(category).subscribe({
    //   next: () => {
    //     this.calculateStats();
    //     this.showSuccessMessage(`Categoría ${category.activa ? 'activada' : 'desactivada'} correctamente`);
    //   },
    //   error: (error) => {
    //     category.activa = previousStatus; // Revertir cambio
    //     this.showErrorMessage('Error al actualizar el estado de la categoría');
    //   }
    // });

    // Por ahora, simular éxito
    this.calculateStats();
    this.showSuccessMessage(`Categoría ${category.activa ? 'activada' : 'desactivada'} correctamente`);
  }

  /**
   * Carga más categorías (paginación)
   */
  loadMoreCategories(): void {
    this.currentPage++;
    this.updateFilteredCategories();
  }

  // Métodos de manejo de eventos del modal

  /**
   * Maneja la creación exitosa de una categoría
   */
  private onCategoryCreated(category: Category): void {
    // Agregar la nueva categoría a la lista
    this.allCategories.push(category);
    this.updateFilteredCategories();
    this.calculateStats();

    this.showSuccessMessage('Categoría creada correctamente');
  }

  /**
   * Maneja la actualización exitosa de una categoría
   */
  private onCategoryUpdated(updatedCategory: Category): void {
    // Encontrar y actualizar la categoría en la lista
    const index = this.allCategories.findIndex(c => c._id === updatedCategory._id);
    if (index !== -1) {
      this.allCategories[index] = updatedCategory;
      this.updateFilteredCategories();
      this.calculateStats();
      this.showSuccessMessage('Categoría actualizada correctamente');
    }
  }

  // Métodos utilitarios

  /**
   * Obtiene la clase CSS para el badge de estado
   */
  getStatusBadgeClass(isActive: boolean): string {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageError(event: any): void {
    // Imagen de fallback en caso de error
    event.target.src = 'https://via.placeholder.com/300x200/e2e8f0/64748b?text=Sin+Imagen';
  }

  /**
   * Muestra mensaje de éxito
   */
  private showSuccessMessage(message: string): void {
    console.log('✅ Éxito:', message);
    // TODO: Implementar sistema de notificaciones
    // this.messageService.add({severity: 'success', summary: 'Éxito', detail: message});
  }

  /**
   * Muestra mensaje de error
   */
  private showErrorMessage(message: string): void {
    console.error('❌ Error:', message);
  }

  scrollToTop(): void {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
