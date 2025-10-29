# Endpoints del Backend Requeridos

Este documento lista todos los endpoints del backend que necesitan ser implementados para que el frontend funcione correctamente.

## 📋 Base URL
```
http://localhost:3000/api
```

---

## 🛍️ Órdenes (Orders)

### 1. Crear Orden
```http
POST /orders
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "userId": "string",
  "items": [
    {
      "idProducto": "string",  // ⚠️ Importante: usar 'idProducto', NO 'productoId'
      "cantidad": number,
      "precio": number
    }
  ],
  "total": number,
  "direccionEnvio": {
    "calle": "string",
    "numeroExterior": "string",
    "numeroInterior": "string",
    "colonia": "string",
    "ciudad": "string",
    "estado": "string",
    "codigoPostal": "string",
    "pais": "string"
  },
  "metodoPago": "paypal" | "transferencia" | "deposito" | "oxxo",
  "estado": "pending",
  "isDirectPurchase": boolean  // true para compra directa, false para carrito
}

Response: 201
{
  "_id": "string",
  "userId": "string",
  "items": [...],
  "total": number,
  "estado": "pending",
  "createdAt": "date",
  ...
}
```

### 2. Obtener Órdenes del Usuario
```http
GET /orders/user/:userId
Authorization: Bearer <token>

Response: 200
[
  {
    "_id": "string",
    "userId": "string",
    "items": [...],
    "total": number,
    "estado": "pending" | "proof_uploaded" | "paid" | "shipped" | "delivered" | "canceled",
    "createdAt": "date",
    ...
  }
]
```

### 3. Obtener Órdenes Pendientes del Usuario
```http
GET /orders/user/:userId/pending
Authorization: Bearer <token>

Response: 200
[
  {
    "_id": "string",
    "userId": "string",
    "items": [...],
    "total": number,
    "estado": "pending",
    "createdAt": "date",
    ...
  }
]
```

### 4. Obtener Orden por ID
```http
GET /orders/:id
Authorization: Bearer <token>

Response: 200
{
  "_id": "string",
  "userId": "string",
  "items": [...],
  "total": number,
  "estado": "pending",
  "createdAt": "date",
  ...
}
```

### 5. Eliminar Orden
```http
DELETE /orders/:id
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Orden eliminada correctamente"
}
```

### 6. Subir Comprobante de Pago
```http
POST /orders/:id/payment-proof
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body (FormData):
- file: File (imagen o PDF)
- referenceNumber: string
- amount: number
- paymentMethod: "transferencia" | "deposito" | "oxxo"
- transactionDate: string (ISO date)

Response: 200
{
  "success": true,
  "proofUrl": "string"  // URL del archivo subido
}
```

### 7. Actualizar Estado de Orden
```http
PUT /orders/:id/status
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "status": "proof_uploaded" | "paid" | "shipped" | "delivered" | "canceled",
  "metadata": {
    "paymentProofUrl": "string",
    "referenceNumber": "string"
  }
}

Response: 200
{
  "success": true,
  "order": {
    "_id": "string",
    "estado": "proof_uploaded",
    ...
  }
}
```

---

## 🏦 Banco (Bank)

### 8. Obtener Cuentas Bancarias
```http
GET /bank/bank-accounts

Response: 200
[
  {
    "id": number,
    "banco": "string",
    "titular": "string",
    "numeroCuenta": "string",
    "clabe": "string",
    "tipo": "transferencia" | "deposito" | "oxxo",
    "activa": boolean,
    "descripcion": "string"
  }
]
```

### 9. Generar Instrucciones de Pago
```http
POST /bank/payment-instructions
Content-Type: application/json

Body:
{
  "orderId": "string",
  "amount": number,
  "paymentType": "deposito" | "transferencia" | "oxxo"
}

Response: 200
{
  "tipo": "deposito" | "transferencia" | "oxxo",
  "cuenta": {
    "id": number,
    "banco": "string",
    "titular": "string",
    "numeroCuenta": "string",
    "clabe": "string",
    "tipo": "string",
    "activa": boolean,
    "descripcion": "string"
  },
  "numeroReferencia": "string",  // Formato: CR{timestamp}{orderId}
  "monto": number,
  "fechaLimite": "date",  // 72 horas desde ahora
  "instrucciones": [
    "string",
    "string",
    ...
  ]
}
```

---

## 📝 Notas Importantes

### Estados de Orden
- **pending**: Orden creada, esperando pago
- **proof_uploaded**: Usuario subió comprobante de pago (⚠️ **Cuando la orden llega a este estado, el frontend limpia automáticamente el carrito vía polling**)
- **paid**: Pago verificado por el admin
- **shipped**: Orden enviada
- **delivered**: Orden entregada
- **canceled**: Orden cancelada
- **expired**: Orden expirada (opcional)

