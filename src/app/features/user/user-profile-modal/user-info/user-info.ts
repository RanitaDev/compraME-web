// Ejemplo de cómo estructurar un componente hijo
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IUsuario } from './../../../../interfaces/users.interface';
import { IDatosCompletoUsuario } from '../../../../services/user.service';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [class.space-y-4]="vistaMovil" [class.space-y-6]="!vistaMovil">

      <!-- Avatar y nombre -->
      <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ datosUsuario.usuario.nombre }} {{ datosUsuario.usuario.apellidos }}
          </h3>
          <p class="text-gray-600">Miembro desde {{ formatearFecha(datosUsuario.usuario.fechaRegistro) }}</p>
        </div>
      </div>

      <!-- Formulario de información -->
      <form [formGroup]="formularioInfo" (ngSubmit)="guardarCambios()" class="space-y-4">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              formControlName="nombre"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
            <input
              type="text"
              formControlName="apellidos"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
            >
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div class="relative">
            <input
              type="email"
              formControlName="email"
              [disabled]="true"
              aria-readonly="true"
              class="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 font-semibold"
            >
            <!-- Lock icon inside the input on the right -->
            <span class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            formControlName="telefono"
            (input)="onPhoneInput($event)"
            maxlength="14"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
          >
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            (click)="cancelarCambios()"
            class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            [disabled]="!hasChanges || guardando"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </form>
    </div>
  `
})


export class UserInfoComponent {
  @Input() datosUsuario: IDatosCompletoUsuario = {} as IDatosCompletoUsuario;
  @Input() vistaMovil = false;
  @Output() datosActualizados = new EventEmitter<Partial<IUsuario>>();

  formularioInfo: FormGroup;
  guardando = false;
  private originalValue: Record<string, any> = {};

  constructor(private fb: FormBuilder) {

    this.formularioInfo = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      // Email no editable por el usuario (guardamos el valor pero el control está deshabilitado)
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      telefono: ['', [Validators.required]]
    });

  }

  ngOnInit() {
    this.formularioInfo.patchValue(this.datosUsuario.usuario);
    // Guardar snapshot de valores originales para comparación
    this.originalValue = this.formularioInfo.getRawValue();
  }

  guardarCambios() {
    if (this.formularioInfo.valid) {
      this.guardando = true;
      const datosActualizados = this.formularioInfo.value;

      setTimeout(() => {
        this.datosActualizados.emit(datosActualizados);
        this.guardando = false;
        // Actualizar snapshot después de guardar
        this.originalValue = this.formularioInfo.getRawValue();
      }, 1000);
    }
  }

  /**
   * Formatea la entrada del teléfono a '000 - 00 - 00' conforme el usuario escribe.
   * Acepta números y elimina otros caracteres.
   */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;

    // Extraer solo dígitos
    const digits = (input.value || '').replace(/\D/g, '');

    // Formato: 3 - 2 - 2
    const part1 = digits.substring(0, 3);
    const part2 = digits.substring(3, 5);
    const part3 = digits.substring(5, 7);

    const formatted = [part1, part2, part3].filter(Boolean).join(' - ');

    // Actualizar input y control del formulario sin mover el cursor de forma sofisticada
    input.value = formatted;
    this.formularioInfo.get('telefono')?.setValue(formatted);
  }

  /**
   * Indica si el formulario tiene cambios reales respecto al snapshot original.
   */
  get hasChanges(): boolean {
    try {
      return JSON.stringify(this.formularioInfo.getRawValue()) !== JSON.stringify(this.originalValue);
    } catch {
      return true;
    }
  }

  cancelarCambios() {
    if (this.datosUsuario.usuario) {
      this.formularioInfo.patchValue(this.datosUsuario.usuario);
    }
  }

  formatearFecha(fecha: Date | undefined): string {
    if (!fecha) return '';
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long'
    }).format(new Date(fecha));
  }

  /**
   * Maneja errores de carga de imagen y establece un fallback local.
   * Intenta primero '/assets/layout.png' y si también falla usa '/assets/placeholderImage.webp'.
   *
   * @param event - Evento de error del elemento img
   */
  onImageError(event: Event): void {
    const img = event?.target as HTMLImageElement | null;
    if (!img) return;

    const current = img.src || '';
    if (current.includes('placeholderImage.webp')) return;
    if (!current.includes('layout.png')) {
      img.src = '/assets/layout.png';
      return;
    }
    img.src = '/assets/placeholderImage.webp';
  }
}
