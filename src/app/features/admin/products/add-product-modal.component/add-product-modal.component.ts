import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { IProduct } from '../../../../interfaces/products.interface';
import { ProductService } from '../../../../services/products.service';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../../../interfaces/categories.interface';
import { SpinnerService } from '../../../../core/services/spinner.service';
import { finalize } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';
import { UploadService } from '../../../../services/upload.service';

@Component({
  selector: 'app-add-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.css']
})
export class AddProductModalComponent implements OnInit {
  productForm!: FormGroup;

  isSubmitting = false;
  isEditMode = false;
  productId: string | null = null;
  product: IProduct | null = null;
  imageUrls: string[] = [];
  categorias: Category[] = [];

  // Propiedades para manejo de imágenes
  uploadedImages: Array<{
    file: File;
    preview: string;
    url?: string;
    uploading?: boolean;
  }> = [];
  isDragging = false;
  uploadError: string | null = null;
  maxFileSize = 2 * 1024 * 1024; // 2MB en bytes

  constructor(
    private fb: FormBuilder,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private readonly productsService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly spinnerService: SpinnerService,
    private readonly toastService: ToastService,
    private readonly uploadService: UploadService
  ) {}

  ngOnInit() {
    this.initializeComponent();
    this.initializeForm();
    this.obtenerCategorias();
  }

  private obtenerCategorias(): void {
    this.categoryService.getActiveCategories()
      .pipe(finalize(() => {}))
      .subscribe({
        next: (categorias) => {
          this.categorias = categorias;
          // Cargar datos del producto después de tener las categorías
          this.loadProductData();
        },
        error: (error) => {
          console.error('Error cargando categorías:', error);
          this.toastService.error?.('Error al cargar las categorías');
          // Aún así intentar cargar el producto
          this.loadProductData();
        }
      });
  }

  private initializeComponent() {
    const data = this.config.data;

    if (data) {
      this.productId = data.id || null;
      this.product = data.product || null;
      this.isEditMode = data.isEditMode === 'editar' && (this.productId !== null || this.product !== null);
    }
  }

