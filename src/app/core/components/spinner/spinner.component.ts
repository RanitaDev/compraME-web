// Componente de spinner global con múltiples estilos
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerService, SpinnerState } from '../../services/spinner.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if(spinnerState.show){
      <div
         class="spinner-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
         [@fadeInOut]>

      <!-- Contenedor del spinner -->
      <div class="spinner-container bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center">

        <!-- Spinner por defecto -->
        <div *ngIf="spinnerState.type === 'default'" class="spinner-default">
          <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>

        <!-- Spinner de puntos -->
        <div *ngIf="spinnerState.type === 'dots'" class="spinner-dots flex justify-center space-x-2">
          <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
          <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
        </div>

        <!-- Spinner de pulso -->
        <div *ngIf="spinnerState.type === 'pulse'" class="spinner-pulse">
          <div class="w-12 h-12 bg-blue-600 rounded-full animate-pulse mx-auto opacity-75"></div>
        </div>

        <!-- Barra de progreso -->
        <div *ngIf="spinnerState.type === 'bar'" class="spinner-bar">
          <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div class="bg-blue-600 h-2 rounded-full loading-bar"></div>
          </div>
        </div>

        <!-- Mensaje -->
        <div *ngIf="spinnerState.message" class="mt-4">
          <p class="text-gray-700 font-medium text-sm">{{ spinnerState.message }}</p>
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    /* Animaciones personalizadas */
    @keyframes fadeInOut {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes loadingBar {
      0% { width: 0%; }
      50% { width: 70%; }
      100% { width: 100%; }
    }

    .loading-bar {
      animation: loadingBar 2s ease-in-out infinite;
    }

    /* Mejoras visuales */
    .spinner-overlay {
      transition: opacity 0.3s ease-in-out;
    }

    .spinner-container {
      transform: scale(0.95);
      animation: scaleIn 0.3s ease-out forwards;
    }

    @keyframes scaleIn {
      to {
        transform: scale(1);
      }
    }

    /* Estados responsive */
    @media (max-width: 640px) {
      .spinner-container {
        margin: 1rem;
        padding: 1.5rem;
      }
    }
  `],
  animations: []
})
export class SpinnerComponent implements OnInit, OnDestroy {
  spinnerState: SpinnerState = { show: false };
  private destroy$ = new Subject<void>();

  constructor(private spinnerService: SpinnerService) {}

  ngOnInit(): void {
    this.spinnerService.spinner$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.spinnerState = state;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