### Validaciones del Backend
1. **Autenticación**: Todos los endpoints de órdenes requieren token JWT válido
2. **Autorización**: El usuario solo puede ver/modificar sus propias órdenes
3. **Archivos**: 
   - Tamaño máximo: 5MB
   - Tipos permitidos: JPG, PNG, PDF
4. **Órdenes Pendientes**: 
   - Al crear una orden nueva, el backend debe eliminar automáticamente las órdenes pendientes del usuario
   - Lógica diferente para cart vs direct purchase (frontend siempre envía `isDirectPurchase`)

### Polling del Frontend
El frontend utiliza un servicio de monitoreo (`OrderMonitorService`) que:
- Hace polling cada 30 segundos
- Busca órdenes del usuario con estado `proof_uploaded`
- Cuando detecta una orden con este estado, **limpia automáticamente el carrito**
- Solo limpia el carrito si `isFromCart = true` en la orden

### Flujo de Pago con Banco
1. Usuario selecciona método de pago alternativo (transferencia/depósito/OXXO)
2. Frontend llama a `POST /bank/payment-instructions` para generar instrucciones
3. Usuario realiza el pago fuera del sistema
4. Usuario sube comprobante → `POST /orders/:id/payment-proof`
5. Backend guarda el archivo y devuelve URL
6. Frontend actualiza estado → `PUT /orders/:id/status` con estado `proof_uploaded`
7. **Frontend inicia polling cada 30s** esperando que backend confirme estado `proof_uploaded`
8. Admin verifica el pago manualmente y actualiza estado a `paid`

---

## 🔧 Implementación Recomendada

### Modelo de Orden (MongoDB/Mongoose)
```javascript
{
  userId: ObjectId,
  items: [
    {
      idProducto: ObjectId,  // ⚠️ Importante: usar 'idProducto'
      cantidad: Number,
      precio: Number
    }
  ],
  total: Number,
  direccionEnvio: {
    calle: String,
    numeroExterior: String,
    numeroInterior: String,
    colonia: String,
    ciudad: String,
    estado: String,
    codigoPostal: String,
    pais: String
  },
  metodoPago: String,
  estado: String,
  isDirectPurchase: Boolean,
  paymentProofUrl: String,
  referenceNumber: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Modelo de Cuenta Bancaria
```javascript
{
  id: Number,
  banco: String,
  titular: String,
  numeroCuenta: String,
  clabe: String,
  tipo: String,
  activa: Boolean,
  descripcion: String
}
```

---

## ✅ Checklist de Implementación

- [ ] POST /orders - Crear orden
- [ ] GET /orders/user/:userId - Obtener órdenes del usuario
- [ ] GET /orders/user/:userId/pending - Obtener órdenes pendientes
- [ ] GET /orders/:id - Obtener orden por ID
- [ ] DELETE /orders/:id - Eliminar orden
- [ ] POST /orders/:id/payment-proof - Subir comprobante
- [ ] PUT /orders/:id/status - Actualizar estado
- [ ] GET /bank/bank-accounts - Obtener cuentas bancarias
- [ ] POST /bank/payment-instructions - Generar instrucciones de pago
- [ ] Middleware de autenticación JWT
- [ ] Validación de archivos (tamaño, tipo)
- [ ] Lógica de eliminación de órdenes pendientes
- [ ] Storage de archivos (local o cloud)

---

## 🧪 Pruebas Recomendadas

1. **Crear orden desde carrito** (isDirectPurchase: false)
   - Verificar que se eliminan órdenes pendientes previas
   - Verificar que la orden se crea con estado "pending"

2. **Crear orden directa** (isDirectPurchase: true)
   - Verificar que se eliminan órdenes pendientes previas
   - Verificar que la orden se crea con estado "pending"

3. **Subir comprobante de pago**
   - Verificar que el archivo se guarda correctamente
   - Verificar que retorna la URL del archivo

4. **Actualizar estado a proof_uploaded**
   - Verificar que el estado se actualiza
   - **Verificar que el frontend detecta el cambio vía polling y limpia el carrito**

5. **Obtener órdenes del usuario**
   - Verificar que solo retorna órdenes del usuario autenticado

---

## 🚀 Endpoints en Uso por el Frontend

### ✅ Ya Implementados en Frontend
- `order.service.ts` → Todos los métodos apuntan al backend
- `bank.service.ts` → Todos los métodos apuntan al backend
- `checkout.service.ts` → Usa `order.service` para crear órdenes
- `order-monitor.service.ts` → Hace polling de órdenes cada 30s

### ⚠️ Pendientes en Backend
Todos los endpoints listados arriba necesitan ser implementados en el backend.
