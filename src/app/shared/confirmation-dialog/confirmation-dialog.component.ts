import { IConfirmacionOpciones, IConfirmacionResultado } from './../../interfaces/utils/confirmation.interface';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent implements OnInit {

  // Opciones del diálogo
  opciones: IConfirmacionOpciones = {
    titulo: 'Confirmar',
    descripcion: '¿Estás seguro?',
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    tipoConfirmacion: 'warning',
    mostrarIcono: true
  };

  // Estado del componente
  procesando = false;

  constructor(
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig
  ) {}

  ngOnInit() {
    // Obtener opciones del config de PrimeNG
    if (this.config.data) {
      this.opciones = { ...this.opciones, ...this.config.data };
    }
  }

  /**
   * Maneja la confirmación
   */
  confirmar(): void {
    const resultado: IConfirmacionResultado = {
      confirmado: true,
      cancelado: false
    };

    this.ref.close(resultado);
  }

  /**
   * Maneja la cancelación
   */
  cancelar(): void {
    const resultado: IConfirmacionResultado = {
      confirmado: false,
      cancelado: true
    };

    this.ref.close(resultado);
  }
}
