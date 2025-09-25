import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DireccionUsuario {
  id: string;
  tipo: 'casa' | 'oficina' | 'otro';
  nombre: string;
  calle: string;
  numero: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  telefono?: string;
  esPrincipal: boolean;
  esFacturacion: boolean;
}

@Component({
  selector: 'app-user-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-addresses.html',
  styleUrl: './user-addresses.css'
})
export class UserAddresses {
  @Input() direcciones: any[] = [];
  @Input() vistaMovil: boolean = false;
  @Output() direccionesActualizadas = new EventEmitter<any[]>();

  mostrarFormulario = false;
  editandoDireccion: DireccionUsuario | null = null;

  nuevaDireccion: DireccionUsuario = {
    id: '',
    tipo: 'casa',
    nombre: '',
    calle: '',
    numero: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    telefono: '',
    esPrincipal: false,
    esFacturacion: false
  };

  // Datos de ejemplo para la demostración
  direccionesEjemplo: DireccionUsuario[] = [
    {
      id: '1',
      tipo: 'casa',
      nombre: 'Casa',
      calle: 'Av. Insurgentes Sur',
      numero: '1234',
      colonia: 'Del Valle',
      ciudad: 'México',
      estado: 'CDMX',
      codigoPostal: '03100',
      telefono: '55-1234-5678',
      esPrincipal: true,
      esFacturacion: true
    },
    {
      id: '2',
      tipo: 'oficina',
      nombre: 'Oficina',
      calle: 'Paseo de la Reforma',
      numero: '567',
      colonia: 'Juárez',
      ciudad: 'México',
      estado: 'CDMX',
      codigoPostal: '06600',
      telefono: '55-9876-5432',
      esPrincipal: false,
      esFacturacion: false
    }
  ];

  ngOnInit() {
    // Usar datos de ejemplo si no se proporcionan datos reales
    if (!this.direcciones || this.direcciones.length === 0) {
      this.direcciones = this.direccionesEjemplo;
    }
  }

  getTipoIcono(tipo: string): string {
    const iconos = {
      'casa': 'pi-home',
      'oficina': 'pi-building',
      'otro': 'pi-map-marker'
    };
    return iconos[tipo as keyof typeof iconos] || 'pi-map-marker';
  }

  getTipoTexto(tipo: string): string {
    const textos = {
      'casa': 'Casa',
      'oficina': 'Oficina',
      'otro': 'Otro'
    };
    return textos[tipo as keyof typeof textos] || tipo;
  }

  nuevaDireccionClick(): void {
    this.editandoDireccion = null;
    this.nuevaDireccion = {
      id: '',
      tipo: 'casa',
      nombre: '',
      calle: '',
      numero: '',
      colonia: '',
      ciudad: '',
      estado: '',
      codigoPostal: '',
      telefono: '',
      esPrincipal: false,
      esFacturacion: false
    };
    this.mostrarFormulario = true;
  }

  editarDireccion(direccion: DireccionUsuario): void {
    this.editandoDireccion = direccion;
    this.nuevaDireccion = { ...direccion };
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoDireccion = null;
  }

  guardarDireccion(): void {
    if (this.editandoDireccion) {
      // Actualizar dirección existente
      const index = this.direcciones.findIndex(d => d.id === this.editandoDireccion!.id);
      if (index !== -1) {
        this.direcciones[index] = { ...this.nuevaDireccion };
      }
    } else {
      // Agregar nueva dirección
      const nuevaDir = { ...this.nuevaDireccion, id: Date.now().toString() };
      this.direcciones.push(nuevaDir);
    }

    // Si es principal, quitar principal de las demás
    if (this.nuevaDireccion.esPrincipal) {
      this.direcciones.forEach(d => {
        if (d.id !== this.nuevaDireccion.id) {
          d.esPrincipal = false;
        }
      });
    }

    this.direccionesActualizadas.emit(this.direcciones);
    this.cancelarFormulario();
  }

  eliminarDireccion(direccion: DireccionUsuario): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      this.direcciones = this.direcciones.filter(d => d.id !== direccion.id);
      this.direccionesActualizadas.emit(this.direcciones);
    }
  }

  establecerComoPrincipal(direccion: DireccionUsuario): void {
    this.direcciones.forEach(d => d.esPrincipal = false);
    direccion.esPrincipal = true;
    this.direccionesActualizadas.emit(this.direcciones);
  }

  trackByDireccion(index: number, direccion: DireccionUsuario): string {
    return direccion.id;
  }
}
