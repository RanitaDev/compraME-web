// Opciones para configurar el diálogo de confirmación
export interface IConfirmacionOpciones {
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  mostrarIcono?: boolean;
  tipoConfirmacion?: 'info' | 'warning' | 'danger' | 'success';
  anchoModal?: string;
}

export interface IConfirmacionResultado {
  confirmado: boolean;
  cancelado: boolean;
}
