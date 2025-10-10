import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AddressService } from '../../../../services/address.service';
import { IAddress } from '../../../../interfaces/checkout.interface';

@Component({
  selector: 'app-user-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-addresses.html',
  styleUrl: './user-addresses.css'
})
export class UserAddresses implements OnInit, OnDestroy {
  @Input() direcciones: IAddress[] = [];
  @Input() vistaMovil: boolean = false;
  @Output() direccionesActualizadas = new EventEmitter<IAddress[]>();

  private destroy$ = new Subject<void>();
  mostrarFormulario = false;
  editandoDireccion: IAddress | null = null;
  guardando = false;

  nuevaDireccion: Omit<IAddress, 'id'> = {
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

  constructor(private addressService: AddressService) {}

  ngOnInit(): void {
    // Solo cargar desde el servicio si no se han pasado direcciones y la lista está vacía
    if (this.direcciones.length === 0) {
      this.addressService.getAddresses()
        .pipe(takeUntil(this.destroy$))
        .subscribe(addresses => {
          // Solo actualizar si efectivamente hay direcciones en el servicio
          if (addresses.length > 0) {
            this.direcciones = addresses;
            this.direccionesActualizadas.emit(addresses);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  nuevaDireccionClick(): void {
    this.editandoDireccion = null;
    this.nuevaDireccion = {
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
    this.mostrarFormulario = true;
  }

  editarDireccion(direccion: IAddress): void {
    this.editandoDireccion = direccion;
    this.nuevaDireccion = { ...direccion };
    delete (this.nuevaDireccion as any).id;
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoDireccion = null;
  }

  guardarDireccion(): void {
    this.guardando = true;

    if (this.editandoDireccion) {
      this.addressService.updateAddress(this.editandoDireccion.id, this.nuevaDireccion)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedAddress) => {
            const index = this.direcciones.findIndex(d => d.id === this.editandoDireccion!.id);
            if (index !== -1) {
              this.direcciones[index] = updatedAddress;
            }
            this.direccionesActualizadas.emit(this.direcciones);
            this.cancelarFormulario();
            this.guardando = false;
          },
          error: () => {
            this.guardando = false;
          }
        });
    } else {
      this.addressService.addNewAddress(this.nuevaDireccion)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newAddress) => {
            this.direcciones.push(newAddress);
            this.direccionesActualizadas.emit(this.direcciones);
            this.cancelarFormulario();
            this.guardando = false;
          },
          error: () => {
            this.guardando = false;
          }
        });
    }
  }

  eliminarDireccion(direccion: IAddress): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      this.addressService.deleteAddress(direccion.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.direcciones = this.direcciones.filter(d => d.id !== direccion.id);
            this.direccionesActualizadas.emit(this.direcciones);
          }
        });
    }
  }

  establecerComoPrincipal(direccion: IAddress): void {
    this.addressService.updateAddress(direccion.id, { esPrincipal: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.direcciones.forEach(d => d.esPrincipal = false);
          direccion.esPrincipal = true;
          this.direccionesActualizadas.emit(this.direcciones);
        }
      });
  }

  trackByDireccion(index: number, direccion: IAddress): number {
    return direccion.id;
  }
}
