# Estructura de Base de Datos para Carrito Persistente

## 📊 Colección `carts` (MongoDB)

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."), // Referencia al usuario
  items: [
    {
      productId: ObjectId("..."), // Referencia al producto
      cantidad: 2,
      precio: 299.99, // Precio al momento de agregar (para historial)
      fechaAgregado: ISODate("2025-09-13T..."),
      fechaActualizada: ISODate("2025-09-13T...")
    }
  ],
  fechaCreacion: ISODate("2025-09-13T..."),
  fechaActualizacion: ISODate("2025-09-13T..."),
  activo: true, // Para soft delete
  sesionId: "abc123...", // Para carritos de usuarios no autenticados (opcional)
  expiresAt: ISODate("2025-10-13T...") // TTL para limpiar carritos abandonados
}
```

## 🔧 APIs Necesarias

### POST `/api/cart/add`
```json
{
  "productId": "64f5a8b2c9e77a123456789",
  "cantidad": 1
}
```

### GET `/api/cart`
```json
{
  "success": true,
  "cart": {
    "items": [
      {
        "product": { /* datos completos del producto */ },
        "cantidad": 2,
        "fechaAgregado": "2025-09-13T10:30:00Z"
      }
    ],
    "summary": {
      "totalItems": 3,
      "subtotal": 599.98,
      "total": 695.58
    }
  }
}
```

### PUT `/api/cart/update`
```json
{
  "productId": "64f5a8b2c9e77a123456789",
  "cantidad": 3
}
```

### DELETE `/api/cart/remove/:productId`

### DELETE `/api/cart/clear`

## 🔄 Flujo de Sincronización

### Usuario No Autenticado → Login
1. Usuario agrega productos (localStorage)
2. Usuario hace login
3. Frontend envía carrito local al backend
4. Backend fusiona con carrito existente (si existe)
5. Frontend recibe carrito unificado
6. LocalStorage se actualiza

### Usuario Autenticado → Logout
1. Carrito se mantiene en BD
2. LocalStorage se puede limpiar o mantener como backup

### Múltiples Dispositivos
1. Login en dispositivo B
2. Carrito se carga desde BD automáticamente
3. Cambios se sincronizan en tiempo real (opcional: WebSockets)

## 🛡️ Consideraciones de Seguridad

- **Validar stock** en cada operación del backend
- **Limpiar carritos abandonados** (TTL de 30 días)
- **Rate limiting** en APIs del carrito
- **Validar permisos** del usuario en cada operación

## 📈 Optimizaciones

- **Caché en Redis** para carritos activos
- **Batch updates** para múltiples cambios
- **Lazy loading** de datos del producto
- **Debouncing** en actualizaciones frecuentes
