// components/category-modal/category-modal.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../../interfaces/categories.interface';
import { CategoryService } from '../../../../services/category.service';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { SpinnerService } from '../../../../core/services/spinner.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-category-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-modal.component.html',
  styleUrls: ['./category-modal.component.css']
})
export class CategoryModalComponent implements OnInit {
  // Servicios inyectados
  private categoryService = inject(CategoryService);
  private dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private spinnerService = inject(SpinnerService);
  private toastService = inject(ToastService);

  // Propiedades del componente
  public isEditMode = false;
  public isLoading = false;

  // Datos del formulario
  public categoryData: Omit<Category, 'idCateogria'> & { idCateogria?: number } = {
    nombre: '',
    descripcion: '',
    imagen: '',
    activa: true
  };

  constructor(
    private ref: DynamicDialogRef,
  ) {}

  ngOnInit(): void {
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
    let message = this.isEditMode ? 'Guardando cambios...' : 'Creando categoría...';
    if (!this.categoryData.nombre?.trim() || !this.categoryData.descripcion?.trim() || !this.categoryData.imagen?.trim()) {
      this.toastService.error?.('Por favor completa todos los campos requeridos');
      return;
    }
    this.isLoading = true;

    const categoria: Category = {
      nombre: this.categoryData.nombre.trim(),
      descripcion: this.categoryData.descripcion.trim(),
      imagen: this.categoryData.imagen.trim(),
      activa: this.categoryData.activa,
    }

    if (this.isEditMode) {
      this.spinnerService.show(message, 'bar', 'category-mod');
      this.categoryService.actualizarCategoria(this.categoryData._id!, categoria).pipe(
        finalize(() => this.spinnerService.hide('category-mod'))
      ).subscribe({
        next: (categoriaActualizada) => {
          this.isLoading = false;
          if (categoriaActualizada) {
            this.toastService.success('Categoría actualizada exitosamente');
            this.ref.close({ success: true, action: 'saved', category: categoriaActualizada });
          } else {
            this.toastService.error?.('No fue posible guardar la categoría');
            this.resetForm();
            this.ref.close({ success: false, action: 'error' });
          }
        },
        error: () => {
          this.isLoading = false;
          this.resetForm();
          this.toastService.error?.('No fue posible guardar la categoría');
          this.ref.close({ success: false, action: 'error' });
        }
      });
    } else {
      this.spinnerService.show(message, 'bar', 'category-save');
      this.categoryService.crearCategoria(categoria).pipe(
        finalize(() => this.spinnerService.hide('category-save'))
      ).subscribe({
        next: (nuevaCategoria) => {
          this.isLoading = false;
          if (nuevaCategoria) {
            this.toastService.success('Categoría creada exitosamente');
            this.ref.close({ success: true, action: 'saved', category: nuevaCategoria });
          } else {
            this.toastService.error?.('No fue posible crear la categoría');
            this.resetForm();
            this.ref.close({ success: false, action: 'error' });
          }
        },
        error: () => {
          this.isLoading = false;
          this.resetForm();
          this.toastService.error?.('No fue posible crear la categoría');
          this.ref.close({ success: false, action: 'error' });
        }
      });
    }
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/300x150/e2e8f0/64748b?text=Error+al+cargar';
  }
}
