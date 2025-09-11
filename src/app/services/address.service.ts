import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { IAddress } from '../interfaces/checkout.interface';
import { AuthService } from './auth.service';
import { IUser } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private addressesSubject = new BehaviorSubject<IAddress[]>([]);
  public addresses$ = this.addressesSubject.asObservable();

  constructor(private authService: AuthService) {
    // Cargar direcciones cuando el usuario cambie
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserAddresses(user);
      } else {
        this.addressesSubject.next([]);
      }
    });
  }

  /**
   * Cargar direcciones del usuario
   */
  private loadUserAddresses(user: IUser): void {
    // Crear dirección principal basada en datos del usuario
    const primaryAddress: IAddress = {
      id: 1,
      alias: 'Principal',
      nombreCompleto: user.nombre,
      telefono: user.telefono || '477-000-0000',
      calle: user.direccion || 'Dirección no especificada',
      numeroExterior: '1',
      numeroInterior: '',
      colonia: 'Centro',
      ciudad: 'León',
      estado: 'Guanajuato',
      codigoPostal: '37000',
      referencias: '',
      esPrincipal: true
    };

    // En una aplicación real, aquí harías una llamada al backend
    // Por ahora, simulamos con la dirección del usuario + algunas adicionales
    const userAddresses: IAddress[] = [primaryAddress];

    // Agregar direcciones adicionales solo si hay datos del usuario
    if (user.direccion && user.direccion !== 'Dirección no especificada') {
      // Dividir la dirección si tiene formato completo
      const addressParts = this.parseAddress(user.direccion);
      primaryAddress.calle = addressParts.calle;
      primaryAddress.numeroExterior = addressParts.numeroExterior;
      primaryAddress.colonia = addressParts.colonia;
      primaryAddress.ciudad = addressParts.ciudad;
      primaryAddress.estado = addressParts.estado;
      primaryAddress.codigoPostal = addressParts.codigoPostal;
    }

    this.addressesSubject.next(userAddresses);
  }

  /**
   * Parsear dirección completa en componentes
   */
  private parseAddress(fullAddress: string): {
    calle: string;
    numeroExterior: string;
    colonia: string;
    ciudad: string;
    estado: string;
    codigoPostal: string;
  } {
    // Implementación básica para parsear direcciones
    // En una aplicación real, esto sería más sofisticado
    return {
      calle: fullAddress.split(',')[0]?.trim() || fullAddress,
      numeroExterior: '1',
      colonia: 'Centro',
      ciudad: 'León',
      estado: 'Guanajuato',
      codigoPostal: '37000'
    };
  }

  /**
   * Obtener todas las direcciones del usuario
   */
  getAddresses(): Observable<IAddress[]> {
    return this.addresses$;
  }

  /**
   * Obtener dirección principal
   */
  getPrimaryAddress(): Observable<IAddress | null> {
    return new Observable(observer => {
      this.addresses$.subscribe(addresses => {
        const primary = addresses.find(addr => addr.esPrincipal);
        observer.next(primary || null);
      });
    });
  }

  /**
   * Agregar nueva dirección
   */
  addNewAddress(address: Omit<IAddress, 'id'>): Observable<IAddress> {
    const currentAddresses = this.addressesSubject.value;
    const newAddress: IAddress = {
      ...address,
      id: Math.max(...currentAddresses.map(a => a.id), 0) + 1
    };

    // Si es principal, quitar principal de las demás
    if (newAddress.esPrincipal) {
      currentAddresses.forEach(addr => addr.esPrincipal = false);
    }

    const updatedAddresses = [...currentAddresses, newAddress];
    this.addressesSubject.next(updatedAddresses);

    // En una aplicación real, aquí harías una llamada al backend
    return of(newAddress);
  }

  /**
   * Actualizar dirección existente
   */
  updateAddress(id: number, address: Partial<IAddress>): Observable<IAddress> {
    const currentAddresses = this.addressesSubject.value;
    const addressIndex = currentAddresses.findIndex(addr => addr.id === id);

    if (addressIndex === -1) {
      throw new Error('Dirección no encontrada');
    }

    const updatedAddress = { ...currentAddresses[addressIndex], ...address };
    
    // Si es principal, quitar principal de las demás
    if (updatedAddress.esPrincipal) {
      currentAddresses.forEach(addr => {
        if (addr.id !== id) addr.esPrincipal = false;
      });
    }

    currentAddresses[addressIndex] = updatedAddress;
    this.addressesSubject.next([...currentAddresses]);

    return of(updatedAddress);
  }

  /**
   * Eliminar dirección
   */
  deleteAddress(id: number): Observable<boolean> {
    const currentAddresses = this.addressesSubject.value;
    const filteredAddresses = currentAddresses.filter(addr => addr.id !== id);
    
    // Si se eliminó la dirección principal, hacer principal la primera
    const hadPrimary = currentAddresses.some(addr => addr.id === id && addr.esPrincipal);
    if (hadPrimary && filteredAddresses.length > 0) {
      filteredAddresses[0].esPrincipal = true;
    }

    this.addressesSubject.next(filteredAddresses);
    return of(true);
  }

  /**
   * Generar dirección rápida desde datos del usuario
   */
  createQuickAddressFromUser(): IAddress | null {
    const user = this.authService.getCurrentUser();
    if (!user) return null;

    return {
      id: Date.now(), // ID temporal
      alias: 'Dirección rápida',
      nombreCompleto: user.nombre,
      telefono: user.telefono || '477-000-0000',
      calle: user.direccion || 'Calle sin especificar',
      numeroExterior: '1',
      numeroInterior: '',
      colonia: 'Centro',
      ciudad: 'León',
      estado: 'Guanajuato',
      codigoPostal: '37000',
      referencias: 'Dirección generada automáticamente',
      esPrincipal: false
    };
  }
}
