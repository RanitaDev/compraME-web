// Ejemplo de cómo estructurar un componente hijo
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IUsuario } from './../../../../interfaces/users.interface';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [class.space-y-4]="vistaMovil" [class.space-y-6]="!vistaMovil">

      <!-- Avatar y nombre -->
      <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <img
          [src]="datosUsuario?.usuario.avatar || '/assets/default-avatar.png'"
          [alt]="datosUsuario?.usuario.nombre"
          class="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
        >
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ datosUsuario?.usuario.nombre }} {{ datosUsuario?.usuario.apellidos }}
          </h3>
          <p class="text-gray-600">Miembro desde {{ formatearFecha(datosUsuario?.usuario.fechaRegistro) }}</p>
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
            <input
              type="text"
              formControlName="apellidos"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            formControlName="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            formControlName="telefono"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>

        <!-- Botones -->
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
            [disabled]="formularioInfo.invalid || guardando"
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
  @Input() datosUsuario: any | null = null; // FIXME: Usar el tipo correcto
  @Input() vistaMovil = false;
  @Output() datosActualizados = new EventEmitter<Partial<IUsuario>>();

  formularioInfo: FormGroup;
  guardando = false;

  constructor(private fb: FormBuilder) {
    this.formularioInfo = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    if (this.datosUsuario?.usuario) {
      this.formularioInfo.patchValue(this.datosUsuario.usuario);
    }
  }

  guardarCambios() {
    if (this.formularioInfo.valid) {
      this.guardando = true;
      const datosActualizados = this.formularioInfo.value;

      // Simular guardado
      setTimeout(() => {
        this.datosActualizados.emit(datosActualizados);
        this.guardando = false;
      }, 1000);
    }
  }

  cancelarCambios() {
    if (this.datosUsuario?.usuario) {
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
}
