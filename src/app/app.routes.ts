
import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'product',
    loadComponent: () => import('./features/products/product-cards.component/components/product-detail.component/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'checkout/order-confirmation/:orderId',
    loadComponent: () => import('./features/checkout/order-confirmation.component/order-confirmation.component').then(m => m.OrderConfirmationComponent)
  },
  {
    path: 'checkout/purchase-success/:orderId',
    loadComponent: () => import('./features/checkout/purchase-success.component/purchase-success.component').then(m => m.PurchaseSuccessComponent)
  },
  {
    path: 'orders/order-detail',
    loadComponent: () => import('./features/orders/order-detail.component/order-detail.component').then(m => m.OrderDetailComponent)
  }
];
