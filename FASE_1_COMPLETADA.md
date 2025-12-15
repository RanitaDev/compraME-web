# 📋 Fase 1: Estructura Base - COMPLETADA ✅

## 🎯 Resumen de Cambios

La Fase 1 establece toda la estructura necesaria para soportar el flujo completo de compra y gestión de órdenes.

---

## 📁 Archivos Creados

### 1. **order-creation.interface.ts** - DTOs para operaciones de orden
```
CreateOrderDto → Payload para crear orden
CreateOrderResponse → Respuesta al crear orden
UploadPaymentProofDto → Datos para subir comprobante
CancelOrderDto → Datos para cancelar orden
PendingOrderResponse → Respuesta de orden pendiente
```

### 2. **order-checkout.service.ts** - Lógica de checkout
```
✅ createOrder() - Crear nueva orden
✅ uploadPaymentProof() - Subir comprobante de pago
✅ cancelOrder() - Cancelar orden y liberar stock
✅ calcularTiempoRestante() - Contador de tiempo
✅ puedeCancelarseOrden() - Validar cancelación
✅ getInstruccionesPago() - Instrucciones por método
```

### 3. **checkout-state.service.ts** - Estado global del checkout
```
✅ Signals para: currentOrder, isLoading, error, step, tiempoRestante
✅ checkForPendingOrder() - Detectar orden pendiente
✅ setCurrentOrder() - Establecer orden actual
✅ setStep() - Cambiar paso del flujo
✅ setError() - Manejar errores
✅ clearCheckout() - Limpiar estado después de compra
```

---

## 📝 Archivos Actualizados

### 1. **orders.interface.ts** - Estructuras de orden
**Cambios:**
- ✅ `numeroOrden`: string (ej: "ORD-20251213-001")
- ✅ `fechaLimitePago`: Date (2 días desde creación)
- ✅ `stockReservado`: boolean (estado del stock)
- ✅ `razonCancelacion`: string (opcional)
- ✅ `direccionEnvio`: objeto completo con datos de envío
- ✅ Estructura mejorada de `IOrderItem`
- ✅ `tiempoRestante` en `IOrderDetail` para countdown

### 2. **order.service.ts** - Servicio de órdenes
**Nuevo Método:**
- ✅ `getPendingOrder(userId)` - Obtener orden pendiente del usuario

---

## 🔄 Flujo de Datos (Fase 1)

```
┌─────────────────────────────────────────────────────────────┐
│                  ESTRUCTURA DE ÓRDENES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  IOrders (interfaz principal)                              │
│  ├─ numeroOrden: "ORD-20251213-001"                       │
│  ├─ estado: "pending" | "proof_uploaded" | "paid" | ...  │
│  ├─ fechaLimitePago: Date (createdAt + 48h)              │
│  ├─ productos: IOrderItem[]                               │
│  ├─ direccionEnvio: {...}                                 │
│  ├─ metodoPago: "transferencia" | "oxxo" | ...           │
│  ├─ stockReservado: boolean                               │
│  └─ razonCancelacion?: string                             │
│                                                             │
│  Servicios Disponibles:                                     │
│  ├─ OrderService (consulta básica)                         │
│  ├─ OrderCheckoutService (creación y comprobantes)         │
│  └─ CheckoutStateService (estado global)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Casos de Uso Implementados

### 1️⃣ Crear Orden
```typescript
// En tu componente de checkout
constructor(private checkoutService: OrderCheckoutService) {}

createOrder(checkoutData: ICheckoutSummary, userId: string) {
  this.checkoutService.createOrder(checkoutData, userId, direccionEnvio)
    .subscribe({
      next: (response) => {
        if (response.success) {
          // Orden creada exitosamente
          // Stock: RESTADO
          // Estado: PENDING
          // Fecha límite: 48 horas
        } else if (response.estado === 'error_pending_exists') {
          // Usuario ya tiene orden pendiente
          // Mostrar modal invitando a completar
        }
      }
    });
}
```

### 2️⃣ Verificar Orden Pendiente
```typescript
constructor(private checkoutState: CheckoutStateService) {}

ngOnInit() {
  // Automáticamente verifica orden pendiente
  // Puedes acceder a ella así:
  this.currentOrder$ = this.checkoutState.currentOrder;
  this.tiempoRestante$ = this.checkoutState.tiempoRestante;
}
```

### 3️⃣ Subir Comprobante
```typescript
uploadComprobante(orderId: string, proofData: {...}) {
  this.checkoutService.uploadPaymentProof(orderId, proofData)
    .subscribe({
      next: (response) => {
        // Estado: PROOF_UPLOADED
        // Admin revisará el comprobante
      }
    });
}
```

### 4️⃣ Cancelar Orden
```typescript
cancelarOrden(orderId: string, razon?: string) {
  this.checkoutService.cancelOrder(orderId, razon)
    .subscribe({
      next: (response) => {
        // Estado: CANCELED
        // Stock: LIBERADO
      }
    });
}
```

### 5️⃣ Calcular Tiempo Restante
```typescript
// Automáticamente actualizado cada segundo en CheckoutStateService
// Acceso fácil:
const tiempoRestante = this.checkoutState.tiempoRestante();
console.log(`${tiempoRestante.dias}d ${tiempoRestante.horas}h`);
// Output: "1d 23h"

// Si ya expiró:
if (tiempoRestante.expirado) {
  // Mostrar opción para crear nueva orden
}
```

---

## 🔗 Endpoints del Backend Necesarios

```
POST   /orders
       ✅ CreateOrderDto
       ← CreateOrderResponse

GET    /orders/user/:userId/pending
       ✅ Obtener orden pendiente
       ← { data: IOrders | null }

POST   /orders/:orderId/payment-proof
       ✅ multipart/form-data
       ← { success, proofUrl }

PATCH  /orders/:orderId/cancelar
       ✅ CancelOrderDto
       ← { success, message }
```

---

## ✅ Checklist de Fase 1

- [x] Interfaces de órdenes actualizadas con todos los campos
- [x] DTOs para creación y operaciones de orden
- [x] OrderCheckoutService con métodos principales
- [x] CheckoutStateService para estado global
- [x] Método getPendingOrder en OrderService
- [x] Cálculo automático de tiempo restante
- [x] Validaciones de cancelación de orden
- [x] Instrucciones de pago por método
- [x] Manejo de error: "orden pendiente ya existe"
- [x] Exportaciones en index.ts

---

## 🚀 Siguiente Paso: Fase 2

**Fase 2: Flujo de Checkout** incluirá:
1. Componente: **Checkout/Confirmación de Compra**
2. Componente: **Orden Creada (Espera Pago)**
3. Manejo de errores de orden pendiente existente
4. Integración con CartService para vaciar carrito

**¿Listo para la Fase 2?** 🎯
