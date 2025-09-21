import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { CheckoutService } from '../../../services/checkout.service';
import { DirectPurchaseService } from '../../../services/direct-purchase.service';
import { AuthService } from '../../../services/auth.service';
import { IPaymentMethod, IAddress, ICheckoutSummary, ICartProducts } from '../../../interfaces/checkout.interface';

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
    private cartService: CartService,
    private directPurchaseService: DirectPurchaseService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    console.log('🛒 Inicializando CheckoutComponent...');

    // Verificar estado de autenticación
    this.isAuthenticated = this.authService.isAuthenticated();
    console.log('🔐 Estado de autenticación en checkout:', this.isAuthenticated);

    // Ya no mostramos prompt de login al inicio - solo informativo
    this.showLoginPrompt = false;

    // Determinar tipo de checkout basado en query params
    this.route.queryParams.subscribe(params => {
      this.isDirectPurchase = params['type'] === 'direct';
      console.log('📋 Tipo de checkout:', this.isDirectPurchase ? 'compra directa' : 'carrito');
    });

    this.loadInitialData();
    this.buildCheckoutSummary();

    // Verificar si el usuario regresó del login para completar el pago
    this.checkForPendingPayment();
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

        // Solo si el estado es reciente (menos de 30 minutos)
        if (timeDiff < 30 * 60 * 1000) {
          console.log('🔄 Restaurando estado de checkout después del login');

          // Restaurar selecciones si están disponibles
          setTimeout(() => {
            if (checkoutState.selectedAddress) {
              const address = this.addresses.find(a => a.id === checkoutState.selectedAddress.id);
              if (address) this.selectedAddress = address;
            }

            if (checkoutState.selectedPaymentMethod) {
              const method = this.paymentMethods.find(m => m.id === checkoutState.selectedPaymentMethod.id);
              if (method) this.selectedPaymentMethod = method;
            }

            // Mostrar mensaje de confirmación
            alert('¡Perfecto! Tu sesión ha sido iniciada. Ahora puedes completar tu compra.');
          }, 1000);
        }

        // Limpiar el estado guardado
        localStorage.removeItem('checkout_state_for_payment');

      } catch (error) {
        console.error('Error restaurando estado de checkout:', error);
        localStorage.removeItem('checkout_state_for_payment');
      }
    }
  }

  private loadInitialData() {
    if (this.isAuthenticated) {
      // Usuario autenticado - cargar sus datos guardados
      console.log('👤 Cargando datos de usuario autenticado...');

      // Cargar direcciones del usuario
      this.checkoutService.getAddresses().subscribe({
        next: (addresses) => {
          this.addresses = addresses;
          // Seleccionar dirección principal por defecto
          const primary = addresses.find(addr => addr.esPrincipal);
          if (primary) {
            this.selectAddress(primary);
          }
        }
      });

      // Cargar métodos de pago del usuario
      this.checkoutService.getPaymentMethods().subscribe({
        next: (methods) => {
          this.paymentMethods = methods;
          // Seleccionar tarjeta por defecto
          const defaultMethod = methods.find(method => method.tipo === 'tarjeta');
          if (defaultMethod) {
            this.selectPaymentMethod(defaultMethod);
          }
        }
      });
    } else {
      // Usuario no autenticado - cargar datos por defecto para guest checkout
      console.log('🔓 Configurando checkout para usuario invitado...');
      this.loadGuestCheckoutData();
    }
  }

  /**
   * Cargar datos por defecto para checkout de invitado
   */
  private loadGuestCheckoutData() {
    // Direcciones por defecto para guest checkout
    this.addresses = [
      {
        id: 999, // ID temporal para guest
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

    // Métodos de pago disponibles para invitados
    this.paymentMethods = [
      {
        id: 999, // ID temporal para guest
        tipo: 'tarjeta',
        nombre: 'Tarjeta de Crédito/Débito',
        descripcion: 'Pago con tarjeta de crédito o débito',
        activo: true,
        tiempoEstimado: 'Inmediato'
      },
      {
        id: 998, // ID temporal para guest
        tipo: 'oxxo',
        nombre: 'OXXO Pay',
        descripcion: 'Pago en tiendas OXXO',
        activo: true,
        tiempoEstimado: '24-48 hrs'
      }
    ];

    // Seleccionar opciones por defecto
    this.selectedAddress = this.addresses[0];
    this.selectedPaymentMethod = this.paymentMethods[0];
  }

  /**
   * Construir el resumen de checkout basado en el tipo de compra
   */
  private buildCheckoutSummary() {
    if (!this.isDirectPurchase) {
      // Compra desde carrito
      const cartSummary = this.cartService.cartSummary();

      // Verificar que el carrito no esté vacío
      if (cartSummary.items.length === 0) {
        console.warn('⚠️ El carrito está vacío, redirigiendo al home');
        alert('Tu carrito está vacío. Agrega productos antes de proceder al checkout.');
        this.router.navigate(['/']);
        return;
      }

      // Mapear productos del carrito al formato de checkout
      const checkoutItems: ICartProducts[] = cartSummary.items.map(item => ({
        idProducto: item.producto._id,
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
        total: cartSummary.total
      };

      console.log('🛒 Checkout inicializado con productos del carrito:', checkoutItems.length, 'productos');
    } else {
      // Compra directa de un solo producto
      const directSummary = this.directPurchaseService.createDirectCheckoutSummary();
      if (directSummary) {
        this.checkoutSummary = directSummary;
        console.log('💰 Checkout inicializado con compra directa');
      } else {
        // Si no hay producto de compra directa, redirigir al home
        console.error('❌ No hay producto configurado para compra directa');
        alert('Error: No se encontró el producto para compra directa.');
        this.router.navigate(['/']);
      }
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
      this.checkoutService.calculateShipping(address, summary.subtotal).subscribe({
        next: (shippingCost) => {
          const updatedSummary: ICheckoutSummary = {
            ...summary,
            envio: shippingCost,
            total: summary.subtotal + summary.impuestos + shippingCost - (summary.descuentos || 0)
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
      alert('Por favor completa toda la información requerida antes de continuar.');
      return;
    }

    // Validación adicional para carrito vacío
    if (!this.isDirectPurchase && summary.items.length === 0) {
      alert('Tu carrito está vacío. No se puede proceder con el pago.');
      this.router.navigate(['/']);
      return;
    }

    // 🔐 VALIDACIÓN OBLIGATORIA DE AUTENTICACIÓN PARA PAGO
    if (!this.authService.isAuthenticated()) {
      console.log('🚨 Autenticación requerida para proceder al pago');

      // Guardar el estado actual del checkout para restaurar después del login
      const checkoutState = {
        type: this.isDirectPurchase ? 'direct' : 'cart',
        selectedAddress: address,
        selectedPaymentMethod: paymentMethod,
        timestamp: Date.now()
      };

      localStorage.setItem('checkout_state_for_payment', JSON.stringify(checkoutState));

      // Mostrar mensaje y redirigir al login
      alert('Para completar tu compra necesitas iniciar sesión. Te redirigiremos al login y después regresarás automáticamente aquí.');
      this.router.navigate(['/auth']);
      return;
    }

    // Usuario autenticado - proceder con el pago
    this.processPayment(summary, address, paymentMethod);
  }

  /**
   * Procesar el pago - método separado para mejor organización
   */
  private processPayment(summary: ICheckoutSummary, address: IAddress, paymentMethod: IPaymentMethod) {
    this.isProcessing = true;
    console.log('💳 Procesando orden de pago...', {
      tipo: this.isDirectPurchase ? 'compra directa' : 'carrito',
      productos: summary.items.length,
      total: summary.total
    });

    const orderData: ICheckoutSummary = {
      ...summary,
      direccionSeleccionada: address,
      metodoPagoSeleccionado: paymentMethod
    };

    this.checkoutService.processOrder(orderData).subscribe({
      next: (result) => {
        this.isProcessing = false;
        if (result.success) {
          console.log('✅ Orden procesada exitosamente:', result.orderId);

          // Limpiar datos según el tipo de compra
          if (!this.isDirectPurchase) {
            // Limpiar carrito de forma asíncrona
            this.cartService.clearCart().then(success => {
              if (success) {
                console.log('🛒 Carrito limpiado después de compra exitosa');
              } else {
                console.error('❌ Error limpiando carrito después de compra');
              }
            }).catch(error => {
              console.error('❌ Error limpiando carrito después de compra:', error);
            });
          } else {
            this.directPurchaseService.clearDirectPurchase();
            console.log('💰 Compra directa limpiada después de compra exitosa');
          }

          // Limpiar estado de checkout guardado
          localStorage.removeItem('checkout_state_for_payment');

          // Redirigir a página de confirmación
          this.router.navigate(['/checkout/order-confirmation', result.orderId]);
        } else {
          // Mostrar error del servidor
          const errorMessage = result.error || 'Error desconocido al procesar el pedido';
          console.error('❌ Error del servidor:', errorMessage);
          alert(`Error al procesar el pedido: ${errorMessage}`);
        }
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('❌ Error de conexión al procesar la orden:', error);
        alert('Error de conexión. Por favor verifica tu internet e intenta nuevamente.');
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
    // TODO: Implementar formulario de nueva dirección
    this.showAddressForm = false;
    console.log('Agregar nueva dirección');
  }
}
