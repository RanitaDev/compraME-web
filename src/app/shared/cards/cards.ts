import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule, ButtonSeverity } from "primeng/button";

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './cards.html',
  styleUrl: './cards.css'
})
export class Cards {
  @Input() title: string = 'Título de la card';
  @Input() description: string = 'Descripción de la card que explica el contenido';
  @Input() buttonText: string = 'Ver más';
  @Input() imageUrl: string = '';
  @Input() imageAlt: string = 'Imagen de la card';
  @Input() actionType: 'primary' | 'secondary' = 'primary';
  @Input() several: ButtonSeverity = 'primary';
  @Input() buttonRaised: boolean = false;
  @Input() buttonRounded: boolean = false;
  @Input() noBorderButton: boolean = false;
  @Input() buttonSize: "small" | "large" | undefined = 'small';
  @Input() buttonIcon: string = 'pi pi-eye';
}
