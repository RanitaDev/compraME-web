import { Injectable } from '@angular/core';
import { ProductService } from './products.service';

@Injectable({
  providedIn: 'root'
})
export class ProductImageService {
  
  // Imágenes por defecto por categoría
  private defaultImages = {
    electronica: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    ropa: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
    hogar: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
    deportes: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    libros: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    default: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'
  };

  constructor(private productService: ProductService) {}

  /**
   * Obtener imagen de producto por ID
   */
  async getProductImage(productId: string): Promise<string> {
    try {
      // Intentar obtener la imagen real del producto
      const product = await this.productService.getProduct(productId).toPromise();
      
      if (product && product.imagenes && product.imagenes.length > 0) {
        return product.imagenes[0]; // Primera imagen del producto
      }
      
      // Si no hay imagen, usar imagen por defecto basada en categoría
      if (product && product.idCategoria) {
        return this.getDefaultImageByCategory(product.idCategoria.toString());
      }
      
      return this.defaultImages.default;
    } catch (error) {
      console.warn(`No se pudo obtener imagen para producto ${productId}:`, error);
      return this.defaultImages.default;
    }
  }

  /**
   * Obtener imagen por defecto según categoría
   */
  private getDefaultImageByCategory(categoria: string): string {
    const categoryKey = categoria.toLowerCase();
    
    if (categoryKey.includes('electr') || categoryKey.includes('tecno')) {
      return this.defaultImages.electronica;
    } else if (categoryKey.includes('ropa') || categoryKey.includes('vestir')) {
      return this.defaultImages.ropa;
    } else if (categoryKey.includes('hogar') || categoryKey.includes('casa')) {
      return this.defaultImages.hogar;
    } else if (categoryKey.includes('deporte') || categoryKey.includes('fitness')) {
      return this.defaultImages.deportes;
    } else if (categoryKey.includes('libro') || categoryKey.includes('lectura')) {
      return this.defaultImages.libros;
    }
    
    return this.defaultImages.default;
  }

  /**
   * Obtener múltiples imágenes de productos de una vez
   */
  async getMultipleProductImages(productIds: string[]): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>();
    
    const imagePromises = productIds.map(async (id) => {
      const image = await this.getProductImage(id);
      imageMap.set(id, image);
    });
    
    await Promise.all(imagePromises);
    return imageMap;
  }

  /**
   * Generar placeholder con primera letra del nombre del producto
   */
  generatePlaceholderImage(productName: string): string {
    const firstLetter = productName.charAt(0).toUpperCase();
    // Usar un servicio como DiceBear o similar para generar avatares
    return `https://api.dicebear.com/7.x/initials/svg?seed=${firstLetter}&backgroundColor=3b82f6&fontSize=40`;
  }
}