  /**
   * Inicializa el formulario reactivo con validaciones
   */
  private initializeForm() {
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      imagenes: [[]],
      idCategoria: ['', Validators.required],
      activo: [true],
      color: ['#4299e1', Validators.required], // Color por defecto
      destacado: [false]
    });
  }

  /**
   * Carga los datos del producto si está en modo edición
   */
  private loadProductData(): void {
    if (this.isEditMode) {
      // Si el producto ya viene en los datos, usarlo directamente
      if (this.product) {
        this.loadProductDataIntoForm(this.product);
      } else if (this.productId) {
        // Si solo viene el ID, cargar del servidor
        this.spinnerService.show('Cargando datos del producto...', 'default', 'product-load');

        this.productsService.getProduct(this.productId)
          .pipe(
            finalize(() => {
              this.spinnerService.hide('product-load');
            })
          )
          .subscribe({
            next: (product) => {
              if (product) {
                this.loadProductDataIntoForm(product);
              }
            },
            error: (error) => {
              console.error('Error al cargar el producto:', error);
            }
          });
      }
    } else {
      this.resetFormToDefault();
    }
  }

  /**
   * Carga los datos del producto en el formulario
   */
  private loadProductDataIntoForm(product: IProduct): void {
    // El backend puede enviar categoriaId o idCategoria
    const categoryId = product.idCategoria || product.categoriaId;

    this.productForm.patchValue({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      stock: product.stock,
      imagenes: product.imagenes,
      idCategoria: categoryId,
      activo: product.activo,
      color: product.color,
      destacado: product.destacado
    });

    // Cargar las URLs de imágenes existentes como previews
    if (product.imagenes && product.imagenes.length > 0) {
      this.uploadedImages = product.imagenes.map(url => ({
        file: null as any,
        preview: url,
        url: url
      }));
    }
  }

  /**
   * Resetea el formulario a valores por defecto
   */
  private resetFormToDefault() {
    this.productForm.patchValue({
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      imagenes: [],
      idCategoria: '',
      activo: true,
      color: '#4299e1',
      destacado: false
    });
    this.uploadedImages = [];
    this.uploadError = null;
  }

  /**
   * Maneja el envío del formulario
   */
  async onSubmit(): Promise<void> {
    if (this.productForm.valid) {
      this.isSubmitting = true;

      // Subir todas las imágenes que no tienen URL
      await this.uploadAllPendingImages();
      // Preparar datos para envío
      const formData = this.prepareFormData();

      const message = this.isEditMode ? 'Actualizando producto...' : 'Creando producto...';
      this.spinnerService.show(message, 'bar', 'product-save');

      // Usar el método correcto según si es edición o creación
      const productObservable = this.isEditMode && this.product
        ? this.productsService.actualizarProducto(this.product._id, formData)
        : this.productsService.agregarProducto(formData as IProduct);

      productObservable.pipe(
        finalize(() => this.spinnerService.hide('product-save'))
      ).subscribe({
        next: (productoInsertado) => {
          this.isSubmitting = false;
          if (productoInsertado) {
            this.toastService.success('Producto guardado exitosamente');
            this.ref.close({ success: true, action: 'saved', product: productoInsertado });
          } else {
            this.toastService.error?.('No fue posible guardar el producto');
            this.resetFormToDefault();
            this.ref.close({ success: false, action: 'error' });
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.resetFormToDefault();
          this.ref.close({ success: false, action: 'error' });
        }
      });
    } else {
      // Marcar campos como tocados para mostrar errores
      this.markFormGroupTouched(this.productForm);
    }
  }

  /**
   * Prepara los datos del formulario para envío
   */
  private prepareFormData(): Partial<IProduct> {
    const formData = { ...this.productForm.value };

    // Obtener solo las URLs de las imágenes subidas
    const imageUrls = this.uploadedImages
      .filter(img => img.url)
      .map(img => img.url!);

    formData.imagenes = imageUrls;

    // Incluir el ID del producto si está en modo edición
    if (this.isEditMode && this.product) {
      formData.idProducto = this.product.idProducto;
    }

    return formData;
  }

  // ============================================
  // MÉTODOS DE MANEJO DE IMÁGENES
  // ============================================

  /**
   * Maneja la selección de archivos desde el input
   */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
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
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  /**
   * Procesa los archivos seleccionados
   */
  private handleFiles(files: File[]): void {
    this.uploadError = null;

    // Filtrar solo imágenes
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      this.uploadError = 'Por favor selecciona solo archivos de imagen (PNG, JPG, GIF, WEBP)';
      return;
    }

    // Validar tamaño de cada archivo
    const oversizedFiles = imageFiles.filter(file => file.size > this.maxFileSize);
    if (oversizedFiles.length > 0) {
      this.uploadError = `${oversizedFiles.length} imagen(es) superan el tamaño máximo de 2MB`;
      return;
    }

    // Agregar imágenes al array con preview
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.uploadedImages.push({
          file: file,
          preview: e.target?.result as string,
          uploading: false
        });
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Elimina una imagen por índice
   */
  removeImageByIndex(index: number): void {
    this.uploadedImages.splice(index, 1);
    this.uploadError = null;
  }

  /**
   * Sube todas las imágenes pendientes a Cloudinary
   */
  private async uploadAllPendingImages(): Promise<void> {
    const pendingImages = this.uploadedImages.filter(img => !img.url && img.file);

    if (pendingImages.length === 0) {
      return;
    }

    this.spinnerService.show('Subiendo imágenes...', 'bar', 'images-upload');

    try {
      for (const img of pendingImages) {
        if (!img.file) continue;

        img.uploading = true;

        try {
          const response = await this.uploadService.uploadImage(img.file).toPromise();
          if (response?.success && response.url) {
            img.url = response.url;
            img.uploading = false;
          }
        } catch (error) {
          img.uploading = false;
          console.error('Error subiendo imagen:', error);
          throw error;
        }
      }
    } finally {
      this.spinnerService.hide('images-upload');
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

  /**
   * Cierra el modal sin guardar
   */
  closeModal() {
    this.ref.close({ success: false, action: 'cancelled' });
  }

  /**
   * Marca todos los controles del formulario como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
