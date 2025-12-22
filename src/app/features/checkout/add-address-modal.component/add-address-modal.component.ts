import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-add-address-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './add-address-modal.component.html'
})
export class AddAddressModalComponent implements OnInit {
  private dialogRef = inject(DynamicDialogRef);

  public formData = {
    alias: '',
    nombreCompleto: '',
    telefono: '',
    calle: '',
    numeroExterior: '',
    numeroInterior: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    referencias: '',
    esPrincipal: false
  };

  ngOnInit(): void {}

  public guardarDireccion(): void {
    if (!this.isFormValid()) {
      return;
    }
    this.dialogRef.close({ saved: true, address: this.formData });
  }

  public cerrar(): void {
    this.dialogRef.close({ saved: false });
  }

  // Validar que solo sean números para teléfono
  public onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    this.formData.telefono = input.value;
  }

  // Validar que solo sean números para número exterior
  public onNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.formData.numeroExterior = input.value;
  }

  // Detectar texto sin sentido (repeticiones o patrones aleatorios)
  private isValidText(text: string): boolean {
    if (!text || text.length < 3) return true;

    // Detectar si tiene más del 60% de caracteres repetidos
    const chars = text.toLowerCase().split('');
    const charCount = new Map<string, number>();
    chars.forEach(char => {
      charCount.set(char, (charCount.get(char) || 0) + 1);
    });

    const maxRepetition = Math.max(...Array.from(charCount.values()));
    if (maxRepetition / text.length > 0.6) return false;

    // Detectar patrones repetitivos simples (ej: "aaaaa", "ababab")
    const repeatedPattern = /([a-z])\1{4,}/i.test(text);
    if (repeatedPattern) return false;

    // Detectar secuencias de teclas aleatorias (ej: "asdfghjkl", "qwerty")
    const keyboardPatterns = [
      /qwerty/i, /asdfgh/i, /zxcvbn/i,
      /qazwsx/i, /asdjkl/i, /mnbvcx/i
    ];
    if (keyboardPatterns.some(pattern => pattern.test(text))) return false;

    return true;
  }

  public isFormValid(): boolean {
    const basicValidation = !!(
      this.formData.alias &&
      this.formData.nombreCompleto &&
      this.formData.telefono &&
      this.formData.calle &&
      this.formData.numeroExterior &&
      this.formData.colonia &&
      this.formData.ciudad &&
      this.formData.estado &&
      this.formData.codigoPostal
    );

    if (!basicValidation) return false;

    // Validar longitud de teléfono
    if (this.formData.telefono.length !== 10) return false;

    // Validar que calle, colonia y referencias no sean texto sin sentido
    if (!this.isValidText(this.formData.calle)) return false;
    if (!this.isValidText(this.formData.colonia)) return false;
    if (this.formData.referencias && !this.isValidText(this.formData.referencias)) return false;

    return true;
  }
}
