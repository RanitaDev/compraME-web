import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalService, ModalState } from '../../core/services/modal.service';

@Component({
  selector: 'app-text-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="state.open" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" (click)="close()"></div>

      <div class="relative bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-auto p-6" role="dialog" aria-modal="true">
        <h3 class="text-gray-600 font-semibold text-lg mb-4">{{ state.title }}</h3>
        <div class="text-black whitespace-pre-line leading-relaxed">
          {{ state.content }}
        </div>

        <div class="mt-6 flex justify-end">
          <button (click)="close()" class="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700">Cerrar</button>
        </div>
      </div>
    </div>
  `
})
export class TextModalComponent implements OnInit, OnDestroy {
  state: ModalState = { open: false };
  private sub?: Subscription;

  constructor(private modal: ModalService) {}

  ngOnInit(): void {
    this.sub = this.modal.modal$.subscribe(s => this.state = s);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  close(): void {
    this.modal.close();
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(_: any) {
    if (this.state.open) this.close();
  }
}
