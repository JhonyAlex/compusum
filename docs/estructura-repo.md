# Estructura del repositorio

Este documento describe, carpeta por carpeta, la organizacion general del proyecto y el proposito de cada area principal.

## Directorios de soporte

### `.git/` y `.zscripts/`

- `.git/`: archivos internos para el control de versiones y el historial de commits.
- `.zscripts/`: scripts o herramientas internas automatizadas, posiblemente ligadas al entorno local o configuraciones auxiliares.

### `db/`

Contiene scripts, respaldos locales o configuraciones adicionales relacionadas con la base de datos, aparte de Prisma.

### `download/` y `upload/`

Carpetas temporales o de desarrollo para manejar archivos subidos por usuarios o archivos preparados para descarga, como imagenes, recibos o catalogos PDF.

### `examples/`

Incluye bloques de codigo o plantillas de ejemplo del scaffold original para mostrar como implementar ciertas funcionalidades usando los componentes integrados.

### `mini-services/`

Puede contener scripts o servicios pequenos e independientes, como procesos en segundo plano, sincronizadores o tareas programadas que no corren dentro del servidor principal de Next.js.

## Capa de datos y recursos estaticos

### `prisma/`

Es el nucleo de la capa de base de datos. Aqui normalmente viven:

- `schema.prisma`: el plano arquitectonico de las tablas y relaciones.
- migraciones: el historial de cambios aplicados a la base de datos.
- `seed.ts` u otros archivos de carga inicial: datos base para pruebas o arranque del proyecto.

### `public/`

Todo lo que esta aqui es accesible publicamente desde el navegador. Suele incluir:

- `favicon.ico`
- logos e imagenes estaticas
- fuentes personalizadas
- otros assets publicos usados por el sitio

## Codigo fuente principal

### `src/`

Es la carpeta mas importante del proyecto y donde se concentra casi todo el trabajo diario. Contiene el codigo fuente real de la aplicacion React/Next.js.

### `src/app/`

En Next.js 14/15/16, cada carpeta dentro de `src/app/` se traduce en una ruta o segmento de navegacion del sitio.

Rutas y areas destacadas:

- `src/app/api/`: backend del proyecto; aqui viven endpoints que se conectan con Prisma o con otras capas de negocio.
- `src/app/admin/`: panel administrativo privado de la tienda, con su propio layout, vistas y manejo de sesion.
- `src/app/catalogo/`, `src/app/producto/`, `src/app/marcas/`, `src/app/temporadas/`, `src/app/mayoristas/`, `src/app/nosotros/`, `src/app/contacto/`: secciones visibles para el cliente final.
- `src/app/layout.tsx`: layout global compartido, normalmente con header, footer y estructura comun.
- `src/app/globals.css`: hoja de estilos principal con Tailwind CSS y estilos globales.

### `src/components/`

Guarda componentes reutilizables de React, es decir, piezas de interfaz que pueden compartirse entre varias paginas o flujos.

Es comun encontrar subcarpetas como:

- `src/components/ui/`: componentes base de `shadcn/ui`, como botones, modales e inputs.
- otras carpetas como `layout/`, `forms/` o `cards/`: componentes agrupados por responsabilidad visual o funcional.

### `src/hooks/`

Contiene custom hooks de React para encapsular logica reutilizable, por ejemplo manejo de carrito, estado compartido o integraciones con datos.

### `src/lib/`

Reune utilidades y logica auxiliar que no pertenece a la capa visual. Aqui suelen vivir:

- inicializacion de Prisma, como `prisma.ts`
- helpers de formato, como funciones de moneda
- utilidades de autenticacion
- funciones compartidas por distintas partes del sistema

## Archivos de configuracion en la raiz

- `package.json`: dependencias del proyecto y scripts para desarrollo, build y ejecucion.
- `tailwind.config.ts`: configuracion de colores, fuentes y extensiones de Tailwind.
- `next.config.ts`: configuracion principal del framework Next.js.
- `eslint.config.mjs` y `tsconfig.json`: reglas de calidad de codigo y configuracion de TypeScript.
- `Dockerfile` y `Caddyfile`: definiciones para despliegue, empaquetado y exposicion de la aplicacion en servidor.

## Nota general

La estructura del repositorio esta bien separada: `components` organiza la interfaz reutilizable, `app` define las rutas y paginas, `prisma` centraliza la base de datos y `lib` concentra utilidades y logica compartida.
