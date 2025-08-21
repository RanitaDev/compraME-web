import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderDataService {
  private orderIdSubject = new BehaviorSubject<string | null>(null);
  public orderId$ = this.orderIdSubject.asObservable();

  setOrderId(orderId: string): void {
    this.orderIdSubject.next(orderId);
  }

  getOrderId(): string | null {
    return this.orderIdSubject.value;
  }

  clearOrderId(): void {
    this.orderIdSubject.next(null);
  }
}
