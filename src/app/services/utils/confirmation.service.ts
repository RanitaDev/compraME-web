import { Injectable } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable, Subject } from 'rxjs';
import { IConfirmacionOpciones, IConfirmacionResultado } from '../../interfaces/utils/confirmation.interface';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

// import { ConfirmationDialogComponent } from '../components/confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private ref: DynamicDialogRef | null = null;

  constructor(private dialogService: DialogService) {}

  /**
   * Abre el diálogo de confirmación y devuelve un Observable
   * Uso: this.confirmationService.confirmar({ titulo, descripcion }).subscribe(...)
   */
  confirmar(opciones: IConfirmacionOpciones): Observable<IConfirmacionResultado> {
    const subject = new Subject<IConfirmacionResultado>();

    // Configuración por defecto
    const opcionesCompletas: IConfirmacionOpciones = {
      textoConfirmar: 'Confirmar',
      textoCancelar: 'Cancelar',
      tipoConfirmacion: 'warning',
      mostrarIcono: true,
      anchoModal: '450px',
      ...opciones
    };

    // Abrir el diálogo usando PrimeNG
    this.ref = this.dialogService.open(ConfirmationDialogComponent, {
      header: opcionesCompletas.titulo,
      width: opcionesCompletas.anchoModal,
      modal: true,
      dismissableMask: true,
      data: opcionesCompletas
    });

    // Escuchar cuando se cierra el diálogo
    this.ref.onClose.subscribe((resultado: IConfirmacionResultado | undefined) => {
      if (resultado) {
        subject.next(resultado);
      } else {
        // Si se cierra sin resultado, se considera cancelado
        subject.next({ confirmado: false, cancelado: true });
      }
      subject.complete();
    });

    return subject.asObservable();
  }

  /**
   * Métodos de conveniencia para casos comunes
   */

  // Confirmación de eliminación
  confirmarEliminacion(mensaje: string = '¿Estás seguro de eliminar este elemento?'): Observable<IConfirmacionResultado> {
    return this.confirmar({
      titulo: 'Confirmar Eliminación',
      descripcion: mensaje,
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      tipoConfirmacion: 'danger'
    });
  }

  // Confirmación de salida/descarte
  confirmarSalida(mensaje: string = '¿Estás seguro de salir? Los cambios no guardados se perderán.'): Observable<IConfirmacionResultado> {
    return this.confirmar({
      titulo: 'Confirmar Salida',
      descripcion: mensaje,
      textoConfirmar: 'Sí, salir',
      textoCancelar: 'Continuar editando',
      tipoConfirmacion: 'warning'
    });
  }

  // Confirmación de guardado
  confirmarGuardado(mensaje: string = '¿Deseas guardar los cambios?'): Observable<IConfirmacionResultado> {
    return this.confirmar({
      titulo: 'Guardar Cambios',
      descripcion: mensaje,
      textoConfirmar: 'Guardar',
      textoCancelar: 'Cancelar',
      tipoConfirmacion: 'success'
    });
  }

  // Confirmación genérica de acción
  confirmarAccion(titulo: string, descripcion: string): Observable<IConfirmacionResultado> {
    return this.confirmar({
      titulo,
      descripcion,
      tipoConfirmacion: 'info'
    });
  }
}
