// components/category-modal/category-modal.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../../interfaces/categories.interface';
import { CategoryService } from '../../../../services/category.service';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { finalize, firstValueFrom } from 'rxjs';
import { SpinnerService } from '../../../../core/services/spinner.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UploadService } from '../../../../services/upload.service';

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
  private uploadService = inject(UploadService);

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

  // Propiedades para manejo de imagen
  public uploadedImage: {
    file: File | null;
    preview: string;
    url?: string;
    uploading?: boolean;
  } = {
    file: null,
    preview: '',
    url: ''
  };
  public isDragging = false;
  public uploadError: string | null = null;
  public maxFileSize = 2 * 1024 * 1024; // 2MB en bytes

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

      // Cargar imagen existente si hay
      if (this.categoryData.imagen) {
        this.uploadedImage = {
          file: null,
          preview: this.categoryData.imagen,
          url: this.categoryData.imagen
        };
      }
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
    this.uploadedImage = {
      file: null,
      preview: '',
      url: ''
    };
    this.uploadError = null;
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
  async onSubmit(): Promise<void> {
    if (this.isLoading) return;

    if (!this.categoryData.nombre?.trim() || !this.categoryData.descripcion?.trim()) {
      this.toastService.error?.('Por favor completa todos los campos requeridos');
      return;
    }

    // Validar que haya imagen (archivo o URL)
    if (!this.uploadedImage.file && !this.uploadedImage.url) {
      this.toastService.error?.('Por favor selecciona una imagen');
      return;
    }

    this.isLoading = true;

    try {
      // Subir imagen si hay archivo pendiente
      await this.uploadImageIfNeeded();

      let message = this.isEditMode ? 'Guardando cambios...' : 'Creando categoría...';

      const categoria: Category = {
        nombre: this.categoryData.nombre.trim(),
        descripcion: this.categoryData.descripcion.trim(),
        imagen: this.uploadedImage.url!,
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
    } catch (error) {
      this.isLoading = false;
      console.error('Error en onSubmit:', error);
      this.toastService.error?.('Error al procesar la categoría');
    }
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/300x150/e2e8f0/64748b?text=Error+al+cargar';
  }

  // ============================================
  // MÉTODOS DE MANEJO DE IMAGEN
  // ============================================

  /**
   * Maneja la selección de archivo desde el input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
    // Resetear el input para permitir seleccionar el mismo archivo de nuevo
    input.value = '';
  }

  /**
   * Maneja el evento de drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Maneja el evento de drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Maneja el evento de drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  /**
   * Procesa el archivo seleccionado
   */
  private handleFile(file: File): void {
    this.uploadError = null;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      this.uploadError = 'Por favor selecciona un archivo de imagen (PNG, JPG, GIF, WEBP)';
      return;
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      this.uploadError = 'La imagen no debe superar los 2MB';
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.uploadedImage = {
        file: file,
        preview: e.target?.result as string,
        uploading: false
      };
    };
    reader.readAsDataURL(file);
  }

  /**
   * Elimina la imagen seleccionada
   */
  removeImage(): void {
    this.uploadedImage = {
      file: null,
      preview: '',
      url: ''
    };
    this.uploadError = null;
  }

  /**
   * Sube la imagen a Cloudinary si hay un archivo pendiente
   */
  private async uploadImageIfNeeded(): Promise<void> {
    // Si no hay archivo, verificar que haya URL
    if (!this.uploadedImage.file) {
      if (!this.uploadedImage.url) {
        throw new Error('Debes seleccionar una imagen');
      }
      return;
    }

    this.uploadedImage.uploading = true;

    try {
      const response = await firstValueFrom(this.uploadService.uploadImage(this.uploadedImage.file));
      if (response?.success && response.url) {
        this.uploadedImage.url = response.url;
        this.categoryData.imagen = response.url;
      } else {
        throw new Error('No se recibió URL de la imagen');
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw new Error('Error al subir la imagen');
    } finally {
      this.uploadedImage.uploading = false;
    }
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
