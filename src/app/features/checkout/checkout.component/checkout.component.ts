import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { CheckoutService } from '../../../services/checkout.service';
import { IPaymentMethod, IAddress, ICheckoutSummary, ICartProducts } from '../../../interfaces/checkout.interface';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  @Input() fromCart: boolean = true; // true = desde carrito, false = compra directa

  addresses: IAddress[] = [];
  paymentMethods: IPaymentMethod[] = [];
  selectedAddress: IAddress | null = null;
  selectedPaymentMethod: IPaymentMethod | null = null;
  checkoutSummary: ICheckoutSummary | null = null;
  isProcessing: boolean = false;
  showAddressForm: boolean = false;

  // Getter para verificar si se puede proceder
  get canProceed(): boolean {
    return this.selectedAddress !== null &&
           this.selectedPaymentMethod !== null &&
           this.checkoutSummary !== null;
  }

  constructor(
    private checkoutService: CheckoutService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadInitialData();
    this.buildCheckoutSummary();
  }

  private loadInitialData() {
    // Cargar direcciones
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

    // Cargar métodos de pago
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
  }

  private buildCheckoutSummary() {
    if (this.fromCart) {
      const cartSummary = this.cartService.cartSummary();
      const checkoutItems: ICartProducts[] = cartSummary.items.map(item => ({
        idProducto: item.producto.idProducto,
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
    } else {
      // TODO: Construir desde producto individual
      // Aquí manejarías la compra directa de un producto
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

  proceedToPayment() {
    const summary = this.checkoutSummary;
    const address = this.selectedAddress;
    const paymentMethod = this.selectedPaymentMethod;

    if (!summary || !address || !paymentMethod) {
      return;
    }

    this.isProcessing = true;

    const orderData: ICheckoutSummary = {
      ...summary,
      direccionSeleccionada: address,
      metodoPagoSeleccionado: paymentMethod
    };

    this.checkoutService.processOrder(orderData).subscribe({
      next: (result) => {
        this.isProcessing = false;
        if (result.success) {
          // Limpiar carrito si es compra desde carrito
          if (this.fromCart) {
            this.cartService.clearCart();
          }
          // Redirigir a página de confirmación
          this.router.navigate(['/order-confirmation', result.orderId]);
        } else {
          // Mostrar error
          alert(result.error || 'Error al procesar el pedido');
        }
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('Error processing order:', error);
        alert('Error al procesar el pedido. Intente nuevamente.');
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
