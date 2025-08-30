import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export interface ToastOptions {
  detail?: string;
  life?: number; // duración en milisegundos
  sticky?: boolean; // si no se cierra automáticamente
  closable?: boolean; // si muestra botón de cerrar
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private messageService: MessageService) {}

  /**
   * Muestra un toast de éxito
   */
  success(summary: string, detail?: string, options?: ToastOptions) {
    this.messageService.add({
      severity: 'success',
      summary: summary,
      detail: detail || '',
      life: options?.life || 5000,
      sticky: options?.sticky || false,
      closable: options?.closable !== false, // por defecto true
      key: 'main'
    });
  }

  /**
   * Muestra un toast de error
   */
  error(summary: string, detail?: string, options?: ToastOptions) {
    this.messageService.add({
      severity: 'error',
      summary: summary,
      detail: detail || '',
      life: options?.life || 8000, // errores duran más tiempo
      sticky: options?.sticky || false,
      closable: options?.closable !== false,
      key: 'main'
    });
  }

  /**
   * Muestra un toast de advertencia
   */
  warning(summary: string, detail?: string, options?: ToastOptions) {
    this.messageService.add({
      severity: 'warn',
      summary: summary,
      detail: detail || '',
      life: options?.life || 6000,
      sticky: options?.sticky || false,
      closable: options?.closable !== false,
      key: 'main'
    });
  }

  /**
   * Muestra un toast informativo
   */
  info(summary: string, detail?: string, options?: ToastOptions) {
    this.messageService.add({
      severity: 'info',
      summary: summary,
      detail: detail || '',
      life: options?.life || 5000,
      sticky: options?.sticky || false,
      closable: options?.closable !== false,
      key: 'main'
    });
  }

  /**
   * Muestra un toast personalizado
   */
  custom(severity: 'success' | 'error' | 'warn' | 'info', summary: string, detail?: string, options?: ToastOptions) {
    this.messageService.add({
      severity: severity,
      summary: summary,
      detail: detail || '',
      life: options?.life || 5000,
      sticky: options?.sticky || false,
      closable: options?.closable !== false,
      key: 'main'
    });
  }

  /**
   * Limpia todos los toasts
   */
  clear() {
    this.messageService.clear('main');
  }

  /**
   * Métodos de conveniencia para casos comunes
   */

  // Toast rápidos sin detalle
  quickSuccess(message: string) {
    this.success(message, '', { life: 3000 });
  }

  quickError(message: string) {
    this.error(message, '', { life: 5000 });
  }

  quickInfo(message: string) {
    this.info(message, '', { life: 3000 });
  }

  // Toast para operaciones CRUD
  created(entityName: string = 'Elemento') {
    this.success('Creado exitosamente', `${entityName} ha sido creado correctamente`);
  }

  updated(entityName: string = 'Elemento') {
    this.success('Actualizado exitosamente', `${entityName} ha sido actualizado correctamente`);
  }

  deleted(entityName: string = 'Elemento') {
    this.success('Eliminado exitosamente', `${entityName} ha sido eliminado correctamente`);
  }

  // Toast para errores comunes
  serverError(message: string = 'Error del servidor') {
    this.error('Error del servidor', message, { life: 8000 });
  }

  validationError(message: string = 'Datos inválidos') {
    this.warning('Error de validación', message);
  }

  notFound(entityName: string = 'Elemento') {
    this.warning('No encontrado', `${entityName} no encontrado`);
  }

  // Toast para procesos largos
  loading(message: string = 'Procesando...') {
    this.info('Cargando', message, { sticky: true });
  }

  loadingComplete(message: string = 'Completado') {
    this.clear(); // limpiar el loading
    this.success('Completado', message);
  }
}
