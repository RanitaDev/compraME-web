import { Component, ViewChild } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from "primeng/button";
import { InputTextModule } from 'primeng/inputtext';
import { CartModalComponent } from '../../features/cart/cart-modal.component/cart-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    //PRIMENG
    AvatarModule,
    DividerModule,
    ButtonModule,
    InputTextModule,
    //COMPONENTES
    CartModalComponent
],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  @ViewChild(CartModalComponent) modalCarrito!: CartModalComponent;

  constructor(
    private router: Router
  ){}

  /**
   * @description: Función que controla la visibilidad de la modal.
   */
  public abrirCarrito(): void {
    this.modalCarrito.openModal();
  }

  onCheckout(): void {
    this.modalCarrito.checkout();
  }

  public modalCarritoCerrada(): void {
    console.log("Modal cerrada");
  }

  public goHome(): void {
    this.router.navigate(['/']);
  }
}
