import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { IPaymentMethod } from '../interfaces/checkout.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private paymentMethodsSubject = new BehaviorSubject<IPaymentMethod[]>([]);
  public paymentMethods$ = this.paymentMethodsSubject.asObservable();

  // Métodos de pago base disponibles para todos
  private basePaymentMethods: IPaymentMethod[] = [
    {
      id: 1,
      tipo: 'tarjeta',
      nombre: 'Tarjeta de Crédito/Débito',
      descripcion: 'Visa, MasterCard, American Express',
      activo: true,
      tiempoEstimado: 'Inmediato'
    },
    {
      id: 2,
      tipo: 'oxxo',
      nombre: 'OXXO',
      descripcion: 'Paga en cualquier tienda OXXO',
      activo: true,
      tiempoEstimado: '24-48 hrs'
    },
    {
      id: 3,
      tipo: 'transferencia',
      nombre: 'Transferencia Bancaria',
      descripcion: 'SPEI, Banamex, BBVA, Santander',
      activo: true,
      tiempoEstimado: '2-4 hrs hábiles'
    }
  ];

  constructor(private authService: AuthService) {
    // Cargar métodos de pago cuando el usuario cambie
    this.authService.currentUser$.subscribe(user => {
      this.loadPaymentMethods(user);
    });
  }

  /**
   * Cargar métodos de pago para el usuario
   */
  private loadPaymentMethods(user: any): void {
    // En una aplicación real, aquí harías una llamada al backend
    // para obtener los métodos de pago del usuario + métodos disponibles

    let availableMethods = [...this.basePaymentMethods];

    // Agregar métodos adicionales según el tipo de usuario o región
    if (user?.rolId === 'cliente') {
      // Todos los métodos están disponibles para clientes
    } else if (user?.rolId === 'vendedor') {
      // Los vendedores podrían tener métodos adicionales o diferentes
      availableMethods.push({
        id: 4,
        tipo: 'cuenta_vendedor',
        nombre: 'Cuenta de Vendedor',
        descripcion: 'Pago directo a cuenta de vendedor',
        activo: true,
        tiempoEstimado: '1-2 hrs'
      });
    }

    // Filtrar métodos activos
    const activeMethods = availableMethods.filter(method => method.activo);
    
    this.paymentMethodsSubject.next(activeMethods);
  }

  /**
   * Obtener métodos de pago disponibles
   */
  getPaymentMethods(): Observable<IPaymentMethod[]> {
    return this.paymentMethods$;
  }

  /**
   * Obtener método de pago por ID
   */
  getPaymentMethodById(id: number): Observable<IPaymentMethod | null> {
    return new Observable(observer => {
      this.paymentMethods$.subscribe(methods => {
        const method = methods.find(m => m.id === id);
        observer.next(method || null);
      });
    });
  }

  /**
   * Obtener método de pago por defecto (generalmente tarjeta)
   */
  getDefaultPaymentMethod(): Observable<IPaymentMethod | null> {
    return new Observable(observer => {
      this.paymentMethods$.subscribe(methods => {
        const defaultMethod = methods.find(m => m.tipo === 'tarjeta') || methods[0];
        observer.next(defaultMethod || null);
      });
    });
  }

  /**
   * Verificar si un método de pago está disponible
   */
  isPaymentMethodAvailable(tipo: string): Observable<boolean> {
    return new Observable(observer => {
      this.paymentMethods$.subscribe(methods => {
        const available = methods.some(m => m.tipo === tipo && m.activo);
        observer.next(available);
      });
    });
  }

  /**
   * Obtener información de procesamiento para un método específico
   */
  getProcessingInfo(methodId: number): {
    requiresAdditionalData: boolean;
    processingSteps: string[];
    estimatedTime: string;
  } {
    const method = this.paymentMethodsSubject.value.find(m => m.id === methodId);
    
    if (!method) {
      return {
        requiresAdditionalData: false,
        processingSteps: ['Método no encontrado'],
        estimatedTime: 'Desconocido'
      };
    }

    switch (method.tipo) {
      case 'tarjeta':
        return {
          requiresAdditionalData: true,
          processingSteps: [
            'Validación de datos de tarjeta',
            'Autorización bancaria',
            'Confirmación del pago'
          ],
          estimatedTime: method.tiempoEstimado || 'Inmediato'
        };

      case 'oxxo':
        return {
          requiresAdditionalData: false,
          processingSteps: [
            'Generación de código de barras',
            'Envío de referencia de pago',
            'Espera de confirmación de OXXO'
          ],
          estimatedTime: method.tiempoEstimado || '24-48 hrs'
        };

      case 'transferencia':
        return {
          requiresAdditionalData: false,
          processingSteps: [
            'Generación de datos bancarios',
            'Envío de información SPEI',
            'Validación de transferencia'
          ],
          estimatedTime: method.tiempoEstimado || '2-4 hrs hábiles'
        };

      default:
        return {
          requiresAdditionalData: false,
          processingSteps: ['Procesamiento estándar'],
          estimatedTime: method.tiempoEstimado || 'Variable'
        };
    }
  }

  /**
   * Simular guardado de método de pago personalizado del usuario
   */
  saveUserPaymentMethod(method: Omit<IPaymentMethod, 'id'>): Observable<IPaymentMethod> {
    const currentMethods = this.paymentMethodsSubject.value;
    const newMethod: IPaymentMethod = {
      ...method,
      id: Math.max(...currentMethods.map(m => m.id), 0) + 1
    };

    const updatedMethods = [...currentMethods, newMethod];
    this.paymentMethodsSubject.next(updatedMethods);

    // En una aplicación real, esto se guardaría en el backend
    return of(newMethod);
  }
}
