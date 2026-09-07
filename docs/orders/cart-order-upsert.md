# Semántica Cart vs Order (Fase 3)

> Esta guía reemplaza la semántica de "upsert de órdenes" documentada
> previamente en este archivo (un único `solicitado` por sesión/cuenta con
> reemplazo silencioso). Esa semántica fue retirada en la Fase 3 porque
> provocaba que un cliente que hacía otro pedido terminara MODIFICANDO el
> anterior en lugar de crear historial independiente.

## Resumen de la semántica vigente

- **Cart = borrador mutable.** El cliente lo edita libremente; puede contener
  productos con precio (`unitPrice`) o pendientes de cotización
  (`unitPrice = null`). Se convierte (`status = 'convertido'`) al confirmarse
  un pedido.
- **Order = snapshot histórico e inmutable de una solicitud enviada.**
  `OrderItem.unitPrice` conserva el precio con el que se creó y NUNCA se
  reprecia cuando cambia el precio actual. `OrderStatusHistory` conserva las
  transiciones.
- **Cada checkout confirmado crea SIEMPRE un Order nuevo.** Un CUSTOMER puede
  tener varios pedidos `solicitado` independientes (los índices únicos
  parciales `Order_sessionId_status_unique_idx` y
  `Order_customerId_status_unique_idx` fueron retirados en la migración
  `20260907140000_order_lifecycle_request_type`).

## Prevención de doble submit (sustituye a los índices únicos)

La protección vive en `src/lib/order-create.ts` (`createOrderFromCart`):

1. **Lock transaccional del carrito**: dentro de la transacción de creación
   se toma `SELECT ... FOR UPDATE` sobre el `Cart`. Dos POST concurrentes del
   mismo checkout se serializan; el segundo relee el estado y falla con
   `409 CART_INACTIVE` (el carrito ya fue convertido por el primero).
2. **Idempotencia por clave** (`Order.idempotencyKey`, índice único): el
   cliente genera una clave por checkout y la reutiliza en reintentos. Si la
   respuesta se pierde, el reintento devuelve el pedido ya creado
   (`replayed: true`) en vez de duplicarlo. La clave solo matchea pedidos de
   la misma sesión/cliente.

Prueba PostgreSQL real de concurrencia: `tests/integration/order-lifecycle-pg.test.ts`.

## Edición vs Volver a pedir

- **Editar** (`PATCH /api/orders/[id]`, `src/lib/order-edit.ts`): solo un
  pedido EXPLÍCITO, solo en estado `solicitado`, con propiedad validada
  server-side; re-valida stock/precios con el motor único y audita en
  `OrderStatusHistory` (from = to, `changedBy: 'cliente'`). Los estados
  `compartido` / `recibido` no permiten tocar líneas históricas.
- **Volver a pedir** (`POST /api/orders/[id]/reorder`,
  `src/lib/order-reorder.ts`): parte de cualquier pedido permitido; valida
  existencia/activo/stock/mínimos ACTUALES, resuelve precios ACTUALES del
  perfil del visor y carga el carrito activo (`mode: add|replace` con
  conflicto controlado, `allowPartial` con confirmación explícita). El pedido
  origen queda intacto; al confirmar se genera un pedido nuevo con número
  distinto.

## Pedido vs Cotización

`Order.requestType = 'pedido' | 'cotizacion'` (existentes => `'pedido'`).
La validación compartida (`validateAndPriceItems` en
`src/lib/cart-validation.ts`) acepta `requestType`:

- `pedido`: cada línea exige precio resuelto > 0.
- `cotizacion`: permite líneas con precio no resuelto (`unitPrice = null`),
  validando igualmente producto, variante, cantidad, mínimos e inventario.

El `agentId` del pedido proviene siempre del maestro del cliente
(`User.assignedAgentId`) vía `resolveOrderCustomer`; nunca del navegador. El
webhook incluye `requestType`, `agentId` y `agentName` para enrutamiento
interno; un fallo de webhook NO pierde la solicitud (el Order persiste con
`webhookSent = false` y el resultado en `webhookResponse`).

## Carrito compartido

La página `/carrito/[uuid]` y el API `GET /api/carts/[uuid]` usan la MISMA
política y el MISMO DTO (`src/lib/shared-cart.ts`): el UUID funciona como
capability-link de lectura; cada visor ve SU precio autorizado (motor único,
contexto de su sesión) y el DTO público nunca incluye email/teléfono del
dueño, su snapshot de precio ni datos administrativos.

## Transferencia de sesión (invitado -> cliente)

En login/registro se sigue usando `transferSessionDataToUser`
(`src/lib/checkout.ts`, `src/lib/order-cart-upsert.ts`): transfiere el
carrito activo de la sesión al usuario y reasigna las órdenes de la sesión
(`sessionId = null`, `customerId = userId`). Con la semántica nueva esto
puede transferir MÚLTIPLES órdenes sin conflicto de índices.
