// category-cards.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../../../interfaces/categories.interface';
import { PrimeNgModule } from '../../../../primeng.module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category-cards',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './category-cards.component.html',
  styleUrls: ['./category-cards.component.css'],
  animations: [
    trigger('gridAnimation', [
      transition(':enter', [
        query('.category-card', [
          style({ opacity: 0, transform: 'translateY(50px) scale(0.9)' }),
          stagger(150, [
            animate('0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateY(0) scale(1)' })
            )
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(30px) rotateX(10deg)',
          filter: 'blur(5px)'
        }),
        animate('0.6s ease-out', style({
          opacity: 1,
          transform: 'translateY(0) rotateX(0deg)',
          filter: 'blur(0px)'
        }))
      ])
    ])
  ]
})
export class CategoryCardsComponent implements OnInit {
  activeCategories = signal<Category[]>([]);
  hasMoreCategories = signal<boolean>(false);

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActiveCategories();
  }

  private loadActiveCategories(): void {
    this.categoryService.getActiveCategories()
      .pipe().subscribe({
        next: (categorias) => {
          this.activeCategories.set(categorias);
        }
      });
  }

  selectCategory(category: Category): void {
    console.log('Categoría seleccionada:', category);
    this.router.navigate(['/category', category._id]);
  }

  loadMoreCategories(): void {
    // Implementar lógica para cargar más categorías si es necesario
    console.log('Cargando más categorías...');
  }
}
