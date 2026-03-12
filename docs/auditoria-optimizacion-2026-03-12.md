# Auditoria profunda y plan de optimizacion (2026-03-12)

## Resumen ejecutivo

El proyecto tiene una base solida para ecommerce B2B (Prisma + checkout + admin + rutas), pero varios componentes de la solicitud original estaban implementados de forma parcial o desconectados del flujo real que usa la web.

Se ejecutaron cambios para conectar la logica avanzada al flujo efectivo de pedidos y visibilizarla en frontend.

## Diagnostico por modulo

### 1) Identidad y autenticacion dual

Estado previo: Parcial
- Existia login por telefono OTP en backend, pero sin sesion HTTP activa en algunos flujos.
- Existia logica de login por contrasena en libreria, sin endpoint cliente unificado.
- El upsert inteligente no estaba conectado al endpoint principal de pedidos.

Estado actual: Parcial alto
- El endpoint principal de pedidos ahora ejecuta upsert de cliente (telefono/email) y conserva asesor previo.
- Login por telefono ahora deja cookie de sesion.
- Se agrego endpoint cliente unificado para login por telefono o contrasena.

Pendiente:
- Flujo UI de portal cliente para autenticacion dual completa.
- Flujo para definir/cambiar contrasena desde portal.

### 2) Catalogo y carrito

Estado previo: Parcial
- Modo catalogo global existia, pero habia fugas de precios en carrito compartido y filas de carrito.

Estado actual: Mejorado
- Se ocultaron precios en carrito lateral, checkout y carrito compartido cuando el modo catalogo global esta activo.
- Se mantiene funcionalidad de agregar al carrito.

Pendiente:
- Extender ocultamiento a historiales de cliente y detalles de pedido del portal cliente cuando ese modulo exista.

### 3) Logistica y rutas dinamicas

Estado previo: Parcial
- Existia estimacion simple, pero no siempre reflejaba ventana de corte de forma clara para UX.
- El selector de ciudad no mostraba retroalimentacion dinamica en tiempo real del endpoint de estimacion.

Estado actual: Mejorado
- Estimacion ahora clasifica estados: available, cutoff_passed, unavailable.
- Mensajes dinamicos visibles en selector de ciudad durante checkout.
- Pedido principal asigna ruta automaticamente segun ciudad y ventana.

Pendiente:
- CRUD admin completo para rutas, ciudades, dias de visita y cut-off dinamico por dia.

### 4) Asesores comerciales

Estado previo: Bajo
- Modelo de datos soporta asignacion (assignedAgentId/agentId), pero no existe panel dedicado ni RBAC estricto por asesor.

Estado actual: Parcial
- Nuevo pedido respeta asesor historico del cliente cuando existe.

Pendiente:
- Vistas/endpoint filtrados por asesor.
- Boton WhatsApp directo con plantilla por asesor en panel de trabajo diario.

### 5) Portal cliente

Estado previo: Bajo
- No se identifica modulo completo de portal cliente (historial autenticado, edicion de pendientes, reorder 1-click).

Estado actual: Sin cambios estructurales
- Se deja como fase siguiente prioritaria.

## Cambios implementados (codigo)

1. Integracion de upsert + asignacion comercial + ruta en flujo real de pedidos
- Archivo: src/app/api/orders/route.ts
- Impacto: El pedido creado desde web ahora vincula customerId, agentId y routeId.

2. Consolidacion de utilidades de checkout
- Archivo: src/lib/checkout.ts
- Impacto:
  - normalizePhone
  - normalizeEmail
  - upsertCheckoutCustomer
  - findBestRouteForCity

3. Mejora de motor de estimacion logistica
- Archivo: src/lib/shipping-calc.ts
- Impacto: Mensajes contextuales con estado de disponibilidad y corte.

4. Feedback en tiempo real en UI de ciudad
- Archivo: src/components/store/city-selector.tsx
- Impacto: Mensaje dinamico por ciudad consumiendo /api/shipping/estimate.

5. Endurecimiento de autenticacion dual
- Archivo: src/app/api/auth/phone/route.ts
- Impacto: setSessionCookie para login por telefono.

6. Endpoint cliente dual (telefono o contrasena)
- Archivo: src/app/api/auth/customer/login/route.ts

7. Modo catalogo estricto en vistas clave de carrito/checkout
- Archivos:
  - src/components/store/cart-item-row.tsx
  - src/components/store/cart-sheet.tsx
  - src/components/store/checkout-flow.tsx
  - src/app/carrito/[uuid]/page.tsx
  - src/components/store/shared-cart-view.tsx

## Plan de optimizacion detallado

### Fase 1 (1-2 dias): consolidacion funcional

- Crear endpoint de checkout unificado y deprecacion controlada de rutas legacy duplicadas.
- Agregar tests de integracion para:
  - upsert de cliente por telefono/email
  - preservacion de asesor
  - asignacion de ruta por ciudad + cut-off
- Agregar telemetria de conversion en checkout (pasos, errores validacion, abandonos).

### Fase 2 (3-5 dias): modulo asesores operativo

- RBAC real por rol AGENT en middleware/API.
- Panel asesor: lista de clientes/pedidos asignados.
- Acciones rapidas WhatsApp con plantillas por estado.
- Filtros por estado, ciudad y antiguedad de pedido.

### Fase 3 (4-7 dias): portal cliente completo

- Login dual UI (telefono OTP / contrasena).
- Historial de pedidos autenticado por cliente.
- Reabrir/editar pedidos en estado pendiente o carrito abandonado.
- Reorden 1-click creando nuevo carrito con snapshot validado.

### Fase 4 (3-4 dias): logistica avanzada admin

- CRUD de rutas por dia de semana, capacidad diaria y cut-off configurable por ciudad.
- Simulador de promesa de entrega en admin.
- Alertas de capacidad y corte proximo.

### Fase 5 (2-3 dias): seguridad, calidad y escalabilidad

- Rate limiting en auth OTP/login.
- Auditoria de sesiones y expiracion por contexto.
- Indices adicionales en tablas de alta lectura.
- Contratos API con validacion estructurada (zod).
- Suite de pruebas E2E checkout-logistica-catalogo.

## KPIs sugeridos para validar que si hubo cambios efectivos

- % pedidos con customerId y routeId no nulos.
- % pedidos de clientes recurrentes con agentId preservado.
- Tiempo medio de finalizacion de checkout por ciudad.
- Conversion en modo catalogo (carrito -> pedido).
- Tasa de error por endpoint critico (orders/auth/shipping estimate).

## Riesgos y mitigacion

- Riesgo: inconsistencias por datos historicos no normalizados de telefono.
  Mitigacion: migracion de normalizacion + script de reconciliacion.

- Riesgo: colision de orderNumber por concurrencia alta.
  Mitigacion: secuencia transaccional o sufijo aleatorio controlado.

- Riesgo: UX confusa con mensajes logisticos si faltan rutas/cutoff.
  Mitigacion: fallback explicito y CTA de contacto comercial.
