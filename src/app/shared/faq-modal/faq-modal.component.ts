import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FaqService, FAQ } from '../../layout/footer/faq.service';

export interface FaqModalState {
  open: boolean;
}

@Component({
  selector: 'app-faq-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" (click)="close()"></div>

      <div class="relative bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-xl font-semibold text-gray-800">Preguntas Frecuentes</h3>
          <button
            (click)="close()"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="overflow-y-auto px-6 py-4 flex-1">
          <div class="space-y-3">
            <div *ngFor="let faq of faqs; let i = index" class="border border-gray-200 rounded-lg overflow-hidden">
              <button
                (click)="toggle(i)"
                class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <span class="font-medium text-gray-900">{{ faq.question }}</span>
                <svg
                  class="w-5 h-5 text-gray-500 transition-transform duration-200"
                  [class.rotate-180]="openIndex === i"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div
                *ngIf="openIndex === i"
                class="px-4 py-3 bg-white text-gray-700 text-sm leading-relaxed border-t border-gray-100">
                {{ faq.answer }}
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            (click)="close()"
            class="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `
})
export class FaqModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  faqs: FAQ[] = [];
  openIndex: number | null = null;
  private sub?: Subscription;

  constructor(private faqService: FaqService) {}

  ngOnInit(): void {
    this.faqs = this.faqService.getAll();
    window.addEventListener('openFaqModal', () => this.open());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    window.removeEventListener('openFaqModal', () => this.open());
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(_: any) {
    if (this.isOpen) this.close();
  }

  open(): void {
    this.isOpen = true;
    this.openIndex = null;
  }

  close(): void {
    this.isOpen = false;
    this.openIndex = null;
  }

  toggle(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }
}
