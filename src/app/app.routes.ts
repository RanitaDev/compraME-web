import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { OrdersListComponent } from './features/admin/order-list.component/orders-list.component';

export const routes: Routes = [
  // Rutas públicas existentes
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
  },

  // Rutas de administración
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout.component/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      // {
      //   path: 'dashboard',
      //   loadComponent: () => import('./features/admin/pages/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      // },
      {
        path: 'product-list',
        loadComponent: () =>
          import('./features/admin/products/products-list.component/products-list.component')
            .then(m => m.ProductsListComponent)
      },
      {
        path: 'categories-list',
        loadComponent: () =>
          import('./features/admin/categories/categories-list.component/categories-list.component')
            .then(m => m.CategoriesListComponent)
      },
      {
        path: 'orders-list',
        loadComponent: () =>
          import('./features/admin/order-list.component/orders-list.component')
            .then(m => m.OrdersListComponent)
      },
    ]
  },

  // Ruta 404 - debe ir al final
  {
    path: '**',
    redirectTo: ''
  }
];
