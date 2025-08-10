// category.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category } from '../interfaces/categories.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categories: Category[] = [
    {
      idCateogria: 1,
      nombre: 'Audio',
      descripcion: 'Auriculares, altavoces y equipos de sonido premium',
      imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      activa: true
    },
    {
      idCateogria: 2,
      nombre: 'Wearables',
      descripcion: 'Smartwatches, fitness trackers y tecnología portátil',
      imagen: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
      activa: true
    },
    {
      idCateogria: 3,
      nombre: 'Fotografía',
      descripcion: 'Cámaras, lentes y accesorios profesionales',
      imagen: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=600&fit=crop',
      activa: true
    },
    {
      idCateogria: 4,
      nombre: 'Gaming',
      descripcion: 'Laptops, consolas y accesorios para gamers',
      imagen: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop',
      activa: true
    },
    {
      idCateogria: 5,
      nombre: 'Móviles',
      descripcion: 'Smartphones, tablets y accesorios móviles',
      imagen: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
      activa: true
    },
    {
      idCateogria: 6,
      nombre: 'Computación',
      descripcion: 'Laptops, PCs y componentes de alta gama',
      imagen: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&h=600&fit=crop',
      activa: true
    }
  ];

  getCategories(): Observable<Category[]> {
    return of(this.categories);
  }

  getActiveCategories(): Observable<Category[]> {
    const activeCategories = this.categories.filter(category => category.activa);
    return of(activeCategories);
  }

  getCategory(id: number): Observable<Category | undefined> {
    return of(this.categories.find(category => category.idCateogria === id));
  }
}
