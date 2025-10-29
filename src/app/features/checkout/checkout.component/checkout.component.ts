import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { CheckoutService } from '../../../services/checkout.service';
import { OrderService } from '../../../services/order.service';
import { DirectPurchaseService } from '../../../services/direct-purchase.service';
import { AuthService } from '../../../services/auth.service';
import { TaxConfigService } from '../../../services/tax-config.service';
import { OrderDataService } from '../../../services/order-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { IPaymentMethod, IAddress, ICheckoutSummary, ICartProducts } from '../../../interfaces/checkout.interface';
import { action } from '@primeuix/themes/aura/image';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  addresses: IAddress[] = [];
  paymentMethods: IPaymentMethod[] = [];
  selectedAddress: IAddress | null = null;
  selectedPaymentMethod: IPaymentMethod | null = null;
  checkoutSummary: ICheckoutSummary | null = null;
  isProcessing: boolean = false;
  showAddressForm: boolean = false;

  // Determinar el tipo de checkout (cart o direct)
  isDirectPurchase: boolean = false;

  // Estado de autenticación
  isAuthenticated: boolean = false;
  showLoginPrompt: boolean = false;

  // Getter para verificar si se puede proceder
  get canProceed(): boolean {
    return this.selectedAddress !== null &&
           this.selectedPaymentMethod !== null &&
           this.checkoutSummary !== null;
  }

  constructor(
    private checkoutService: CheckoutService,
    private orderService: OrderService,
    private cartService: CartService,
    private directPurchaseService: DirectPurchaseService,
    private authService: AuthService,
    private taxConfigService: TaxConfigService,
    private orderDataService: OrderDataService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.showLoginPrompt = false;

    this.route.queryParams.subscribe(params => {
      if(params['action'] === 'buy_now') this.orderDataService.clearOrderData();
      this.isDirectPurchase = params['type'] === 'direct';
    });

    this.checkPendingOrder();

    this.loadInitialData();
    this.buildCheckoutSummary();
    this.checkForPendingPayment();
  }

  /**
   * Verificar si el usuario tiene una orden pendiente
   */
  private checkPendingOrder() {
    if (!this.isAuthenticated) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.orderService.getUserPendingOrder(currentUser.id).subscribe({
      next: (pendingOrder) => {
        if (pendingOrder) {
          console.log('🔍 Orden pendiente detectada, eliminando automáticamente');
          console.log('- ID orden pendiente:', pendingOrder._id || pendingOrder.id);
          console.log('- Tipo de compra actual:', this.isDirectPurchase ? 'COMPRA DIRECTA' : 'CARRITO');

          // SIEMPRE eliminar la orden pendiente anterior (carrito o compra directa)
          this.orderService.deleteOrder(pendingOrder._id || pendingOrder.id).subscribe({
            next: () => {},
            error: (error) => {
              console.error('❌ Error eliminando orden anterior:', error);
              this.toastService.warning('Orden pendiente', 'Tienes una orden pendiente. Complétala primero o cancélala.');
              // Si falla eliminar, redirigir a la orden pendiente como fallback
              setTimeout(() => {
                this.router.navigate(['/checkout/order-confirmation', pendingOrder._id || pendingOrder.id]);
              }, 2000);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error checking pending order:', error);
        // No hacer nada, continuar con el flujo normal
      }
    });
  }

  /**
   * Verificar si hay un pago pendiente después del login
   */
  private checkForPendingPayment() {
    const pendingPayment = localStorage.getItem('checkout_state_for_payment');

    if (pendingPayment && this.isAuthenticated) {
      try {
        const checkoutState = JSON.parse(pendingPayment);
        const timeDiff = Date.now() - checkoutState.timestamp;

        if (timeDiff < 30 * 60 * 1000) {
          setTimeout(() => {
            if (checkoutState.selectedAddress) {
              const address = this.addresses.find(a => a.id === checkoutState.selectedAddress.id);
              if (address) this.selectedAddress = address;
            }

            if (checkoutState.selectedPaymentMethod) {
              const method = this.paymentMethods.find(m => m.id === checkoutState.selectedPaymentMethod.id);
              if (method) this.selectedPaymentMethod = method;
            }

            this.toastService.success('¡Sesión iniciada!', 'Tu sesión ha sido iniciada. Ahora puedes completar tu compra.');
          }, 1000);
        }

        // Limpiar el estado guardado
        localStorage.removeItem('checkout_state_for_payment');

      } catch (error) {
        // Error restaurando estado de checkout
        localStorage.removeItem('checkout_state_for_payment');
      }
    }
  }

  private loadInitialData() {
    if (this.isAuthenticated) {
      this.checkoutService.getAddresses().subscribe({
        next: (addresses) => {
          this.addresses = addresses;
          const primary = addresses.find(addr => addr.esPrincipal);
          if (primary) {
            this.selectAddress(primary);
          }
        }
      });

      this.checkoutService.getPaymentMethods().subscribe({
        next: (methods) => {
          this.paymentMethods = methods;
          // Seleccionar transferencia como método por defecto, sino el primero disponible
          const defaultMethod = methods.find(method => method.tipo === 'transferencia') || methods[0];
          if (defaultMethod) {
            this.selectPaymentMethod(defaultMethod);
          }
        }
      });
    } else {
      this.loadGuestCheckoutData();
    }
  }

  /**
   * Cargar datos por defecto para checkout de invitado
   */
  private loadGuestCheckoutData() {
    this.addresses = [
      {
        id: 999,
        alias: 'Dirección de entrega',
        nombreCompleto: '',
        telefono: '',
        calle: '',
        numeroExterior: '',
        colonia: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        esPrincipal: true
      }
    ];

    this.paymentMethods = [
      // Opciones de tarjeta y PayPal temporalmente deshabilitadas
      // {
      //   id: 999,
      //   tipo: 'tarjeta',
      //   nombre: 'Tarjeta de Crédito/Débito',
      //   descripcion: 'Pago con tarjeta de crédito o débito',
      //   activo: true,
      //   tiempoEstimado: 'Inmediato'
      // },
      {
        id: 997,
        tipo: 'transferencia',
        nombre: 'Transferencia SPEI',
        descripcion: 'Transferencia bancaria electrónica',
        activo: true,
        tiempoEstimado: 'Inmediato'
      },
      {
        id: 996,
        tipo: 'deposito',
        nombre: 'Depósito Bancario',
        descripcion: 'Depósito en sucursal bancaria',
        activo: true,
        tiempoEstimado: '24-48 hrs'
      },
      {
        id: 998,
        tipo: 'oxxo',
        nombre: 'OXXO Pay',
        descripcion: 'Pago en tiendas OXXO',
        activo: true,
        tiempoEstimado: '24-48 hrs'
      }
    ];

    this.selectedAddress = this.addresses[0];
    this.selectedPaymentMethod = this.paymentMethods[0];
  }

  /**
   * Construir el resumen de checkout basado en el tipo de compra
   */
  private buildCheckoutSummary() {
    if (!this.isDirectPurchase) {
      const cartSummary = this.cartService.cartSummary();

      if (cartSummary.items.length === 0) {
        this.toastService.warning('Carrito vacío', 'Tu carrito está vacío. Agrega productos antes de proceder al checkout.');
        this.router.navigate(['/']);
        return;
      }

      const checkoutItems: ICartProducts[] | any = cartSummary.items.map(item => ({
        idProducto: item.producto._id || item.producto.productoID,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precio: item.producto.precio,
        subtotal: item.producto.precio * item.cantidad
      }));

      this.checkoutSummary = {
        items: checkoutItems,
        subtotal: cartSummary.subtotal,
        impuestos: cartSummary.impuestos,
        envio: cartSummary.envio,
        total: cartSummary.total,
        isDirectPurchase: false // Es compra desde carrito
      };
    } else {
      this.directPurchaseService.createDirectCheckoutSummary().subscribe({
        next: (directSummary) => {
          if (directSummary) {
            this.checkoutSummary = directSummary;
          } else {
            this.toastService.error('Error', 'No se encontró el producto para compra directa.');
            this.router.navigate(['/']);
          }
        }
      });
    }
  }

  selectAddress(address: IAddress) {
    this.selectedAddress = address;
    this.updateShippingCost(address);
  }

  selectPaymentMethod(method: IPaymentMethod) {
    this.selectedPaymentMethod = method;
  }

  private updateShippingCost(address: IAddress) {
    const summary = this.checkoutSummary;
    if (summary) {
      // Recalcular todos los totales con el código postal de la dirección
      this.taxConfigService.calculateTotals(summary.subtotal, address.codigoPostal).subscribe({
        next: (totals) => {
          const updatedSummary: ICheckoutSummary = {
            ...summary,
            impuestos: totals.tax,
            envio: totals.shipping,
            total: totals.total
          };
          this.checkoutSummary = updatedSummary;
        }
      });
    }
  }

  /**
   * Proceder al procesamiento del pago
   * Valida que toda la información esté completa antes de procesar
   * REQUIERE AUTENTICACIÓN OBLIGATORIA para proceder al pago
   */
  proceedToPayment() {
    const summary = this.checkoutSummary;
    const address = this.selectedAddress;
    const paymentMethod = this.selectedPaymentMethod;

    // Validaciones antes de proceder
    if (!summary || !address || !paymentMethod) {
      this.toastService.warning('Información incompleta', 'Por favor completa toda la información requerida antes de continuar.');
      return;
    }

    // Validación adicional para carrito vacío
    if (!this.isDirectPurchase && summary.items.length === 0) {
      this.toastService.warning('Carrito vacío', 'Tu carrito está vacío. No se puede proceder con el pago.');
      this.router.navigate(['/']);
      return;
    }

    if (!this.authService.isAuthenticated()) {
      const checkoutState = {
        type: this.isDirectPurchase ? 'direct' : 'cart',
        selectedAddress: address,
        selectedPaymentMethod: paymentMethod,
        timestamp: Date.now()
      };

      localStorage.setItem('checkout_state_for_payment', JSON.stringify(checkoutState));

      this.toastService.info('Iniciar sesión requerido', 'Para completar tu compra necesitas iniciar sesión. Te redirigiremos al login y después regresarás automáticamente aquí.');
      this.router.navigate(['/auth']);
      return;
    }

    this.processPayment(summary, address, paymentMethod);
  }

  /**
   * Procesar el pago
   */
  private processPayment(summary: ICheckoutSummary, address: IAddress, paymentMethod: IPaymentMethod) {
    this.isProcessing = true;

    const orderData: ICheckoutSummary = {
      ...summary,
      direccionSeleccionada: address,
      metodoPagoSeleccionado: paymentMethod,
      // Agregar información del tipo de compra
      isDirectPurchase: this.isDirectPurchase
    };

    this.checkoutService.processOrder(orderData).subscribe({
      next: (result) => {
        this.isProcessing = false;
        if (result.success) {
          if (result.isUpdate) {
            this.toastService.success('Método actualizado', 'El método de pago ha sido actualizado correctamente.');
          } else {
            this.toastService.success('Orden creada', 'Tu orden ha sido creada exitosamente.');
          }

          localStorage.removeItem('checkout_state_for_payment');

          const queryParams = this.isDirectPurchase ? { type: 'direct' } : {};
          this.router.navigate(['/checkout/order-confirmation', result.orderId], { queryParams });
        } else {
          const errorMessage = result.error || 'Error desconocido al procesar el pedido';

          // Si hay un orderId en el error, significa que tiene una orden pendiente
          if (result.orderId) {
            this.toastService.warning('Orden pendiente encontrada', errorMessage);
            setTimeout(() => {
              this.router.navigate(['/checkout/order-confirmation', result.orderId]);
            }, 2000);
          } else {
            this.toastService.error('Error al procesar pedido', errorMessage);
          }
        }
      },
      error: (error) => {
        this.isProcessing = false;
        this.toastService.error('Error de conexión', 'Por favor verifica tu internet e intenta nuevamente.');
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  addNewAddress() {
    this.showAddressForm = false;
  }
}
