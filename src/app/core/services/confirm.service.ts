import { Injectable } from '@angular/core';
import { ConfirmationService, ConfirmEventType } from 'primeng/api';

export interface ConfirmOptions {
  message: string;
  header?: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  accept?: () => void;
  reject?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  constructor(private confirmationService: ConfirmationService) {}

  confirm(options: ConfirmOptions) {
    this.confirmationService.confirm({
      message: options.message,
      header: options.header ?? 'Confirmación',
      icon: options.icon ?? 'pi pi-info-circle',
      acceptLabel: options.acceptLabel ?? 'Sí',
      rejectLabel: options.rejectLabel ?? 'No',
      acceptButtonStyleClass: 'p-button-success cm-confirm-btn-accept mt-2',
      rejectButtonStyleClass: 'p-button-danger cm-confirm-btn-reject mt-2',
      accept: options.accept,
      reject: options.reject
    });
  }
}
