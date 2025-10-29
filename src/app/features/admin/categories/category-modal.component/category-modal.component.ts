// components/category-modal/category-modal.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../../interfaces/categories.interface';
import { CategoryService } from '../../../../services/category.service';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-category-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Formulario sin wrapper de modal (PrimeNG Dialog lo maneja) -->
    <form (ngSubmit)="onSubmit()" #categoryForm="ngForm" class="category-form space-y-4 p-2">

      <!-- Nombre de la Categoría -->
      <div class="form-group">
        <label for="nombre" class="block text-sm font-medium text-slate-700 mb-2">
          Nombre de la categoría *
        </label>
        <input type="text"
               id="nombre"
               name="nombre"
               [(ngModel)]="categoryData.nombre"
               #nombreInput="ngModel"
               required
               maxlength="50"
               placeholder="Ej: Electrónicos"
               class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
               [class.border-red-300]="nombreInput.invalid && nombreInput.touched">

        <!-- Error del nombre -->
        <div *ngIf="nombreInput.invalid && nombreInput.touched"
             class="error-message text-red-600 text-sm mt-1 flex items-center gap-1">
          <i class="pi pi-exclamation-triangle text-xs"></i>
          <span *ngIf="nombreInput.errors?.['required']">El nombre es requerido</span>
          <span *ngIf="nombreInput.errors?.['maxlength']">Máximo 50 caracteres</span>
        </div>
      </div>

      <!-- Descripción -->
      <div class="form-group">
        <label for="descripcion" class="block text-sm font-medium text-slate-700 mb-2">
          Descripción *
        </label>
        <textarea id="descripcion"
                  name="descripcion"
                  [(ngModel)]="categoryData.descripcion"
                  #descripcionInput="ngModel"
                  required
                  maxlength="200"
                  rows="3"
                  placeholder="Describe brevemente esta categoría..."
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  [class.border-red-300]="descripcionInput.invalid && descripcionInput.touched"></textarea>

        <!-- Contador de caracteres y errores -->
        <div class="flex justify-between items-center mt-1">
          <div *ngIf="descripcionInput.invalid && descripcionInput.touched"
               class="error-message text-red-600 text-sm flex items-center gap-1">
            <i class="pi pi-exclamation-triangle text-xs"></i>
            <span *ngIf="descripcionInput.errors?.['required']">La descripción es requerida</span>
            <span *ngIf="descripcionInput.errors?.['maxlength']">Máximo 200 caracteres</span>
          </div>
          <span class="text-xs text-slate-500">
            {{ categoryData.descripcion.length }}/200
          </span>
        </div>
      </div>

      <!-- URL de la Imagen -->
      <div class="form-group">
        <label for="imagen" class="block text-sm font-medium text-slate-700 mb-2">
          URL de la imagen *
        </label>
        <div class="space-y-2">
          <input type="url"
                 id="imagen"
                 name="imagen"
                 [(ngModel)]="categoryData.imagen"
                 #imagenInput="ngModel"
                 required
                 placeholder="https://ejemplo.com/imagen.jpg"
                 class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                 [class.border-red-300]="imagenInput.invalid && imagenInput.touched">

          <!-- Preview de la imagen -->
          <div *ngIf="categoryData.imagen" class="image-preview">
            <img [src]="categoryData.imagen"
                 [alt]="categoryData.nombre || 'Preview'"
                 class="w-full h-24 object-cover rounded-lg border border-slate-200"
                 (error)="onImageError($event)"
                 loading="lazy">
          </div>
        </div>

        <!-- Error de imagen -->
        <div *ngIf="imagenInput.invalid && imagenInput.touched"
             class="error-message text-red-600 text-sm mt-1 flex items-center gap-1">
          <i class="pi pi-exclamation-triangle text-xs"></i>
          <span *ngIf="imagenInput.errors?.['required']">La imagen es requerida</span>
          <span *ngIf="imagenInput.errors?.['url']">Debe ser una URL válida</span>
        </div>
      </div>

      <!-- Estado Activo -->
      <div class="form-group">
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox"
                 name="activa"
                 [(ngModel)]="categoryData.activa"
                 class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2">
          <div>
            <span class="text-sm font-medium text-slate-700">Categoría activa</span>
            <p class="text-xs text-slate-500">Las categorías activas son visibles para los usuarios</p>
          </div>
        </label>
      </div>

      <!-- Botones de Acción -->
      <div class="modal-footer flex gap-3 pt-4 border-t border-slate-200">
        <!-- Botón Cancelar -->
        <button type="button"
                class="cancel-btn flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium"
                (click)="onCancel()">
          Cancelar
        </button>

        <!-- Botón Guardar -->
        <button type="submit"
                class="save-btn flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                [disabled]="categoryForm.invalid || isLoading">

          <!-- Loading spinner -->
          <i *ngIf="isLoading" class="pi pi-spin pi-spinner text-sm"></i>

          <!-- Íconos y texto -->
          <ng-container *ngIf="!isLoading">
            <i class="pi pi-check text-sm"></i>
            <span>{{ isEditMode ? 'Actualizar' : 'Crear' }}</span>
          </ng-container>

          <!-- Texto loading -->
          <span *ngIf="isLoading">
            {{ isEditMode ? 'Actualizando...' : 'Creando...' }}
          </span>
        </button>
      </div>
    </form>
  `,
  styleUrls: ['./category-modal.component.css']
})
export class CategoryModalComponent implements OnInit {
  // Servicios inyectados
  private categoryService = inject(CategoryService);
  private dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  // Propiedades del componente
  isEditMode = false;
  isLoading = false;

  // Datos del formulario
  categoryData: Omit<Category, 'idCateogria'> & { idCateogria?: number } = {
    nombre: '',
    descripcion: '',
    imagen: '',
    activa: true
  };

  ngOnInit(): void {
    // Obtener datos de la configuración del dialog
    this.setupModalFromConfig();
  }

  /**
   * Configura el modal según los datos recibidos del DynamicDialogConfig
   */
  private setupModalFromConfig(): void {
    const data = this.config.data;

    // Determinar modo según la configuración
    this.isEditMode = data?.isEditMode === 'editar';

    if (this.isEditMode && data?.category) {
      // Modo edición: cargar datos existentes
      this.categoryData = { ...data.category };
    } else {
      // Modo creación: datos por defecto
      this.resetForm();
    }
  }

  /**
   * Resetea el formulario a valores por defecto
   */
  private resetForm(): void {
    this.categoryData = {
      nombre: '',
      descripcion: '',
      imagen: '',
      activa: true
    };
    this.isLoading = false;
  }

  /**
   * Cierra el modal sin guardar cambios
   */
  onCancel(): void {
    if (!this.isLoading) {
      this.dialogRef.close(null);
    }
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.isLoading) return;

    // Validar que todos los campos requeridos estén llenos
    if (!this.categoryData.nombre?.trim() ||
        !this.categoryData.descripcion?.trim() ||
        !this.categoryData.imagen?.trim()) {
      this.showErrorMessage('Por favor, completa todos los campos requeridos');
      return;
    }

    this.isLoading = true;

    // Simular llamada al backend
    setTimeout(() => {
      if (this.isEditMode) {
        this.updateCategory();
      } else {
        this.createCategory();
      }
    }, 1500); // Simular delay de red
  }

  /**
   * Crea una nueva categoría
   */
  private createCategory(): void {
    const newCategory: Category = {
      idCateogria: this.generateNewId(),
      nombre: this.categoryData.nombre.trim(),
      descripcion: this.categoryData.descripcion.trim(),
      imagen: this.categoryData.imagen.trim(),
      activa: this.categoryData.activa
    };

    // TODO: Conectar con el backend
    // this.categoryService.createCategory(newCategory).subscribe({
    //   next: (createdCategory) => this.handleSuccess(createdCategory),
    //   error: (error) => this.handleError(error)
    // });

    // Por ahora, simular éxito
    this.handleSuccess(newCategory);
  }

  /**
   * Actualiza una categoría existente
   */
  private updateCategory(): void {
    const updatedCategory: Category = {
      idCateogria: this.categoryData.idCateogria!,
      nombre: this.categoryData.nombre.trim(),
      descripcion: this.categoryData.descripcion.trim(),
      imagen: this.categoryData.imagen.trim(),
      activa: this.categoryData.activa
    };

    // TODO: Conectar con el backend
    // this.categoryService.updateCategory(updatedCategory).subscribe({
    //   next: (updated) => this.handleSuccess(updated),
    //   error: (error) => this.handleError(error)
    // });

    // Por ahora, simular éxito
    this.handleSuccess(updatedCategory);
  }

  /**
   * Maneja el éxito de la operación
   */
  private handleSuccess(category: Category): void {
    this.isLoading = false;
    this.showSuccessMessage(
      this.isEditMode ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente'
    );

    // Cerrar dialog con la categoría guardada
    this.dialogRef.close({
      action: this.isEditMode ? 'updated' : 'created',
      category: category
    });
  }

  /**
   * Maneja errores en las operaciones
   */
  private handleError(error: any): void {
    this.isLoading = false;
    console.error('Error en operación de categoría:', error);

    const errorMessage = this.isEditMode
      ? 'Error al actualizar la categoría. Inténtalo de nuevo.'
      : 'Error al crear la categoría. Inténtalo de nuevo.';

    this.showErrorMessage(errorMessage);
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/300x150/e2e8f0/64748b?text=Error+al+cargar';
  }

  /**
   * Genera un nuevo ID temporal para la categoría
   */
  private generateNewId(): number {
    return Math.floor(Math.random() * 10000) + 1000;
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
    // TODO: Implementar sistema de notificaciones
    // this.messageService.add({severity: 'error', summary: 'Error', detail: message});
  }
}
