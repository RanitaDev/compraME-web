import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { IBankAccount, IBankPaymentData, IBankPaymentResult, IBankInstructions } from '../interfaces/bank-payment.interface';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private readonly apiUrl = '/api/bank';

  constructor(private http: HttpClient) {}

  getBankAccounts(): Observable<IBankAccount[]> {
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
    return of(mockAccounts);
  }

  generatePaymentInstructions(orderId: string, amount: number, paymentType: 'deposito' | 'transferencia' | 'oxxo'): Observable<IBankInstructions> {
    const referenceNumber = `CR${Date.now().toString().slice(-8)}${orderId.slice(-4)}`;
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 72);

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

    const account = mockAccounts.find(acc => acc.tipo === paymentType && acc.activa);
    if (!account) throw new Error('No hay cuenta disponible para este método');

    const instructions: IBankInstructions = {
      tipo: paymentType,
      cuenta: account,
      numeroReferencia: referenceNumber,
      monto: amount,
      fechaLimite: expiration,
      instrucciones: this.getInstructionsByType(paymentType, account)
    };

    return of(instructions);
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
    const formData = new FormData();
    formData.append('orderId', paymentData.orderId);
    formData.append('numeroReferencia', paymentData.numeroReferencia);
    formData.append('monto', paymentData.monto.toString());
    formData.append('comprobante', paymentData.comprobante.archivo);
    formData.append('metodoPago', paymentData.comprobante.metodoPago);
    formData.append('fechaTransaccion', paymentData.comprobante.fechaTransaccion.toISOString());

    return new Observable<IBankPaymentResult>(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Comprobante recibido correctamente',
          paymentId: `PAY_${Date.now()}`
        });
        observer.complete();
      }, 2000);
    });
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
