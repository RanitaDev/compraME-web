import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of, map } from 'rxjs';
import { IAddress } from '../interfaces/checkout.interface';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/users`;

  private addressesSubject = new BehaviorSubject<IAddress[]>([]);
  public addresses$ = this.addressesSubject.asObservable();

  constructor() {
    // Cargar direcciones cuando el usuario cambie
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserAddresses(user.id);
      } else {
        this.addressesSubject.next([]);
      }
    });
  }

  /**
   * Cargar direcciones del usuario desde el backend
   */
  private loadUserAddresses(userId: string): void {
    this.http.get<IAddress[]>(`${this.apiUrl}/${userId}/addresses`)
      .pipe(
        catchError(error => {
          console.error('Error loading addresses:', error);
          return of([]);
        })
      )
      .subscribe(addresses => {
        // Mapear _id a id para compatibilidad con el frontend
        const mappedAddresses = addresses.map(addr => {
          const mapped = { ...addr };
          // Asegurar que siempre tenemos id
          if ((mapped as any)._id && !mapped._id) {
            mapped._id = (mapped as any)._id;
          }
          return mapped;
        });
        this.addressesSubject.next(mappedAddresses);
      });
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
    const user = this.authService.getCurrentUser();
    if (!user) return of(null);

    return this.http.get<IAddress>(`${this.apiUrl}/${user.id}/addresses/primary`)
      .pipe(
        map(addr => {
          const mapped = { ...addr };
          if ((mapped as any)._id && !mapped._id) {
            mapped._id = (mapped as any)._id;
          }
          return mapped;
        }),
        catchError(() => of(null))
      );
  }

  /**
   * Agregar nueva dirección
   */
  addNewAddress(address: Omit<IAddress, '_id'>): Observable<IAddress> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    return this.http.post<IAddress>(`${this.apiUrl}/${user.id}/addresses`, address)
      .pipe(
        map(addr => {
          const mapped = { ...addr };
          if ((mapped as any)._id && !mapped._id) {
            mapped._id = (mapped as any)._id;
          }
          return mapped;
        }),
        tap(newAddress => {
          const currentAddresses = this.addressesSubject.value;

          // Si es principal, desmarcar las demás
          if (newAddress.esPrincipal) {
            currentAddresses.forEach(addr => addr.esPrincipal = false);
          }

          this.addressesSubject.next([...currentAddresses, newAddress]);
        })
      );
  }

  /**
   * Actualizar dirección existente
   */
  updateAddress(id: number | string, address: Partial<IAddress>): Observable<IAddress> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    return this.http.put<IAddress>(`${this.apiUrl}/${user.id}/addresses/${id}`, address)
      .pipe(
        map(addr => {
          const mapped = { ...addr };
          if ((mapped as any)._id && !mapped._id) {
            mapped._id = (mapped as any)._id;
          }
          return mapped;
        }),
        tap(updatedAddress => {
          const currentAddresses = this.addressesSubject.value;
          const addressIndex = currentAddresses.findIndex(addr =>
            addr._id === id || (addr as any)._id === id
          );

          if (addressIndex !== -1) {
            // Si es principal, desmarcar las demás
            if (updatedAddress.esPrincipal) {
              currentAddresses.forEach(addr => {
                if (addr._id !== id) addr.esPrincipal = false;
              });
            }

            currentAddresses[addressIndex] = updatedAddress;
            this.addressesSubject.next([...currentAddresses]);
          }
        })
      );
  }

  /**
   * Marcar dirección como principal
   */
  setAsPrimary(id: number | string): Observable<IAddress> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    return this.http.patch<IAddress>(`${this.apiUrl}/${user.id}/addresses/${id}/primary`, {})
      .pipe(
        map(addr => {
          const mapped = { ...addr };
          if ((mapped as any)._id && !mapped._id) {
            mapped._id = (mapped as any)._id;
          }
          return mapped;
        }),
        tap(updatedAddress => {
          const currentAddresses = this.addressesSubject.value;

          // Desmarcar todas las demás
          currentAddresses.forEach(addr => {
            addr.esPrincipal = addr._id === id || (addr as any)._id === id;
          });

          this.addressesSubject.next([...currentAddresses]);
        })
      );
  }

  /**
   * Eliminar dirección
   */
  deleteAddress(id: number | string): Observable<boolean> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${user.id}/addresses/${id}`)
      .pipe(
        map(result => result.deleted),
        tap(() => {
          const currentAddresses = this.addressesSubject.value;
          const filteredAddresses = currentAddresses.filter(addr =>
            addr._id !== id && (addr as any)._id !== id
          );

          this.addressesSubject.next(filteredAddresses);
        })
      );
  }

  /**
   * Refrescar direcciones desde el backend
   */
  refreshAddresses(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.loadUserAddresses(user.id);
    }
  }
}
