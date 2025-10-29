import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { IBankAccount, IBankPaymentData, IBankPaymentResult, IBankInstructions } from '../interfaces/bank-payment.interface';
import { OrderService } from './order.service';
import { ToastService } from '../core/services/toast.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private readonly apiUrl = `${environment.apiUrl}/bank`;

  constructor(
    private http: HttpClient,
    private orderService: OrderService,
    private toastService: ToastService
  ) {}

  getBankAccounts(): Observable<IBankAccount[]> {
    // Datos mock de respaldo mientras el backend no esté implementado
    const mockAccounts: IBankAccount[] = [
      {
        id: 1,
        banco: 'BBVA México',
        titular: 'CompraMe S.A. de C.V.',
        numeroCuenta: '0123456789',
        clabe: '012180001234567890',
        tipo: 'transferencia',
        activa: true,
        descripcion: 'Transferencia SPEI - Procesamiento inmediato'
      },
      {
        id: 2,
        banco: 'Santander México',
        titular: 'CompraMe S.A. de C.V.',
        numeroCuenta: '9876543210',
        tipo: 'deposito',
        activa: true,
        descripcion: 'Depósito en sucursal - Verificación en 24 hrs'
      },
      {
        id: 3,
        banco: 'OXXO',
        titular: 'CompraMe S.A. de C.V.',
        numeroCuenta: 'OXXO-PAY',
        tipo: 'oxxo',
        activa: true,
        descripcion: 'Pago en tiendas OXXO - Verificación en 24 hrs'
      }
    ];

    return this.http.get<IBankAccount[]>(`${this.apiUrl}/bank-accounts`).pipe(
      catchError((error) => {
        console.warn('Backend no disponible, usando datos mock:', error);
        // Si el backend falla, usar datos mock
        return of(mockAccounts);
      })
    );
  }

  generatePaymentInstructions(orderId: string, amount: number, paymentType: 'deposito' | 'transferencia' | 'oxxo'): Observable<IBankInstructions> {
    // Generar número de referencia y fecha de expiración
    const referenceNumber = `CR${Date.now().toString().slice(-8)}${orderId.slice(-4)}`;
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 72);

    // Obtener las cuentas bancarias del backend y generar instrucciones
    return this.getBankAccounts().pipe(
      map((accounts) => {
        const account = accounts.find(acc => acc.tipo === paymentType && acc.activa);
        if (!account) {
          throw new Error('No hay cuenta disponible para este método de pago');
        }

        const instructions: IBankInstructions = {
          tipo: paymentType,
          cuenta: account,
          numeroReferencia: referenceNumber,
          monto: amount,
          fechaLimite: expiration,
          instrucciones: this.getInstructionsByType(paymentType, account)
        };

        return instructions;
      }),
      catchError((error) => {
        console.error('Error generating payment instructions:', error);
        this.toastService.error('Error', 'No se pudieron generar las instrucciones de pago');
        return throwError(() => error);
      })
    );
  }

  private getInstructionsByType(type: 'deposito' | 'transferencia' | 'oxxo', account: IBankAccount): string[] {
    if (type === 'deposito') {
      return [
        'Ve a cualquier sucursal bancaria',
        `Deposita a la cuenta ${account.numeroCuenta}`,
        'Solicita tu comprobante de depósito',
        'Sube una foto clara del comprobante',
        'Verificaremos tu pago en máximo 24 horas'
      ];
    } else if (type === 'transferencia') {
      return [
        'Ingresa a tu banca en línea o app móvil',
        `Transfiere a la CLABE: ${account.clabe}`,
        'Usa el número de referencia proporcionado',
        'Guarda el comprobante de transferencia',
        'Sube una foto clara del comprobante'
      ];
    } else {
      return [
        'Ve a cualquier tienda OXXO',
        'Dile al cajero "Quiero hacer un pago de servicios"',
        'Proporciona el número de referencia',
        'Paga el monto exacto en efectivo',
        'Solicita tu comprobante de pago',
        'Sube una foto clara del ticket'
      ];
    }
  }

  uploadPaymentProof(paymentData: IBankPaymentData): Observable<IBankPaymentResult> {
    return this.orderService.uploadPaymentProof(
      paymentData.orderId,
      paymentData.comprobante.archivo,
      {
        referenceNumber: paymentData.numeroReferencia,
        amount: paymentData.monto,
        paymentMethod: paymentData.comprobante.metodoPago,
        transactionDate: paymentData.comprobante.fechaTransaccion
      }
    ).pipe(
      switchMap((uploadResponse: { success: boolean; proofUrl: string }) => {
        return this.orderService.updateOrderStatus(paymentData.orderId, 'proof_uploaded', {
          paymentProofUrl: uploadResponse.proofUrl,
          numeroReferencia: paymentData.numeroReferencia
        }).pipe(
          map(() => ({
            success: true,
            message: 'Comprobante recibido correctamente. Tu pago será verificado en las próximas 24 horas.',
            paymentId: `PAY_${Date.now()}`
          }))
        );
      }),
      catchError(error => {
        console.error('Error uploading payment proof:', error);
        return of({
          success: false,
          message: error.message || 'Error al subir el comprobante. Intenta nuevamente.',
          paymentId: undefined
        });
      })
    );
  }

  validatePaymentProof(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (file.size > maxSize) {
      return { valid: false, error: 'El archivo debe ser menor a 5MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Solo se permiten archivos JPG, PNG o PDF' };
    }

    return { valid: true };
  }
}
