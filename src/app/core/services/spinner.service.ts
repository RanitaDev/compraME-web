// Servicio de spinner global para mostrar/ocultar indicadores de carga
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SpinnerState {
  show: boolean;
  message?: string;
  type?: 'default' | 'dots' | 'pulse' | 'bar';
}

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private spinnerSubject = new BehaviorSubject<SpinnerState>({ show: false });
  private activeSpinners = new Set<string>();

  /**
   * Observable del estado del spinner
   */
  public spinner$: Observable<SpinnerState> = this.spinnerSubject.asObservable();

  /**
   * Muestra el spinner con mensaje opcional
   * @param message Mensaje a mostrar (opcional)
   * @param type Tipo de spinner (opcional)
   * @param id ID único del spinner (opcional, para múltiples spinners)
   */
  show(message?: string, type: 'default' | 'dots' | 'pulse' | 'bar' = 'default', id?: string): void {
    if (id) {
      this.activeSpinners.add(id);
    }

    this.spinnerSubject.next({
      show: true,
      message,
      type
    });
  }

  /**
   * Oculta el spinner
   * @param id ID único del spinner (opcional)
   */
  hide(id?: string): void {
    if (id) {
      this.activeSpinners.delete(id);
      // Si aún hay spinners activos, no ocultar
      if (this.activeSpinners.size > 0) {
        return;
      }
    }

    this.spinnerSubject.next({ show: false });
  }

  /**
   * Verifica si el spinner está visible
   */
  isVisible(): boolean {
    return this.spinnerSubject.value.show;
  }

  /**
   * Fuerza ocultar todos los spinners
   */
  hideAll(): void {
    this.activeSpinners.clear();
    this.spinnerSubject.next({ show: false });
  }
}
