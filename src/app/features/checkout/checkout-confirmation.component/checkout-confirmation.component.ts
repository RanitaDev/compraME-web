import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../../services';
import { OrderCheckoutService } from '../../../services/order-checkout.service';
import { CheckoutStateService } from '../../../services/checkout-state.service';
import { AuthService } from '../../../services/auth.service';
import { AddressService } from '../../../services/address.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { IAddress, ICheckoutSummary } from '../../../interfaces/checkout.interface';
import { ICartSummary } from '../../../interfaces/cart.interface';
import { PrimeNgModule } from '../../../primeng.module';

@Component({
  selector: 'app-checkout-confirmation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModule],
  templateUrl: './checkout-confirmation.component.html',
  styleUrls: ['./checkout-confirmation.component.css']
})
export class CheckoutConfirmationComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  public orderCheckoutService = inject(OrderCheckoutService);
  private checkoutState = inject(CheckoutStateService);
  private authService = inject(AuthService);
  private addressService = inject(AddressService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Formularios
  addressForm!: FormGroup;
  paymentForm!: FormGroup;

  // Datos
  checkoutSummary: ICheckoutSummary | null = null;
  userAddresses: any[] = [];
  paymentMethods: any[] = [
    { tipo: 'transferencia', nombre: 'Transferencia Bancaria', icono: 'pi-building' },
    { tipo: 'deposito', nombre: 'Depósito Bancario', icono: 'pi-money-bill' },
    { tipo: 'oxxo', nombre: 'Pago en OXXO', icono: 'pi-shopping-bag' },
    { tipo: 'tarjeta', nombre: 'Tarjeta de Crédito/Débito', icono: 'pi-credit-card' },
    { tipo: 'paypal', nombre: 'PayPal', icono: 'pi-paypal' }
  ];

  isLoading = false;
  isSubmitting = false;

  ngOnInit(): void {
    this.initializeForms();
    this.loadCheckoutData();
    this.loadUserAddresses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializar formularios
   */
  private initializeForms(): void {
    this.addressForm = this.fb.group({
      selectedAddressId: ['', Validators.required],
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10,}$/)]],
      calle: ['', Validators.required],
      numeroExterior: ['', Validators.required],
      numeroInterior: [''],
      colonia: ['', Validators.required],
      ciudad: ['', Validators.required],
      estado: ['', Validators.required],
      codigoPostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      referencias: ['']
    });

    this.paymentForm = this.fb.group({
      metodoPago: ['', Validators.required]
    });
  }

  /**
   * Cargar datos del checkout (carrito)
   */
  private loadCheckoutData(): void {
    this.isLoading = true;
    this.cartService.obtenerResumenCompleto()
      .then((summary) => {
        this.checkoutSummary = this.mapCartSummaryToCheckout(summary);
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error cargando resumen del carrito:', error);
        this.toastService.error('Error al cargar el carrito');
        this.isLoading = false;
      });
  }

  /**
   * Adaptar el resumen de carrito (backend) al contrato de checkout
   */
  private mapCartSummaryToCheckout(summary: ICartSummary): ICheckoutSummary {
    const items = summary.items.map(item => ({
      idProducto: (item.producto as any)._id || (item.producto as any).productoID,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precio: item.producto.precio,
      subtotal: item.producto.precio * item.cantidad
    }));

    return {
      items,
      subtotal: summary.subtotal,
      impuestos: summary.impuestos,
      envio: summary.envio,
      total: summary.total,
      descuentos: 0
    };
  }

  /**
   * Cargar direcciones del usuario
   */
  private loadUserAddresses(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.addressService.getAddresses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses: IAddress[]) => {
          this.userAddresses = addresses || [];
          if (addresses.length > 0) {
            // Seleccionar la primera dirección por defecto
            this.addressForm.patchValue({
              selectedAddressId: addresses[0]._id
            });
            this.fillAddressForm(addresses[0]);
          }
        },
        error: (error) => {
          console.error('Error cargando direcciones:', error);
        }
      });
  }

  /**
   * Cuando el usuario selecciona una dirección guardada
   */
  onAddressSelected(addressId: string): void {
    const selected = this.userAddresses.find(addr => addr._id === addressId);
    if (selected) {
      this.fillAddressForm(selected);
    }
  }

  /**
   * Llenar el formulario con datos de dirección
   */
  private fillAddressForm(address: any): void {
    this.addressForm.patchValue({
      nombreCompleto: address.nombreCompleto || '',
      telefono: address.telefono || '',
      calle: address.calle || '',
      numeroExterior: address.numeroExterior || '',
      numeroInterior: address.numeroInterior || '',
      colonia: address.colonia || '',
      ciudad: address.ciudad || '',
      estado: address.estado || '',
      codigoPostal: address.codigoPostal || '',
      referencias: address.referencias || ''
    });
  }

  /**
   * Proceder a crear la orden
   */
  crearOrden(): void {
    if (!this.addressForm.valid || !this.paymentForm.valid || !this.checkoutSummary) {
      this.toastService.error('Por favor completa todos los campos requeridos');
      this.markFormGroupTouched(this.addressForm);
      this.markFormGroupTouched(this.paymentForm);
      return;
    }

    this.isSubmitting = true;
    this.spinnerService.show('Creando orden...', 'bar', 'order-create');

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.toastService.error('Sesión expirada');
      this.router.navigate(['/auth']);
      return;
    }

    const direccionEnvio = {
      nombreCompleto: this.addressForm.get('nombreCompleto')?.value,
      telefono: this.addressForm.get('telefono')?.value,
      calle: this.addressForm.get('calle')?.value,
      numeroExterior: this.addressForm.get('numeroExterior')?.value,
      numeroInterior: this.addressForm.get('numeroInterior')?.value,
      colonia: this.addressForm.get('colonia')?.value,
      ciudad: this.addressForm.get('ciudad')?.value,
      estado: this.addressForm.get('estado')?.value,
      codigoPostal: this.addressForm.get('codigoPostal')?.value,
      referencias: this.addressForm.get('referencias')?.value
    };

    // Actualizar el método de pago en el resumen
    const metodoPagoSeleccionado = this.paymentMethods.find(
      m => m.tipo === this.paymentForm.get('metodoPago')?.value
    );

    this.checkoutSummary.metodoPagoSeleccionado = metodoPagoSeleccionado;

    this.orderCheckoutService.createOrder(this.checkoutSummary, user.id, direccionEnvio)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.spinnerService.hide('order-create');
          this.isSubmitting = false;

          if (response.success) {
            // Orden creada exitosamente
            this.toastService.success('¡Orden creada exitosamente!');

            // Vaciar carrito
            this.cartService.vaciarCarrito().then(() => {
            });

            // Establecer orden en el estado global
            const ordenResponse = response as any;
            this.checkoutState.setCurrentOrder(ordenResponse);
            this.checkoutState.setStep('creada');

            // Navegar a página de orden creada
            setTimeout(() => {
              this.router.navigate(['/checkout/order-created', response.ordenId]);
            }, 1000);
          } else if (response.estado === 'error_pending_exists') {
            // Usuario ya tiene orden pendiente
            this.toastService.warning('Ya tienes una orden pendiente');
            this.checkoutState.setError('Ya tienes una orden pendiente desde hace algún tiempo. Completa el pago de esa orden primero.');
            this.checkoutState.setStep('carrito');

            // Mostrar modal o navegar a orden pendiente
            setTimeout(() => {
              this.router.navigate(['/orders/pending', response.ordenId]);
            }, 2000);
          } else {
            this.toastService.error(response.mensaje || 'Error al crear la orden');
          }
        },
        error: (error) => {
          this.spinnerService.hide('order-create');
          this.isSubmitting = false;
          console.error('Error creando orden:', error);
          this.toastService.error('Error al crear la orden. Intenta nuevamente.');
        }
      });
  }

  /**
   * Cancelar checkout y volver al carrito
   */
  cancelarCheckout(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Marcar campos como tocados para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtener método de pago seleccionado
   */
  getSelectedPaymentMethod(): any {
    const tipo = this.paymentForm.get('metodoPago')?.value;
    return this.paymentMethods.find(m => m.tipo === tipo);
  }
}
