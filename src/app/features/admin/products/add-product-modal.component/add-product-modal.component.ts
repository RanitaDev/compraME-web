import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { IProduct } from '../../../../interfaces/products.interface';

@Component({
  selector: 'app-add-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.css']
})
export class AddProductModalComponent implements OnInit {

  // Formulario reactivo
  productForm!: FormGroup;

  // Estado del componente
  isSubmitting = false;
  isEditMode = false;
  productId: number | null = null;
  imageUrls: string[] = [''];

  constructor(
    private fb: FormBuilder,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig
  ) {}

  ngOnInit() {
    this.initializeComponent();
    this.initializeForm();
    this.loadProductData();
  }

  /**
   * Inicializa el componente con los datos del config
   */
  private initializeComponent() {
    // Obtener datos del config de PrimeNG
    const data = this.config.data;

    if (data) {
      this.productId = data.id || null;
      this.isEditMode = data.isEditMode === 'editar' && this.productId !== null;
    }

    console.log('Modo:', this.isEditMode ? 'Edición' : 'Creación');
    console.log('ID Producto:', this.productId);
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
  private loadProductData() {
    if (this.isEditMode && this.productId) {
      // Aquí harías la llamada a tu servicio para obtener el producto
      // Por ahora simulo con datos de ejemplo
      this.loadProductFromService(this.productId);
    } else {
      // Modo creación - valores por defecto
      this.resetFormToDefault();
    }
  }

  /**
   * Simula la carga de un producto desde el servicio
   * Reemplazar con tu llamada real al backend
   */
  private loadProductFromService(id: number) {
    // AQUÍ CONECTAR CON TU BACKEND
    // this.productService.getProduct(id).subscribe(...)

    // Simulación con datos de ejemplo
    const mockProducts: IProduct[] = [
      {
        idProducto: 1,
        nombre: 'Auriculares Bluetooth Premium',
        descripcion: 'Experimenta una calidad de sonido excepcional con cancelación de ruido activa y hasta 30 horas de batería.',
        precio: 299.99,
        stock: 15,
        imagenes: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop'
        ],
        idCategoria: 1,
        activo: true,
        fechaCreacion: new Date('2024-01-15'),
        fechaActualizacion: new Date('2024-08-01'),
        color: '#667eea',
        destacado: true
      }
    ];

    const product = mockProducts.find(p => p.idProducto === id);

    if (product) {
      // Cargar datos en el formulario
      this.productForm.patchValue({
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: product.precio,
        stock: product.stock,
        imagenes: product.imagenes,
        idCategoria: product.idCategoria.toString(),
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
  onSubmit() {
    if (this.productForm.valid) {
      this.isSubmitting = true;

      // Preparar datos para envío
      const formData = this.prepareFormData();

      // Simular guardado (AQUÍ CONECTAR CON TU BACKEND)
      setTimeout(() => {
        this.isSubmitting = false;

        // Cerrar modal y devolver datos
        this.ref.close({
          success: true,
          data: formData,
          action: this.isEditMode ? 'updated' : 'created'
        });
      }, 1500);
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

    // Filtrar URLs de imágenes válidas
    const validImageUrls = this.imageUrls.filter(url => url.trim() !== '');
    formData.imagenes = validImageUrls;

    // Convertir idCategoria a number
    formData.idCategoria = parseInt(formData.idCategoria);

    // Agregar fechas
    const now = new Date();
    if (this.isEditMode && this.productId) {
      formData.idProducto = this.productId;
      formData.fechaActualizacion = now;
      // fechaCreacion se mantiene igual
    } else {
      formData.fechaCreacion = now;
      formData.fechaActualizacion = now;
    }

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
