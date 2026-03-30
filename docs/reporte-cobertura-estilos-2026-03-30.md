# Reporte de cobertura de estilos globales

Fecha: 2026-03-30

## Resumen ejecutivo

La migracion de estilos globales quedo aplicada en paginas publicas clave, componentes reutilizables de tienda, capa admin y componentes base de UI sensibles.

Estado actual:

- Guard de gobernanza: OK (`bun run styles:guard`)
- Deuda de estilos fuera de excepciones: 0 archivos funcionales de app/componentes
- Coincidencias restantes del auditor regex: 2 archivos (esperado)

## Resultado de auditoria (regex)

Patron auditado:

- `fontFamily\s*:|#[0-9a-fA-F]{3,8}\b|rgba\(`

Coincidencias por archivo:

- 86 -> `src/app/globals.css`
- 3 -> `src/app/admin/configuracion/page.tsx`

Coincidencias por carpeta tope:

- 89 -> `src`

## Interpretacion

Las coincidencias restantes son intencionales y no representan deuda de estilo en componentes/paginas nuevas:

1. `src/app/globals.css`

- Es el origen central de tokens y utilidades globales.
- Contiene valores base de color, sombras, gradientes y efectos; su presencia es esperada.

2. `src/app/admin/configuracion/page.tsx`

- Usa fallback y placeholder hex para `type="color"`.
- Este caso es funcional (entrada de configuracion), no hardcode visual de layout/componente.

## Cobertura alcanzada

Quedaron alineados a clases semanticas y tipografia global (`font-heading`/`font-body`) los siguientes grupos:

- Paginas publicas: home, marcas, contacto, nosotros, mayoristas, catalogo, producto, checkout, temporadas
- Componentes store reutilizables: header, footer, product-card, category-card, shared-cart-view
- Componentes admin clave: header y sidebar
- UI base: chart

## Recomendacion operativa

Mantener este flujo para cualquier cambio UI futuro:

1. Definir o ajustar token en `src/app/globals.css`.
2. Consumir el token desde clases semanticas/variantes.
3. Evitar estilos inline y literales de color en nuevos componentes.
4. Validar siempre con `bun run styles:guard`.
