# Sistema de estilos globales (Compusum)

## Objetivo

Permitir que cambios de tema (colores, bordes, sombras, tipografia, animaciones y transiciones) se hagan desde un unico lugar y se propaguen a toda la app.

## Fuente unica de verdad

- Tokens globales: `src/app/globals.css` en `:root`
- Componentes base reutilizables: `src/components/ui/**`
- Variantes de componentes: `cva` (class-variance-authority)

## Flujo obligatorio para cambios nuevos

1. Definir o actualizar token en `:root` de `src/app/globals.css`.
2. Consumir el token desde clases/utilidades globales o variantes `cva`.
3. Evitar colores hardcodeados (`#hex`, `rgb`, `rgba`) en componentes/paginas nuevas.
4. Evitar `style={{ fontFamily: "var(--font-fredoka)" }}` en nuevos elementos.
5. Ejecutar `bun run styles:guard` antes de cerrar el cambio.

## Convenciones recomendadas

- Tipografia:
  - Titulos: clase `font-heading`
  - Texto general: clase `font-body`
- Botones:
  - Reutilizar `Button` de `src/components/ui/button.tsx`
  - Si falta una variante, agregarla en `buttonVariants` (no duplicar clases por pagina)
- Superficies y bordes:
  - Usar tokens `--theme-bg-*` y `--theme-border-*`
- Movimiento:
  - Usar tokens `--motion-duration-*` y `--motion-easing-*`

## Cambio de tema rapido

Cuando el cliente pida nuevo tema:

1. Cambiar los tokens de color en `:root` (`--color-primary`, `--color-accent`, etc.).
2. Ajustar gradientes y estados (`--gradient-*`, `--theme-*-soft`).
3. Ajustar radios/sombras si hace falta (`--radius-*`, `--shadow-*`).
4. Verificar con `bun run styles:guard`.

## Nota sobre legado

Existen secciones historicas con estilos hardcodeados. El guard actual protege cambios nuevos para evitar agregar deuda visual. La migracion completa del legado puede hacerse incrementalmente por pagina/componente.
