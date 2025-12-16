import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Subject, takeUntil } from 'rxjs';
import { IOrders } from '../../../interfaces/orders.interface';
import { OrderDetailService } from '../../../services/order-detail.service';

@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail-modal.component.html'
})
export class OrderDetailModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private orderDetailService = inject(OrderDetailService);
  private destroy$ = new Subject<void>();

  public orden: IOrders | null = null;
  public isLoading = false;

  ngOnInit(): void {
    const data = this.config.data;
    if (data?.orden) {
      this.orden = data.orden;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public cerrar(): void {
    this.dialogRef.close();
  }

  public formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  public formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  public getStatusBadgeClass(estado: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'proof_uploaded': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-emerald-100 text-emerald-800',
      'canceled': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800'
    };
    return statusClasses[estado] || 'bg-gray-100 text-gray-800';
  }

  public getStatusText(estado: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente',
      'proof_uploaded': 'Comprobante Subido',
      'paid': 'Pagado',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'canceled': 'Cancelado',
      'expired': 'Expirado'
    };
    return statusTexts[estado] || 'Desconocido';
  }
}
