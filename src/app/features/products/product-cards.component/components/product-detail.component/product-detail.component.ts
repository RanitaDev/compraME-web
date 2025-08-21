import { Component, OnInit, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProduct } from '../../../../../interfaces/products.interface';
import { FeaturedProductsComponent } from '../featured-products.component/featured-products.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FeaturedProductsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  @Input() productId: number = 3;

  product = signal<IProduct | null>(null);
  selectedImageIndex = signal(0);
  imageLoaded = signal(false);

  selectedImage = computed(() => {
    const prod = this.product();
    if (!prod || !prod.imagenes.length) return '';
    return prod.imagenes[this.selectedImageIndex()];
  });

  ngOnInit() {
    this.loadProduct();
  }

  private loadProduct() {
    // Simulamos la carga del producto
    // En tu implementación real, aquí llamarías a tu ProductService
    setTimeout(() => {
      // Datos de ejemplo usando el primer producto de tu servicio
      this.product.set({
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
      });
    }, 500);
  }

  selectImage(index: number) {
    this.selectedImageIndex.set(index);
    this.imageLoaded.set(false);
  }

  onImageLoad() {
    this.imageLoaded.set(true);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }
}
