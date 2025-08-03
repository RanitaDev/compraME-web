// src/app/core/background.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BackgroundService {

  /**
   * @description This service changes the background color of the body in the application.
   * @param color Sets the background color of the document body.
   */
  public setBackgroundColor(color: string): void {
    document.body.style.background = color;
  }

  /**
   * @description Resets the background color of the document body to its default state.
   * This method clears any background color set by the application.
   */
  public resetBackground(): void {
    document.body.style.background = '';
  }
}
