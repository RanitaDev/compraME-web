import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BackgroundService {
  private backgroundColorSubject = new BehaviorSubject<string>('#f1f5f9');
  public backgroundColor$ = this.backgroundColorSubject.asObservable();

  constructor() {}

  /**
   * Cambia el color de fondo de toda la aplicación con animación suave
   * @param color Color en formato hex, rgb, o nombre de color CSS
   */
  public setBackgroundColor(color: string): void {
    this.backgroundColorSubject.next(color);
    // Aplicar el color al body con gradiente y transición suave
    document.body.style.background = `linear-gradient(135deg, ${color} 0%, ${this.darkenColor(color, 20)} 100%)`;
    document.body.style.transition = 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  /**
   * Obtiene el color de fondo actual
   * @returns Color actual
   */
  public getCurrentBackgroundColor(): string {
    return this.backgroundColorSubject.value;
  }

  /**
   * Resets the background color of the document body to its default state.
   * This method clears any background color set by the application.
   */
  public resetBackground(): void {
    this.setBackgroundColor('#f1f5f9');
  }

  /**
   * Oscurece un color en un porcentaje dado
   * @param color Color base
   * @param percent Porcentaje a oscurecer
   * @returns Color oscurecido
   */
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
}
