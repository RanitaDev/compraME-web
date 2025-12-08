// category-cards.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
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
  private readonly INITIAL_LIMIT = 6;

  allCategories = signal<Category[]>([]);
  showAll = signal<boolean>(false);

  // Computed signal to show limited or all categories
  visibleCategories = computed(() => {
    const all = this.allCategories();
    return this.showAll() ? all : all.slice(0, this.INITIAL_LIMIT);
  });

  // Computed signal to check if there are more categories to show
  hasMoreCategories = computed(() => {
    return this.allCategories().length > this.INITIAL_LIMIT;
  });

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
          // Invertir el orden del arreglo (mostrar de manera descendente)
          const reversedCategories = [...categorias].reverse();
          this.allCategories.set(reversedCategories);
        }
      });
  }

  public selectCategory(category: Category): void {
    // Navigate then ensure the viewport is at the top of the destination page
    this.router.navigate(['/category', category._id]).then(() => {
      // Scroll to top to avoid the page staying at previous scroll position
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch (e) {
        // Fallback for older browsers
        window.scrollTo(0, 0);
      }
    });
  }

  public toggleShowAll(): void {
    this.showAll.set(!this.showAll());
  }
}
