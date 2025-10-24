export const environment = {
  production: false,
  apiUrl: 'http://localhost:3010/api',
  apiTimeout: 30000,
  enableLogging: true,
  version: '1.0.0',
  cartDebounceTime: 1650, // Tiempo de debounce para actualizaciones del carrito en ms
  paypal: {
    clientId: 'YOUR_PAYPAL_CLIENT_ID', // Se debe configurar con el client ID real de desarrollo
    environment: 'sandbox' as 'sandbox' | 'production',
  }
};
