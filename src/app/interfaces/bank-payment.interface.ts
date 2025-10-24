export interface IBankAccount {
  id: number;
  banco: string;
  titular: string;
  numeroCuenta: string;
  clabe?: string;
  tipo: 'deposito' | 'transferencia' | 'oxxo';
  activa: boolean;
  descripcion: string;
}

export interface IPaymentProof {
  archivo: File;
  numeroReferencia: string;
  fechaTransaccion: Date;
  monto: number;
  metodoPago: 'deposito' | 'transferencia' | 'oxxo';
}

export interface IBankPaymentData {
  orderId: string;
  cuentaDestino: IBankAccount;
  numeroReferencia: string;
  monto: number;
  comprobante: IPaymentProof;
}

export interface IBankPaymentResult {
  success: boolean;
  message: string;
  paymentId?: string;
  error?: string;
}

export interface IBankInstructions {
  tipo: 'deposito' | 'transferencia' | 'oxxo';
  cuenta: IBankAccount;
  numeroReferencia: string;
  monto: number;
  fechaLimite: Date;
  instrucciones: string[];
}
