import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AddressService } from '../../../../services/address.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from 'primeng/api';
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
  formSubmitted = false;

  nuevaDireccion: Omit<IAddress, '_id'> = {
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

  constructor(
    private addressService: AddressService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    // Siempre suscribirse al servicio como fuente única de verdad
    this.addressService.getAddresses()
      .pipe(takeUntil(this.destroy$))
      .subscribe(addresses => {
        this.direcciones = addresses;
        // No emitir inmediatamente para evitar ExpressionChangedAfterItHasBeenCheckedError
        // El componente padre puede suscribirse directamente al servicio si lo necesita
      });
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
    this.formSubmitted = false;
  }

  guardarDireccion(): void {
    this.formSubmitted = true;

    if (!this.validarFormulario()) {
      return;
    }
    this.guardando = true;

    if (this.editandoDireccion) {
        const data: any = {
          alias: this.nuevaDireccion.alias,
          nombreCompleto: this.nuevaDireccion.nombreCompleto,
          telefono: this.nuevaDireccion.telefono,
          calle: this.nuevaDireccion.calle,
          numeroExterior: this.nuevaDireccion.numeroExterior,
          numeroInterior: this.nuevaDireccion.numeroInterior, // opcional
          colonia: this.nuevaDireccion.colonia,
          ciudad: this.nuevaDireccion.ciudad,
          estado: this.nuevaDireccion.estado,
          codigoPostal: this.nuevaDireccion.codigoPostal,
          referencias: this.nuevaDireccion.referencias, // opcional
          esPrincipal: true
      }
      const direccionId = this.editandoDireccion._id;

      this.addressService.updateAddress(direccionId, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedAddress) => {
            // El servicio ya actualiza su BehaviorSubject, no necesitamos actualizar manualmente
            this.toastService.success('Dirección actualizada correctamente');
            this.cancelarFormulario();
            this.guardando = false;
          },
          error: (error) => {
            console.error('Error al actualizar dirección:', error);
            this.toastService.error('Error al actualizar la dirección', 'Por favor, intenta de nuevo.');
            this.guardando = false;
          }
        });
    } else {
      this.addressService.addNewAddress(this.nuevaDireccion)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newAddress) => {
            // El servicio ya actualiza su BehaviorSubject, no necesitamos actualizar manualmente
            this.toastService.success('Dirección guardada correctamente');
            this.cancelarFormulario();
            this.guardando = false;
          },
          error: (error) => {
            console.error('Error al guardar dirección:', error);
            this.toastService.error('Error al guardar la dirección', 'Por favor, intenta de nuevo.');
            this.guardando = false;
          }
        });
    }
  }

  /**
   * Valida todas las reglas personalizadas del formulario
   */
  private validarFormulario(): boolean {
    // Validar código postal: máximo 5 caracteres
    if (this.nuevaDireccion.codigoPostal && this.nuevaDireccion.codigoPostal.length > 5) {
      return false;
    }

    // Validar nombre: no acepta números
    if (this.nuevaDireccion.nombreCompleto && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.nuevaDireccion.nombreCompleto)) {
      return false;
    }

    // Validar número exterior: no permite letras
    if (this.nuevaDireccion.numeroExterior && !/^[0-9]+$/.test(this.nuevaDireccion.numeroExterior)) {
      return false;
    }

    // Validar alias: no puede empezar con números
    if (this.nuevaDireccion.alias && !/^[^0-9].*/.test(this.nuevaDireccion.alias)) {
      return false;
    }

    // Validar nombre del que recibe: no debe contener caracteres especiales
    if (this.nuevaDireccion.nombreCompleto && /[_.:;]/.test(this.nuevaDireccion.nombreCompleto)) {
      return false;
    }

    return true;
  }

  /**
   * Métodos de validación para usar en el template
   */
  isAliasValid(): boolean {
    return !this.nuevaDireccion.alias || /^[^0-9].*/.test(this.nuevaDireccion.alias);
  }

  isNombreCompletoValid(): boolean {
    return !this.nuevaDireccion.nombreCompleto || (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.nuevaDireccion.nombreCompleto) && !/[_.:;]/.test(this.nuevaDireccion.nombreCompleto));
  }

  isNumeroExteriorValid(): boolean {
    return !this.nuevaDireccion.numeroExterior || /^[0-9]+$/.test(this.nuevaDireccion.numeroExterior);
  }

  isCodigoPostalValid(): boolean {
    return !this.nuevaDireccion.codigoPostal || (/^[0-9]{1,5}$/.test(this.nuevaDireccion.codigoPostal) && this.nuevaDireccion.codigoPostal.length <= 5);
  }

  eliminarDireccion(direccion: IAddress): void {
    this.confirmationService.confirm({
      header: 'Eliminar dirección',
      message: '¿Estás seguro de que quieres eliminar esta dirección?',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'cm-confirm-btn-accept mt-2',
      rejectButtonStyleClass: 'cm-confirm-btn-reject mt-2',
      accept: () => {
        this.addressService.deleteAddress(direccion._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // El servicio ya actualiza su BehaviorSubject automáticamente
              this.toastService.success('Dirección eliminada correctamente');
            },
            error: (error) => {
              console.error('Error al eliminar dirección:', error);
              this.toastService.error('Error al eliminar la dirección', 'Por favor, intenta de nuevo.');
            }
          });
      }
    });
  }

  establecerComoPrincipal(direccion: IAddress): void {
    this.addressService.setAsPrimary(direccion._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // El servicio ya actualiza su BehaviorSubject automáticamente
          this.toastService.success('Dirección principal actualizada');
        },
        error: (error) => {
          console.error('Error setting as primary:', error);
          this.toastService.error('Error al establecer como principal', 'Por favor, intenta de nuevo.');
        }
      });
  }

  trackByDireccion(index: number, direccion: IAddress): string | number {
    return direccion._id;
  }
}
