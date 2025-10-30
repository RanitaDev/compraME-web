import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { OrdersListComponent } from './features/admin/order-list.component/orders-list.component';
import { authGuard, guestGuard, adminGuard, adminRedirectGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Rutas públicas existentes
  {
    path: '',
    component: HomeComponent,
    canActivate: [adminRedirectGuard] // Redirigir admins a /admin
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [guestGuard] // Solo usuarios no autenticados
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [adminRedirectGuard] // Redirigir admins a /admin
  },
  {
    path: 'category/:id',
    loadComponent: () => import('./features/categories/category-products.component/category-products.component').then(m => m.CategoryProductsComponent),
    title: 'Productos por Categoría',
    canActivate: [adminRedirectGuard] // Redirigir admins a /admin
  },
  {
    path: 'product/category/:id',
    loadComponent: () => import('./features/products/product-cards.component/components/product-detail.component/product-detail.component').then(m => m.ProductDetailComponent),
    canActivate: [adminRedirectGuard] // Redirigir admins a /admin
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./features/products/product-cards.component/components/product-detail.component/product-detail.component').then(m => m.ProductDetailComponent),
    canActivate: [adminRedirectGuard] // Redirigir admins a /admin
  },
  {
    path: 'search-results',
    loadComponent: () => import('./features/search/search-results.component/search-results.component').then(m => m.SearchResultsComponent),
    title: 'Resultados de búsqueda',
    canActivate: [adminRedirectGuard] // Redirigir admins a /admin
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [adminRedirectGuard] // Redirigir admins a /admin
    // Removido authGuard para permitir guest checkout
  },
  {
    path: 'checkout/order-confirmation/:orderId',
    loadComponent: () => import('./features/checkout/order-confirmation.component/order-confirmation.component').then(m => m.OrderConfirmationComponent),
    canActivate: [authGuard, adminRedirectGuard] // Requiere autenticación + redirigir admins
  },
  {
    path: 'checkout/purchase-success/:orderId',
    loadComponent: () => import('./features/checkout/purchase-success.component/purchase-success.component').then(m => m.PurchaseSuccessComponent),
    canActivate: [authGuard, adminRedirectGuard] // Requiere autenticación + redirigir admins
  },
  {
    path: 'orders/order-detail',
    loadComponent: () => import('./features/orders/order-detail.component/order-detail.component').then(m => m.OrderDetailComponent),
    canActivate: [authGuard, adminRedirectGuard] // Requiere autenticación + redirigir admins
  },
  // Rutas de administración - PROTEGIDAS
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout.component/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard], // Requiere autenticación y rol admin
    children: [
      {
        path: '',
        redirectTo: 'product-list', // Cambié de dashboard a product-list ya que dashboard está comentado
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
