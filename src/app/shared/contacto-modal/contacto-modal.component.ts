import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactoService, ContactOption } from '../../layout/footer/contacto.service';

@Component({
  selector: 'app-contacto-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" (click)="close()"></div>

      <div class="relative bg-white rounded-xl w-full max-w-md overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-xl font-semibold text-gray-800">Contáctanos</h3>
          <button
            (click)="close()"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="px-6 py-6">
          <p class="text-gray-600 text-sm mb-6">
            Elige tu canal preferido para comunicarte con nosotros. Estamos aquí para ayudarte.
          </p>

          <div class="space-y-3">
            <a
              *ngFor="let option of options"
              [href]="option.link"
              target="_blank"
              rel="noopener noreferrer"
              [class]="option.bgColor + ' ' + option.hoverColor + ' text-white px-5 py-3 rounded-lg flex items-center gap-3 transition-colors duration-200'">
              <i [class]="option.icon + ' text-xl'"></i>
              <span class="font-medium">{{ option.label }}</span>
            </a>
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
export class ContactoModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  options: ContactOption[] = [];

  constructor(private contactoService: ContactoService) {}

  ngOnInit(): void {
    this.options = this.contactoService.getAll();
    window.addEventListener('openContactoModal', () => this.open());
  }

  ngOnDestroy(): void {
    window.removeEventListener('openContactoModal', () => this.open());
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(_: any) {
    if (this.isOpen) this.close();
  }

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }
}
