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
  imageUrls: string[] = [''];
  categorias: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private readonly productsService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly spinnerService: SpinnerService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit() {
    this.initializeComponent();
    this.initializeForm();
    this.loadProductData();
    this.obtenerCategorias();
  }

  private obtenerCategorias(): void {
    this.categoryService.getActiveCategories()
      .pipe(finalize(() => {}))
      .subscribe({
        next: (categorias) => {
          this.categorias = categorias;
        },
        error: (error) => {
          console.error('Error cargando categorías:', error);
          this.toastService.error?.('Error al cargar las categorías');
        }
      });
  }

  private initializeComponent() {
    const data = this.config.data;

    if (data) {
      this.productId = data.id || null;
      this.isEditMode = data.isEditMode === 'editar' && this.productId !== null;
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
    if (this.isEditMode && this.productId) {
      // Mostrar spinner con mensaje personalizado
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
    } else {
      this.resetFormToDefault();
    }
  }

  /**
   * Carga los datos del producto en el formulario
   */
  private loadProductDataIntoForm(product: IProduct): void {
    this.productForm.patchValue({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      stock: product.stock,
      imagenes: product.imagenes,
      idCategoria: product.idCategoria,
      activo: product.activo,
      color: product.color,
      destacado: product.destacado
    });

    // Cargar las URLs de imágenes
    this.imageUrls = [...product.imagenes];
    if (this.imageUrls.length === 0) {
      this.imageUrls = [''];
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
    this.imageUrls = [''];
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.productForm.valid) {
      this.isSubmitting = true;

      // Preparar datos para envío
      const formData = this.prepareFormData();

      const message = this.isEditMode ? 'Actualizando producto...' : 'Creando producto...';
      this.spinnerService.show(message, 'bar', 'product-save');
      this.productsService.agregarProducto(formData as IProduct).pipe(
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

    const validImageUrls = this.imageUrls.filter(url => url.trim() !== '');
    formData.imagenes = validImageUrls;
    return formData;
  }

  /**
   * Agrega una nueva URL de imagen
   */
  addImageUrl() {
    this.imageUrls.push('');
  }

  /**
   * Remueve una URL de imagen por índice
   */
  removeImage(index: number) {
    if (this.imageUrls.length > 1) {
      this.imageUrls.splice(index, 1);
      this.updateFormImages();
    }
  }

  /**
   * Actualiza el formulario con las URLs de imágenes actuales
   */
  updateFormImages() {
    const validUrls = this.imageUrls.filter(url => url.trim() !== '');
    this.productForm.patchValue({ imagenes: validUrls });
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
