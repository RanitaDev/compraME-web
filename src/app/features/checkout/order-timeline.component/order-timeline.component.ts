import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IOrders } from '../../../interfaces/orders.interface';

interface TimelineEvent {
  date: Date;
  time: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  status: 'completed' | 'pending' | 'processing';
}

@Component({
  selector: 'app-order-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-timeline.component.html',
  styleUrls: ['./order-timeline.component.css']
})
export class OrderTimelineComponent implements OnInit {
  @Input() orden: IOrders | null = null;

  public timelineEvents: TimelineEvent[] = [];

  ngOnInit(): void {
    if (this.orden) {
      this.generateTimeline();
    }
  }

  /**
   * Generar timeline de eventos basado en el estado de la orden
   */
  private generateTimeline(): void {
    if (!this.orden) return;

    this.timelineEvents = [];

    // 1. Orden Creada (siempre)
    if (this.orden.createdAt) {
      this.timelineEvents.push({
        date: new Date(this.orden.createdAt),
        time: this.formatTime(new Date(this.orden.createdAt)),
        title: 'Orden Creada',
        description: `Tu orden #${this.orden.numeroOrden} ha sido creada exitosamente`,
        icon: 'pi-check-circle',
        iconColor: 'text-green-600',
        bgColor: 'bg-green-100',
        status: 'completed'
      });
    }

    // 2. Comprobante Subido (si aplica)
    if (this.orden.estado === 'proof_uploaded' ||
        this.orden.estado === 'paid' ||
        this.orden.estado === 'shipped' ||
        this.orden.estado === 'delivered' ||
        this.orden.comprobanteUrl) {

      this.timelineEvents.push({
        date: this.orden.uploadedFileDate ? new Date(this.orden.uploadedFileDate) : new Date(),
        time: this.orden.uploadedFileDate ? this.formatTime(new Date(this.orden.uploadedFileDate)) : '--:--',
        title: 'Comprobante de Pago Subido',
        description: 'Tu comprobante de pago ha sido recibido y está siendo verificado',
        icon: 'pi-file-check',
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-100',
        status: this.orden.estado === 'proof_uploaded' ? 'processing' : 'completed'
      });
    }

    // 3. Pago Confirmado (si aplica)
    if (this.orden.estado === 'paid' ||
        this.orden.estado === 'shipped' ||
        this.orden.estado === 'delivered') {

      this.timelineEvents.push({
        date: this.orden.fechaPago ? new Date(this.orden.fechaPago) : new Date(),
        time: this.orden.fechaPago ? this.formatTime(new Date(this.orden.fechaPago)) : '--:--',
        title: 'Pago Confirmado',
        description: 'Tu pago ha sido verificado y confirmado por el administrador',
        icon: 'pi-check',
        iconColor: 'text-green-600',
        bgColor: 'bg-green-100',
        status: 'completed'
      });
    }

    // 4. Preparando Envío (si aplica)
    if (this.orden.estado === 'shipped' || this.orden.estado === 'delivered') {
      this.timelineEvents.push({
        date: this.orden.fechaPreparacion ? new Date(this.orden.fechaPreparacion) : new Date(),
        time: this.orden.fechaPreparacion ? this.formatTime(new Date(this.orden.fechaPreparacion)) : '--:--',
        title: 'Preparando tu Envío',
        description: 'Tu orden está siendo preparada para ser enviada',
        icon: 'pi-box',
        iconColor: 'text-orange-600',
        bgColor: 'bg-orange-100',
        status: 'completed'
      });
    }

    // 5. En Tránsito (si aplica)
    if (this.orden.estado === 'shipped' || this.orden.estado === 'delivered') {
      this.timelineEvents.push({
        date: this.orden.fechaEnvio ? new Date(this.orden.fechaEnvio) : new Date(),
        time: this.orden.fechaEnvio ? this.formatTime(new Date(this.orden.fechaEnvio)) : '--:--',
        title: 'En Tránsito',
        description: `Tu paquete está en camino a ${this.orden.direccionEnvio?.ciudad || 'tu domicilio'}`,
        icon: 'pi-truck',
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-100',
        status: 'completed'
      });
    }

    // 6. Entregada (si aplica)
    if (this.orden.estado === 'delivered') {
      this.timelineEvents.push({
        date: this.orden.fechaEntrega ? new Date(this.orden.fechaEntrega) : new Date(),
        time: this.orden.fechaEntrega ? this.formatTime(new Date(this.orden.fechaEntrega)) : '--:--',
        title: 'Entregada',
        description: 'Tu orden ha sido entregada exitosamente',
        icon: 'pi-check-circle',
        iconColor: 'text-green-600',
        bgColor: 'bg-green-100',
        status: 'completed'
      });
    }

    // 7. Próximo paso (según estado actual)
    if (this.orden.estado === 'pending') {
      this.timelineEvents.push({
        date: this.orden.fechaLimitePago ? new Date(this.orden.fechaLimitePago) : new Date(),
        time: this.orden.fechaLimitePago ? this.formatTime(new Date(this.orden.fechaLimitePago)) : '--:--',
        title: 'Límite de Pago',
        description: 'Fecha límite para completar tu pago',
        icon: 'pi-clock',
        iconColor: 'text-red-600',
        bgColor: 'bg-red-100',
        status: 'pending'
      });
    }

    if (this.orden.estado === 'proof_uploaded') {
      this.timelineEvents.push({
        date: new Date(),
        time: '--:--',
        title: 'Verificando Pago',
        description: 'El administrador está revisando tu comprobante de pago',
        icon: 'pi-hourglass',
        iconColor: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        status: 'processing'
      });
    }

    // Cancelada (si aplica)
    if (this.orden.estado === 'canceled') {
      this.timelineEvents.push({
        date: this.orden.updatedAt ? new Date(this.orden.updatedAt) : new Date(),
        time: this.orden.updatedAt ? this.formatTime(new Date(this.orden.updatedAt)) : '--:--',
        title: 'Orden Cancelada',
        description: `Motivo: ${this.orden.razonCancelacion || 'No especificado'}`,
        icon: 'pi-times-circle',
        iconColor: 'text-red-600',
        bgColor: 'bg-red-100',
        status: 'completed'
      });
    }

    // Expirada (si aplica)
    if (this.orden.estado === 'expired') {
      this.timelineEvents.push({
        date: this.orden.fechaLimitePago ? new Date(this.orden.fechaLimitePago) : new Date(),
        time: this.orden.fechaLimitePago ? this.formatTime(new Date(this.orden.fechaLimitePago)) : '--:--',
        title: 'Orden Expirada',
        description: 'El tiempo para completar el pago ha expirado',
        icon: 'pi-exclamation-circle',
        iconColor: 'text-red-600',
        bgColor: 'bg-red-100',
        status: 'completed'
      });
    }

    // Ordenar eventos por fecha
    this.timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Formatear hora de evento
   */
  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  /**
   * Formatear fecha de evento
   */
  public formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Obtener ícono según estado de evento
   */
  public getEventIcon(event: TimelineEvent): string {
    return event.icon;
  }

  /**
   * Obtener clase de color para el evento
   */
  public getEventClass(event: TimelineEvent): string {
    return event.bgColor;
  }

  /**
   * Obtener clase de color de ícono
   */
  public getIconColorClass(event: TimelineEvent): string {
    return event.iconColor;
  }

  /**
   * Verificar si es el último evento
   */
  public isLastEvent(index: number): boolean {
    return index === this.timelineEvents.length - 1;
  }
}
