# 🏗️ PROMPT MAESTRO — Tienda Web COMPUSUM
## Node.js · MySQL · Spaceship Hosting · Panel Admin

---

## 📋 ÍNDICE DE FASES

| Fase | Descripción | Prioridad |
|------|-------------|-----------|
| 0 | Arquitectura y entorno | 🔴 Crítica |
| 1 | Base de datos MySQL | 🔴 Crítica |
| 2 | Backend API REST (Node.js + Express) | 🔴 Crítica |
| 3 | Panel de Administración | 🔴 Crítica |
| 4 | Frontend público (Tienda) | 🟡 Alta |
| 5 | WhatsApp + Cotizador | 🟡 Alta |
| 6 | SEO, rendimiento y seguridad | 🟢 Media |
| 7 | Deploy en Spaceship | 🟢 Media |
| 8 | Post-lanzamiento | ⚪ Continua |

---

## ═══════════════════════════════════════════
## FASE 0 — ARQUITECTURA Y CONFIGURACIÓN DEL ENTORNO
## ═══════════════════════════════════════════

### 🎯 Objetivo
Definir el stack tecnológico, la estructura de carpetas y preparar el entorno de desarrollo.

### Stack Tecnológico

```
BACKEND:
- Node.js v20+ LTS
- Express.js 4.x (framework HTTP)
- Sequelize ORM (interacción con MySQL)
- MySQL 8.x (base de datos)
- multer (subida de imágenes)
- sharp (optimización de imágenes, thumbnails)
- jsonwebtoken + bcryptjs (autenticación admin)
- cors, helmet, express-rate-limit (seguridad)
- dotenv (variables de entorno)
- express-validator (validación de datos)
- nodemailer (correo formulario contacto)

FRONTEND PÚBLICO:
- EJS o Handlebars (templates server-side) — O React/Next.js si prefieres SPA
- Tailwind CSS 3.x (estilos)
- Swiper.js (carruseles de productos/marcas)
- AOS (Animate On Scroll — animaciones al hacer scroll)
- Lightbox2 o GLightbox (galería de imágenes de productos)
- Lazysizes (lazy loading de imágenes)

PANEL ADMIN:
- EJS con templates separados — O React (panel SPA independiente)
- Chart.js (estadísticas básicas)
- DataTables o similar (tablas de productos)
- Dropzone.js (subida drag & drop de imágenes)

HERRAMIENTAS:
- npm (gestor de paquetes)
- nodemon (desarrollo)
- PM2 (producción en Spaceship)
- Git + GitHub (control de versiones)
```

### Estructura de Carpetas

```
compusum/
├── .env                          # Variables de entorno
├── .env.example                  # Plantilla de variables
├── .gitignore
├── package.json
├── server.js                     # Entry point
├── config/
│   ├── database.js               # Conexión MySQL con Sequelize
│   ├── multer.js                 # Configuración subida imágenes
│   └── constants.js              # Constantes globales (colores, meta, etc.)
├── models/                       # Modelos Sequelize
│   ├── index.js                  # Carga y asociación de modelos
│   ├── User.js
│   ├── Category.js
│   ├── Brand.js
│   ├── Product.js
│   ├── ProductImage.js
│   ├── Season.js
│   ├── Banner.js
│   ├── ContactMessage.js
│   └── Setting.js
├── controllers/
│   ├── admin/                    # Controladores del panel admin
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── brandController.js
│   │   ├── seasonController.js
│   │   ├── bannerController.js
│   │   ├── settingController.js
│   │   └── messageController.js
│   └── public/                   # Controladores del sitio público
│       ├── homeController.js
│       ├── catalogController.js
│       ├── brandController.js
│       ├── seasonController.js
│       ├── contactController.js
│       └── pageController.js
├── routes/
│   ├── admin.js                  # Rutas admin (/admin/*)
│   ├── api.js                    # API REST (/api/v1/*)
│   └── public.js                 # Rutas públicas (/*)
├── middleware/
│   ├── auth.js                   # Verificar JWT/sesión admin
│   ├── upload.js                 # Middleware de subida
│   ├── errorHandler.js           # Manejo global de errores
│   └── validators/               # Validaciones por entidad
│       ├── productValidator.js
│       └── categoryValidator.js
├── services/
│   ├── imageService.js           # Redimensionar, optimizar, eliminar
│   ├── whatsappService.js        # Generar enlaces WA prellenados
│   └── emailService.js           # Envío correos (contacto)
├── utils/
│   ├── slugify.js                # Generar slugs URL-friendly
│   ├── pagination.js             # Helper de paginación
│   └── helpers.js                # Formatear precios, etc.
├── public/                       # Archivos estáticos
│   ├── css/
│   ├── js/
│   ├── images/
│   │   ├── brands/               # Logos de marcas
│   │   ├── products/             # Fotos de productos
│   │   ├── banners/              # Imágenes hero/banners
│   │   ├── seasons/              # Imágenes de temporada
│   │   └── icons/                # Iconos personalizados
│   └── uploads/                  # Subidas dinámicas
├── views/
│   ├── layouts/
│   │   ├── main.ejs              # Layout público principal
│   │   └── admin.ejs             # Layout panel admin
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   ├── navbar.ejs
│   │   ├── whatsapp-float.ejs
│   │   ├── product-card.ejs
│   │   └── brand-carousel.ejs
│   ├── public/                   # Páginas del sitio
│   │   ├── home.ejs
│   │   ├── catalog.ejs
│   │   ├── product-detail.ejs
│   │   ├── brands.ejs
│   │   ├── seasons.ejs
│   │   ├── wholesalers.ejs
│   │   ├── about.ejs
│   │   └── contact.ejs
│   └── admin/                    # Páginas del panel admin
│       ├── login.ejs
│       ├── dashboard.ejs
│       ├── products/
│       │   ├── index.ejs
│       │   ├── create.ejs
│       │   └── edit.ejs
│       ├── categories/
│       │   ├── index.ejs
│       │   └── form.ejs
│       ├── brands/
│       │   ├── index.ejs
│       │   └── form.ejs
│       ├── banners/
│       │   ├── index.ejs
│       │   └── form.ejs
│       ├── seasons/
│       │   ├── index.ejs
│       │   └── form.ejs
│       ├── messages/
│       │   └── index.ejs
│       └── settings/
│           └── index.ejs
└── seeds/
    ├── adminSeed.js              # Crear usuario admin por defecto
    └── categorySeed.js           # Categorías iniciales
```

### Archivo .env

```env
# === SERVIDOR ===
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# === BASE DE DATOS ===
DB_HOST=localhost
DB_PORT=3306
DB_NAME=compusum_db
DB_USER=root
DB_PASS=tu_password_segura
DB_DIALECT=mysql

# === AUTENTICACIÓN ADMIN ===
JWT_SECRET=clave_super_secreta_cambiar_en_produccion_64chars
JWT_EXPIRES_IN=7d
SESSION_SECRET=otra_clave_secreta_para_sesiones

# === SUBIDA DE IMÁGENES ===
UPLOAD_MAX_SIZE=5242880
UPLOAD_PATH=./public/uploads

# === CORREO (Nodemailer) ===
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=info@compusum.com
MAIL_PASS=app_password_aqui
MAIL_FROM="Compusum <info@compusum.com>"

# === WHATSAPP ===
WHATSAPP_NUMBER=576063335206
WHATSAPP_DEFAULT_MESSAGE=Hola, quiero cotizar los siguientes productos:

# === REDES SOCIALES ===
INSTAGRAM_URL=https://www.instagram.com/compusumsas
FACEBOOK_URL=https://www.facebook.com/CompusumSAS

# === GOOGLE MAPS ===
GOOGLE_MAPS_EMBED_KEY=tu_api_key
STORE_ADDRESS=Carrera 6 #24-14, Pereira, Risaralda, Colombia
STORE_LAT=4.8133
STORE_LNG=-75.6961
```

### Instrucción para iniciar el proyecto

```
PROMPT PARA IA / INSTRUCCIÓN:

"Inicializa un proyecto Node.js con la siguiente configuración:
1. npm init con nombre 'compusum-web', versión 1.0.0
2. Instala dependencias:
   npm install express sequelize mysql2 ejs express-ejs-layouts
   dotenv cors helmet express-rate-limit jsonwebtoken bcryptjs
   multer sharp express-validator nodemailer connect-flash
   express-session cookie-parser morgan slugify

3. Instala dependencias de desarrollo:
   npm install -D nodemon

4. Configura scripts en package.json:
   - "dev": "nodemon server.js"
   - "start": "node server.js"
   - "seed": "node seeds/adminSeed.js"

5. Crea el archivo server.js como entry point con Express configurado,
   EJS como motor de vistas, middlewares de seguridad, rutas separadas
   para admin, api y público.

6. Crea config/database.js con Sequelize apuntando a las variables .env"
```

---

## ═══════════════════════════════════════════
## FASE 1 — BASE DE DATOS MYSQL
## ═══════════════════════════════════════════

### 🎯 Objetivo
Diseñar y crear todas las tablas necesarias para el catálogo, admin, y contenido del sitio.

### Diagrama de Entidades

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   categories │     │    brands     │     │     seasons       │
├──────────────┤     ├──────────────┤     ├──────────────────┤
│ id           │     │ id           │     │ id               │
│ name         │     │ name         │     │ name             │
│ slug         │     │ slug         │     │ slug             │
│ description  │     │ description  │     │ description      │
│ image        │     │ logo         │     │ image            │
│ icon         │     │ website      │     │ start_date       │
│ parent_id FK │◄──┐ │ is_active    │     │ end_date         │
│ sort_order   │   │ │ sort_order   │     │ is_active        │
│ is_active    │   │ └──────────────┘     └──────────────────┘
│ created_at   │   │        │                      │
└──────────────┘   │        │                      │
       │           │        │                      │
       │           │  ┌─────┴──────────────────────┴───┐
       │           │  │           products              │
       │           │  ├────────────────────────────────┤
       └───────────┼──│ id                             │
                   │  │ name                           │
                   │  │ slug                           │
                   │  │ sku (código referencia)        │
                   │  │ description                    │
                   │  │ short_description              │
                   │  │ category_id FK ────────────────┤
                   │  │ brand_id FK                    │
                   │  │ season_id FK (nullable)        │
                   │  │ price (precio referencia)      │
                   │  │ wholesale_price (mayorista)    │
                   │  │ min_wholesale_qty              │
                   │  │ stock_status ENUM              │
                   │  │ is_featured (destacado)        │
                   │  │ is_new (novedad)               │
                   │  │ is_active                      │
                   │  │ tags                           │
                   │  │ sort_order                     │
                   │  │ views_count                    │
                   │  │ created_at                     │
                   │  │ updated_at                     │
                   │  └────────────────────────────────┘
                   │          │
                   │          │ 1:N
                   │  ┌───────┴────────────┐
                   │  │  product_images     │
                   │  ├────────────────────┤
                   │  │ id                 │
                   │  │ product_id FK      │
                   │  │ image_path         │
                   │  │ thumbnail_path     │
                   │  │ alt_text           │
                   │  │ is_primary         │
                   │  │ sort_order         │
                   │  └────────────────────┘
                   │
    ┌──────────────┴───┐  ┌─────────────────┐  ┌──────────────────┐
    │ product_seasons  │  │    banners       │  │ contact_messages  │
    ├──────────────────┤  ├─────────────────┤  ├──────────────────┤
    │ product_id FK    │  │ id              │  │ id               │
    │ season_id FK     │  │ title           │  │ name             │
    └──────────────────┘  │ subtitle        │  │ email            │
                          │ image_desktop   │  │ phone            │
    ┌──────────────────┐  │ image_mobile    │  │ city             │
    │     users        │  │ link_url        │  │ message          │
    ├──────────────────┤  │ link_text       │  │ type ENUM        │
    │ id               │  │ position ENUM   │  │ is_read          │
    │ name             │  │ is_active       │  │ created_at       │
    │ email            │  │ sort_order      │  └──────────────────┘
    │ password (hash)  │  │ starts_at       │
    │ role ENUM        │  │ ends_at         │  ┌──────────────────┐
    │ is_active        │  └─────────────────┘  │    settings       │
    │ last_login       │                       ├──────────────────┤
    │ created_at       │                       │ id               │
    └──────────────────┘                       │ key (unique)     │
                                               │ value (TEXT)     │
                                               │ type ENUM        │
                                               │ group            │
                                               └──────────────────┘
```

### Prompt para crear los modelos Sequelize

```
PROMPT PARA IA / INSTRUCCIÓN:

"Crea todos los modelos Sequelize para una tienda de papelería llamada Compusum
con las siguientes tablas y relaciones:

1. **Category** — Categorías con soporte para subcategorías (parent_id self-ref).
   Campos: id, name, slug (auto-generado, único), description (TEXT),
   image, icon (clase CSS o emoji), parent_id (FK a categories, nullable),
   sort_order (INT default 0), is_active (BOOLEAN default true),
   meta_title, meta_description, created_at, updated_at.

2. **Brand** — Marcas/proveedores.
   Campos: id, name, slug (único), description (TEXT), logo (path imagen),
   website (URL, nullable), is_active (BOOLEAN default true),
   sort_order (INT default 0), created_at, updated_at.

3. **Season** — Temporadas comerciales (escolar, navidad, regreso a clases).
   Campos: id, name, slug, description, image, start_date (DATE),
   end_date (DATE), is_active, color_hex (para badge), created_at, updated_at.

4. **Product** — Productos del catálogo.
   Campos: id, name, slug (único), sku (VARCHAR 50, único, nullable),
   description (TEXT), short_description (VARCHAR 500),
   category_id (FK), brand_id (FK, nullable), price (DECIMAL 12,2, nullable),
   wholesale_price (DECIMAL 12,2, nullable), min_wholesale_qty (INT default 1),
   stock_status (ENUM: 'disponible', 'agotado', 'por_pedido', default 'disponible'),
   is_featured (BOOLEAN default false), is_new (BOOLEAN default false),
   is_active (BOOLEAN default true), tags (VARCHAR 500, nullable),
   sort_order (INT default 0), views_count (INT default 0),
   meta_title, meta_description, created_at, updated_at.

5. **ProductImage** — Imágenes de productos (1 producto → N imágenes).
   Campos: id, product_id (FK), image_path, thumbnail_path,
   alt_text, is_primary (BOOLEAN default false), sort_order, created_at.

6. **ProductSeason** — Tabla pivote producto ↔ temporada (N:M).
   Campos: product_id (FK), season_id (FK). Primary key compuesta.

7. **Banner** — Banners/sliders del home y secciones.
   Campos: id, title, subtitle, image_desktop, image_mobile (nullable),
   link_url (nullable), link_text (default 'Ver más'),
   position (ENUM: 'hero', 'promo', 'category', 'brand'),
   is_active, sort_order, starts_at (DATE, nullable), ends_at (DATE, nullable),
   created_at, updated_at.

8. **ContactMessage** — Mensajes del formulario de contacto.
   Campos: id, name, email, phone (nullable), city (nullable),
   company (nullable), message (TEXT), type (ENUM: 'consulta', 'cotizacion',
   'queja', 'otro'), is_read (BOOLEAN default false), notes (TEXT, nullable),
   created_at.

9. **User** — Usuarios del panel admin.
   Campos: id, name, email (único), password (hash), role (ENUM: 'admin',
   'editor', default 'editor'), is_active (BOOLEAN default true),
   last_login (DATETIME, nullable), created_at, updated_at.

10. **Setting** — Configuraciones dinámicas del sitio.
    Campos: id, key (VARCHAR 100, único), value (TEXT),
    type (ENUM: 'text', 'number', 'boolean', 'json', 'image'),
    group (VARCHAR 50: 'general', 'contact', 'social', 'shipping', 'seo'),
    label (VARCHAR 200), created_at, updated_at.

RELACIONES:
- Category hasMany Category (subcategorías, parent_id)
- Category hasMany Product
- Brand hasMany Product
- Product belongsTo Category, Brand
- Product hasMany ProductImage
- Product belongsToMany Season through ProductSeason
- Season belongsToMany Product through ProductSeason

CONFIGURACIONES:
- Timestamps automáticos (createdAt, updatedAt) con underscored: true
- Tabla en plural, modelo en singular
- Charset utf8mb4, collation utf8mb4_unicode_ci
- Usar paranoid: false (no soft-delete por ahora)

Incluye el archivo models/index.js que cargue todos los modelos,
establezca las asociaciones y exporte { sequelize, models }."
```

### Seed inicial de datos

```
PROMPT PARA IA / INSTRUCCIÓN:

"Crea los siguientes seeds para la base de datos de Compusum:

1. **seeds/adminSeed.js** — Crea un usuario admin:
   - nombre: 'Administrador Compusum'
   - email: 'admin@compusum.com'
   - password: hasheada con bcrypt (ej: 'Compusum2025!')
   - role: 'admin'

2. **seeds/categorySeed.js** — Crea las categorías iniciales:
   - Escolar (subcats: Crayones y Colores, Cuadernos y Agendas,
     Plastilinas, Loncheras, Útiles Varios)
   - Oficina (subcats: Resmas y Papel, Archivadores y Carpetas,
     Adhesivos y Cintas, Marcadores y Resaltadores, Bolígrafos y Lápices)
   - Arte y Manualidades (subcats: Acrílicos y Vinilos, Marcadores Lettering,
     Papeles Especiales, Pinceles y Herramientas)
   - Tecnología y Accesorios (subcats: Teclados y Mouse, Cables y Adaptadores,
     Pilas y Baterías, Memorias USB)
   - Ergonomía y Organización (subcats: Bases para Monitor,
     Organizadores de Escritorio)

3. **seeds/brandSeed.js** — Crea marcas:
   - Faber-Castell, Kores, Legis, Doricolor, Rapid, Tintas y Trazos,
     Panasonic, Norma, Pelikan, Familia, Bic

4. **seeds/settingSeed.js** — Crea configuraciones:
   - store_name: 'Compusum'
   - store_slogan: 'Tu papelería al por mayor'
   - store_phone: '606 333-5206'
   - store_address: 'Carrera 6 #24-14, Pereira, Risaralda'
   - store_email: 'info@compusum.com'
   - whatsapp_number: '576063335206'
   - instagram: '@compusumsas'
   - facebook: 'Compusum S.A.S.'
   - shipping_info: 'Envíos a todo Colombia'
   - primary_color: '#0D4DAA'
   - secondary_color: '#6DA8FF'
   - accent_color: '#E89A00'
   - alert_color: '#FF6A00'

Cada seed debe verificar si los datos ya existen antes de insertar
(idempotente). Agrega un script 'seed:all' en package.json."
```

---

## ═══════════════════════════════════════════
## FASE 2 — BACKEND API REST
## ═══════════════════════════════════════════

### 🎯 Objetivo
Crear la API que alimenta tanto el panel admin como el frontend público.

### Endpoints API

```
PROMPT PARA IA / INSTRUCCIÓN:

"Crea una API REST con Express.js para la tienda Compusum con los
siguientes grupos de rutas:

═══ AUTENTICACIÓN (POST /api/v1/auth) ═══
POST /login          → Login admin, devuelve JWT
POST /logout         → Invalida sesión
GET  /me             → Datos del usuario logueado

═══ PRODUCTOS (CRUD completo, requiere auth admin) ═══
GET    /api/v1/products          → Listar (paginado, filtros: category, brand,
                                    season, stock_status, search, is_featured,
                                    is_new, is_active. Ordenar por: name, price,
                                    created_at, views_count)
GET    /api/v1/products/:slug    → Detalle de producto con imágenes, marca, categoría
POST   /api/v1/products          → Crear producto (con imágenes via multer)
PUT    /api/v1/products/:id      → Editar producto
DELETE /api/v1/products/:id      → Eliminar producto y sus imágenes
POST   /api/v1/products/:id/images → Subir imágenes adicionales
DELETE /api/v1/products/:id/images/:imageId → Eliminar imagen específica
PATCH  /api/v1/products/:id/toggle → Activar/desactivar producto
PATCH  /api/v1/products/bulk-action → Acciones masivas (activar, desactivar, eliminar)

═══ CATEGORÍAS ═══
GET    /api/v1/categories        → Listar (árbol jerárquico con subcategorías)
GET    /api/v1/categories/:slug  → Detalle con productos
POST   /api/v1/categories        → Crear
PUT    /api/v1/categories/:id    → Editar
DELETE /api/v1/categories/:id    → Eliminar (validar que no tenga productos)

═══ MARCAS ═══
GET    /api/v1/brands            → Listar
GET    /api/v1/brands/:slug      → Detalle con productos
POST   /api/v1/brands            → Crear (con logo)
PUT    /api/v1/brands/:id        → Editar
DELETE /api/v1/brands/:id        → Eliminar

═══ TEMPORADAS ═══
GET    /api/v1/seasons           → Listar (activas primero)
GET    /api/v1/seasons/:slug     → Detalle con productos
POST   /api/v1/seasons           → Crear
PUT    /api/v1/seasons/:id       → Editar
DELETE /api/v1/seasons/:id       → Eliminar

═══ BANNERS ═══
GET    /api/v1/banners           → Listar por posición
POST   /api/v1/banners           → Crear (con imágenes desktop/mobile)
PUT    /api/v1/banners/:id       → Editar
DELETE /api/v1/banners/:id       → Eliminar
PATCH  /api/v1/banners/:id/toggle → Activar/desactivar

═══ MENSAJES DE CONTACTO ═══
GET    /api/v1/messages          → Listar (filtro: is_read, type)
GET    /api/v1/messages/:id      → Ver detalle (marca como leído)
POST   /api/v1/messages          → Crear (público, sin auth) + enviar email notificación
DELETE /api/v1/messages/:id      → Eliminar
PATCH  /api/v1/messages/:id/read → Marcar como leído/no leído

═══ CONFIGURACIONES ═══
GET    /api/v1/settings          → Todas las configuraciones (agrupadas)
GET    /api/v1/settings/:group   → Configuraciones por grupo
PUT    /api/v1/settings          → Actualizar múltiples configuraciones

═══ DASHBOARD (solo admin) ═══
GET    /api/v1/dashboard/stats   → Total productos, categorías, marcas,
                                    mensajes sin leer, productos destacados,
                                    visitas recientes

═══ PÚBLICO (sin autenticación) ═══
GET    /api/v1/public/home       → Datos para el home: banners hero,
                                    categorías principales, productos destacados,
                                    novedades, marcas activas, temporada activa
GET    /api/v1/public/catalog    → Catálogo con filtros y paginación
GET    /api/v1/public/search     → Búsqueda global (productos, categorías, marcas)

ESPECIFICACIONES TÉCNICAS:
- Toda respuesta sigue formato: { success: bool, data: {}, message: '', errors: [] }
- Paginación: { data: [], pagination: { page, limit, total, totalPages } }
- Imágenes: multer con almacenamiento en disco, sharp para crear thumbnails
  (300x300) y versiones optimizadas (800x800 max). Formato WebP preferido.
- Validación de entrada con express-validator en cada ruta POST/PUT.
- Manejo de errores centralizado en middleware/errorHandler.js
- Rate limiting: 100 req/min para API pública, 300 req/min para admin.
- Slugs generados automáticamente desde el nombre, únicos en su tabla."
```

### Middleware de autenticación

```
PROMPT PARA IA / INSTRUCCIÓN:

"Crea el middleware de autenticación para el panel admin de Compusum:

1. middleware/auth.js:
   - authenticateJWT: verifica token JWT en header Authorization o en cookie.
   - requireAdmin: verifica que el usuario tenga role 'admin'.
   - requireAuth: verifica que esté logueado (admin o editor).
   - optionalAuth: si hay token lo decodifica, si no continúa sin user.

2. El login debe:
   - Verificar email y password contra la BD.
   - Generar JWT con { id, email, role } y expiración de .env.
   - Guardar token en cookie httpOnly + secure.
   - Actualizar campo last_login del usuario.
   - Devolver { token, user: { id, name, email, role } }.

3. Proteger todas las rutas /admin/* y /api/v1/* (excepto las públicas)
   con el middleware correspondiente."
```

### Servicio de imágenes

```
PROMPT PARA IA / INSTRUCCIÓN:

"Crea services/imageService.js para gestionar imágenes de productos:

1. processProductImage(file):
   - Recibe archivo de multer.
   - Con sharp: redimensiona a máximo 800x800 manteniendo ratio.
   - Genera thumbnail de 300x300 (cover/crop).
   - Convierte a WebP con calidad 80.
   - Guarda en public/uploads/products/ con nombre: timestamp-random.webp
   - Retorna: { imagePath, thumbnailPath, originalName }

2. processBrandLogo(file):
   - Redimensiona a máximo 400x200.
   - WebP calidad 85.
   - Guarda en public/uploads/brands/

3. processBannerImage(file):
   - Desktop: 1920x600 max.
   - Mobile: 768x400 max.
   - WebP calidad 85.
   - Guarda en public/uploads/banners/

4. processCategoryImage(file):
   - Redimensiona a 600x400.
   - WebP calidad 80.
   - Guarda en public/uploads/categories/

5. deleteImage(path):
   - Elimina archivo del filesystem.
   - Maneja errores silenciosamente si no existe.

Usa path.join para rutas compatibles con todos los OS."
```

---

## ═══════════════════════════════════════════
## FASE 3 — PANEL DE ADMINISTRACIÓN
## ═══════════════════════════════════════════

### 🎯 Objetivo
Crear un panel admin completo donde gestionar todo el contenido del sitio.

```
PROMPT PARA IA / INSTRUCCIÓN:

"Crea el panel de administración para la tienda Compusum con las siguientes
pantallas y funcionalidades. Usa EJS como motor de plantillas con un layout
admin separado del público. El diseño debe ser limpio, moderno, responsive,
usando Tailwind CSS (vía CDN). Sidebar izquierdo con navegación.

COLORES DEL PANEL ADMIN:
- Sidebar: fondo azul oscuro #0D4DAA, texto blanco
- Acentos: #E89A00 (botones primarios), #FF6A00 (alertas/badges)
- Fondo: #F3F4F6 (gris muy claro)
- Cards: blanco con sombra suave

═══ LOGIN (/admin/login) ═══
- Formulario centrado con logo de Compusum.
- Campos: email, password.
- Validación client-side y server-side.
- Mensaje de error si credenciales incorrectas.
- Redirige a /admin/dashboard al loguearse.

═══ DASHBOARD (/admin) ═══
- Tarjetas resumen: Total productos, Categorías, Marcas, Mensajes sin leer.
- Gráfico de productos por categoría (Chart.js, tipo doughnut).
- Últimos 5 productos añadidos (mini tabla).
- Últimos 5 mensajes de contacto (con badge 'nuevo' si no leído).
- Accesos rápidos: Añadir producto, Ver mensajes, Ir al sitio.

═══ GESTIÓN DE PRODUCTOS (/admin/products) ═══
LISTADO:
- Tabla con columnas: Miniatura | Nombre | SKU | Categoría | Marca |
  Precio | Estado Stock | Destacado | Activo | Acciones
- Filtros superiores: categoría (dropdown), marca (dropdown),
  estado stock (dropdown), búsqueda por nombre/SKU.
- Paginación (20 por página).
- Checkbox para selección múltiple + acciones masivas
  (activar, desactivar, eliminar).
- Botón 'Nuevo Producto' prominente.

FORMULARIO CREAR/EDITAR:
- Campos organizados en secciones con tabs o acordeones:
  TAB 1 — Información básica:
    - Nombre (text, requerido)
    - SKU / Referencia (text)
    - Categoría (select con subcategorías agrupadas)
    - Marca (select)
    - Descripción corta (textarea, máx 500 chars con contador)
    - Descripción completa (textarea con editor simple o markdown)
    - Tags (input con chips/tags separados por coma)

  TAB 2 — Precios y stock:
    - Precio referencia (number, COP)
    - Precio mayorista (number, COP)
    - Cantidad mínima para mayorista (number)
    - Estado de stock (select: Disponible, Agotado, Bajo pedido)

  TAB 3 — Imágenes:
    - Zona de drag & drop para subir múltiples imágenes.
    - Preview de imágenes subidas con opción de:
      · Marcar como principal (estrella)
      · Reordenar (drag)
      · Eliminar (X con confirmación)
    - Máximo 8 imágenes por producto.

  TAB 4 — Opciones:
    - Producto destacado (toggle)
    - Producto novedad (toggle)
    - Producto activo (toggle)
    - Temporada(s) asociada(s) (multi-select)
    - Orden de visualización (number)

  TAB 5 — SEO:
    - Meta título (text, auto-generado desde nombre)
    - Meta descripción (textarea, auto-generada)
    - Slug (text, auto-generado, editable)

- Botones: 'Guardar', 'Guardar y crear otro', 'Cancelar'.
- Validación en tiempo real.
- Preview del producto mientras se edita.

═══ GESTIÓN DE CATEGORÍAS (/admin/categories) ═══
- Lista en árbol (categorías padre → subcategorías indentadas).
- Para cada categoría: nombre, imagen, cantidad de productos, estado, acciones.
- Formulario: nombre, descripción, imagen, categoría padre (select o ninguna),
  orden, activo.
- Impedir eliminar si tiene productos asociados (mostrar advertencia).

═══ GESTIÓN DE MARCAS (/admin/brands) ═══
- Grid de tarjetas con logo, nombre, cantidad de productos, estado.
- Formulario: nombre, logo (subir imagen), descripción, website, activo, orden.
- Vista de detalle con productos de esa marca.

═══ GESTIÓN DE TEMPORADAS (/admin/seasons) ═══
- Lista con nombre, fechas, estado (activa si fecha actual está en rango), badge.
- Formulario: nombre, descripción, imagen/banner, fecha inicio, fecha fin,
  color del badge, activo.
- Asignar/desasignar productos a temporada.

═══ GESTIÓN DE BANNERS (/admin/banners) ═══
- Lista con preview de imagen, título, posición, estado, fechas, orden.
- Formulario: título, subtítulo, imagen desktop (requerida),
  imagen mobile (opcional), URL destino, texto del botón,
  posición (hero/promo/category/brand), orden, fechas programación, activo.

═══ MENSAJES DE CONTACTO (/admin/messages) ═══
- Tabla: Fecha | Nombre | Email | Ciudad | Tipo | Leído | Acciones.
- Filtros: tipo, leído/no leído, búsqueda.
- Al hacer clic: detalle completo del mensaje.
- Opciones: marcar como leído, agregar nota interna, eliminar.
- Badge en sidebar con count de no leídos.

═══ CONFIGURACIÓN DEL SITIO (/admin/settings) ═══
Formulario organizado en secciones:
- General: nombre tienda, slogan, logo, favicon.
- Contacto: teléfono, email, dirección, horarios, WhatsApp.
- Redes sociales: Instagram, Facebook, YouTube, TikTok.
- Envíos: texto informativo de envíos, ciudades, tiempos.
- SEO: meta título default, meta descripción default,
  Google Analytics ID, pixel Facebook.
- Apariencia: colores primarios (con color picker).

═══ SIDEBAR NAVEGACIÓN ═══
Estructura:
📊 Dashboard
📦 Productos (badge con total)
📁 Categorías
🏷️ Marcas
🎄 Temporadas
🖼️ Banners
✉️ Mensajes (badge con no leídos)
⚙️ Configuración
↩️ Ver sitio (abre en nueva pestaña)
🚪 Cerrar sesión

ESPECIFICACIONES TÉCNICAS:
- Cada acción de crear/editar/eliminar muestra notificación toast
  (éxito verde / error rojo) con connect-flash o JS.
- Confirmación antes de eliminar cualquier registro.
- Todas las tablas tienen responsive scroll horizontal en mobile.
- Sesión admin expira según JWT_EXPIRES_IN.
- Log de último acceso visible en header (avatar + nombre + last_login).
- Breadcrumbs en cada página."
```

---

## ═══════════════════════════════════════════
## FASE 4 — FRONTEND PÚBLICO (LA TIENDA)
## ═══════════════════════════════════════════

### 🎯 Objetivo
Crear el sitio público, atractivo, rápido y optimizado para conversión (WhatsApp).

```
PROMPT PARA IA / INSTRUCCIÓN:

"Diseña y construye el frontend público de la tienda web de Compusum,
una papelería mayorista de Colombia. El sitio debe ser MUY VISUAL,
atractivo, colorido y moderno. Cada página debe causar efecto 'wow'.
Usa EJS como motor de plantillas, Tailwind CSS, animaciones con AOS,
carruseles con Swiper.js y lazy loading para imágenes.

PALETA DE COLORES:
- Azul corporativo: #0D4DAA (header, footer, elementos principales)
- Azul claro: #6DA8FF (fondos secundarios, hover)
- Amarillo/mostaza: #E89A00 (badges, etiquetas, precios)
- Naranja: #FF6A00 (botones CTA, ofertas, urgencia)
- Fondo: #F7EFEF o #FFFFFF
- Texto: #1a1a2e (oscuro) / #555 (secundario)

TIPOGRAFÍAS (Google Fonts):
- Títulos: 'League Spartan' o 'Fredoka' (bold, impactante)
- Cuerpo: 'Poppins' o 'Montserrat' (legible, moderno)

═══════════════════════════════════════
═══ COMPONENTES GLOBALES ═══
═══════════════════════════════════════

HEADER / NAVBAR:
- Barra superior (top bar) con: teléfono, email, redes sociales.
  Fondo azul oscuro, texto blanco, pequeña.
- Navbar principal sticky:
  · Logo Compusum a la izquierda.
  · Menú central: Inicio | Catálogo (mega-menú desplegable con categorías
    y subcategorías en grid con imágenes) | Temporadas | Mayoristas |
    Marcas | Nosotros | Contacto
  · Buscador con ícono (se expande al clicar).
  · Botón CTA: "Cotizar por WhatsApp" (verde WhatsApp).
- Mobile: hamburguesa con menú slide-in lateral.
- El mega-menú del catálogo muestra las categorías con su imagen miniatura
  y cuenta de productos.

FOOTER:
- 4 columnas: Logo + breve descripción | Enlaces rápidos |
  Categorías principales | Contacto y redes.
- Franja inferior: © 2025 Compusum. NIT. Todos los derechos reservados.
  | Hecho con ❤️ en Pereira, Colombia
- Newsletter opcional (campo email + botón).

BOTÓN FLOTANTE WHATSAPP:
- Esquina inferior derecha, siempre visible.
- Ícono WhatsApp animado (pulse).
- Al hacer clic abre WhatsApp con mensaje prellenado.
- Tooltip: "¿Necesitas ayuda? Escríbenos".

TARJETA DE PRODUCTO (componente reutilizable):
- Imagen con hover zoom suave.
- Badge si es 'Novedad' (verde), 'Destacado' (naranja), 'Agotado' (gris).
- Badge de temporada si aplica (color dinámico).
- Nombre del producto (2 líneas máx, truncado).
- Marca (texto pequeño gris).
- Precio referencia (si existe), precio mayorista diferenciado.
- Botón "Cotizar" que agrega al cotizador de WhatsApp.
- Animación AOS: fade-up al entrar en viewport.

═══════════════════════════════════════
═══ PÁGINA HOME (/) ═══
═══════════════════════════════════════

SECCIÓN 1 — HERO SLIDER:
- Slider full-width con banners dinámicos (desde la BD, posición 'hero').
- Cada slide: imagen de fondo, título grande, subtítulo, botón CTA.
- Transición automática cada 5 segundos, swipe mobile.
- Overlay gradiente para legibilidad del texto.
- Indicadores/dots abajo.

SECCIÓN 2 — BARRA DE BENEFICIOS:
- 4 iconos con texto en línea horizontal (scroll en mobile):
  🚚 Envíos a todo Colombia | 📦 Precios por volumen |
  ✅ Marcas 100% colombianas | 💬 Asesoría por WhatsApp

SECCIÓN 3 — CATEGORÍAS DESTACADAS:
- Grid de 4-6 categorías principales.
- Cada una: imagen circular o cuadrada con border-radius,
  nombre, cantidad de productos, efecto hover.
- Título de sección: "Explora nuestras categorías"
- Animación: fade-up escalonado.

SECCIÓN 4 — PRODUCTOS DESTACADOS:
- Carrusel Swiper de productos con is_featured = true.
- 4 visibles en desktop, 2 en tablet, 1.2 en mobile (peek).
- Título: "Productos destacados"
- Botón: "Ver todo el catálogo →"

SECCIÓN 5 — BANNER PROMOCIONAL:
- Banner full-width (posición 'promo' de la BD).
- Diseño llamativo: imagen de fondo, texto grande,
  botón CTA naranja. Puede ser de temporada.

SECCIÓN 6 — NOVEDADES:
- Grid 4 columnas de productos con is_new = true (últimos 12).
- Título: "Recién llegados 🆕"

SECCIÓN 7 — MARCAS QUE DISTRIBUIMOS:
- Carrusel infinito con logos de marcas (autoplay, pausar en hover).
- Fondo gris muy claro.
- Título: "Marcas con las que trabajamos"

SECCIÓN 8 — TEMPORADA ACTIVA (condicional):
- Si hay una temporada activa, mostrar sección con:
  imagen/banner de la temporada, nombre, botón "Ver productos de temporada".
  Diseño temático según la temporada.

SECCIÓN 9 — POR QUÉ ELEGIRNOS:
- 3-4 cards con íconos:
  · "Precios mayoristas directos de fábrica"
  · "Catálogo de +1000 referencias"
  · "Asesoría personalizada por WhatsApp"
  · "20+ años de experiencia"
- Fondo blanco, cards con sombra y border-left de color.

SECCIÓN 10 — CTA FINAL:
- Sección full-width con fondo azul oscuro, texto blanco.
- "¿Eres mayorista? Cotiza tu pedido ahora"
- Botón grande: "Cotizar por WhatsApp" + "Ver catálogo"
- Formulario inline (nombre, ciudad, email) para captar leads mayoristas.

═══════════════════════════════════════
═══ CATÁLOGO (/catalogo) ═══
═══════════════════════════════════════
- Layout: sidebar izquierdo con filtros + grid de productos.
- SIDEBAR FILTROS:
  · Categorías (árbol colapsable con checkboxes).
  · Marcas (checkboxes con logos pequeños).
  · Estado de stock (disponible, bajo pedido).
  · Rango de precio (slider dual o inputs min-max).
  · Temporada (si hay activa).
  · Botón "Limpiar filtros".
- GRID DE PRODUCTOS:
  · Barra superior: cantidad de resultados | ordenar por
    (relevancia, nombre A-Z, Z-A, precio menor, precio mayor, más nuevo).
  · Vista toggle: grid (3-4 cols) / lista.
  · Tarjetas de producto reutilizables.
  · Paginación inferior (numérica).
  · Lazy loading de imágenes.
- MOBILE: filtros en drawer lateral (botón "Filtrar" sticky).
- URL amigables: /catalogo?category=escolar&brand=faber-castell&page=2
- Los filtros se aplican sin recargar (fetch API) o con recarga parcial.

═══════════════════════════════════════
═══ DETALLE PRODUCTO (/producto/:slug) ═══
═══════════════════════════════════════
- Layout 2 columnas:
  IZQUIERDA (60%): Galería de imágenes.
  · Imagen principal grande.
  · Thumbnails debajo (al clicar cambia la principal).
  · Lightbox al clicar la imagen principal.
  · Badges superpuestos (novedad, destacado, temporada).

  DERECHA (40%): Información.
  · Breadcrumb: Inicio > Categoría > Subcategoría > Producto
  · Nombre del producto (h1).
  · Marca (con logo pequeño, link a la marca).
  · SKU / Referencia.
  · Estado de stock (badge color).
  · Precio referencia (si existe).
  · Precio mayorista + "desde X unidades".
  · Selector de cantidad.
  · Botón grande: "🛒 Agregar al cotizador"
  · Botón: "📲 Cotizar este producto por WhatsApp"
    (abre WA con mensaje prellenado del producto).
  · Compartir: WhatsApp, Facebook, copiar enlace.

- TABS debajo:
  · Descripción completa.
  · Información de envío genérica.
  · Tags relacionados (clickeables, llevan al catálogo filtrado).

- SECCIÓN: "También te puede interesar"
  · Carrusel con productos de la misma categoría.

═══════════════════════════════════════
═══ MARCAS (/marcas) ═══
═══════════════════════════════════════
- Grid de tarjetas por marca.
- Cada tarjeta: logo centrado, nombre, breve descripción,
  cantidad de productos, botón "Ver productos".
- Al clicar: /marcas/:slug → lista de productos de esa marca.

═══════════════════════════════════════
═══ TEMPORADAS (/temporadas) ═══
═══════════════════════════════════════
- Si hay temporada activa: banner hero temático + productos.
- Listado de temporadas pasadas (archivo).
- Cada temporada: imagen, nombre, fechas, productos asociados en grid.

═══════════════════════════════════════
═══ MAYORISTAS (/mayoristas) ═══
═══════════════════════════════════════
- Hero con mensaje: "Distribuimos papelería al por mayor a todo Colombia"
- Sección: Cómo comprar (pasos con iconos numerados):
  1. Explora el catálogo  2. Selecciona productos
  3. Cotiza por WhatsApp  4. Recibe tu pedido
- Beneficios: precios por volumen, asesoría, logística nacional.
- Medios de pago aceptados (iconos).
- Zonas de envío (mapa o lista de ciudades principales).
- CTA: formulario de registro como mayorista
  (nombre, empresa, NIT, ciudad, email, teléfono).

═══════════════════════════════════════
═══ NOSOTROS (/nosotros) ═══
═══════════════════════════════════════
- Hero con foto de la tienda o equipo.
- Historia breve de Compusum (Computadores y Suministros S.A.S.).
- Misión, visión, valores (cards con iconos).
- Cifras: años en el mercado, referencias, marcas, clientes.
- Foto/s del equipo o tienda.
- Mapa de Google embebido.

═══════════════════════════════════════
═══ CONTACTO (/contacto) ═══
═══════════════════════════════════════
- 2 columnas:
  IZQUIERDA: Formulario:
  · Nombre, email, teléfono, ciudad, tipo de consulta (dropdown),
    mensaje, botón enviar.
  · Validación en tiempo real.
  · Al enviar: guarda en BD + envía email de notificación +
    muestra mensaje de éxito.

  DERECHA: Información:
  · Dirección con ícono y enlace a Google Maps.
  · Teléfono clickeable (tel:).
  · Email clickeable (mailto:).
  · Horarios de atención.
  · Redes sociales con iconos.
  · Mapa de Google embebido.

ESPECIFICACIONES DE DISEÑO:
- Todas las secciones con padding generoso (py-16 o más).
- Transiciones suaves en hover (300ms ease).
- Imágenes con aspect-ratio consistente.
- Skeleton loaders mientras cargan imágenes.
- Scroll suave entre secciones.
- Breadcrumbs en todas las páginas internas.
- Página 404 personalizada con diseño amigable y botón a home.
- Loading spinner global para peticiones AJAX.
- Back to top button (aparece al bajar 300px)."
```

---

## ═══════════════════════════════════════════
## FASE 5 — COTIZADOR + WHATSAPP
## ═══════════════════════════════════════════

### 🎯 Objetivo
Implementar el sistema de cotización por WhatsApp (el "carrito" de Compusum).

```
PROMPT PARA IA / INSTRUCCIÓN:

"Implementa un sistema de cotización por WhatsApp para la tienda Compusum.
NO es un carrito de compra tradicional ni tiene pasarela de pagos.
El flujo es: el cliente selecciona productos → genera un mensaje de
WhatsApp prellenado → un asesor responde.

COMPONENTES:

1. COTIZADOR (mini-carrito flotante):
   - Ícono de carrito/lista en el header con badge de cantidad.
   - Al hacer clic, abre un drawer/panel lateral derecho.
   - Muestra lista de productos agregados:
     · Miniatura, nombre, cantidad (editable +/-), botón eliminar.
   - Cantidad de items y botón: 'Cotizar por WhatsApp'.
   - Botón 'Vaciar lista'.
   - Los datos se guardan en localStorage del navegador.
   - Persistente entre páginas y sesiones.

2. BOTÓN 'AGREGAR AL COTIZADOR' (en tarjetas y detalle):
   - Al clicar: agrega el producto al cotizador.
   - Feedback visual: ícono cambia, toast 'Producto agregado ✓'.
   - Si ya existe, incrementa cantidad.
   - Selector de cantidad en la página de detalle.

3. GENERACIÓN DEL MENSAJE DE WHATSAPP:
   - Al hacer clic en 'Cotizar por WhatsApp':
     a) Si hay productos en el cotizador, genera mensaje así:

     ```
     ¡Hola! 👋 Soy [nombre si lo puso] de [ciudad si la puso].
     Quiero cotizar los siguientes productos:

     1. [Nombre producto] — Ref: [SKU] — Cantidad: [X]
     2. [Nombre producto] — Ref: [SKU] — Cantidad: [X]
     3. [Nombre producto] — Ref: [SKU] — Cantidad: [X]

     Total de referencias: [N]
     Por favor envíenme precios y disponibilidad.
     ¡Gracias!
     ```

     b) Abre WhatsApp Web/App:
        https://wa.me/576063335206?text=[mensaje_codificado]

   - Opcional: antes de abrir WhatsApp, mostrar modal pidiendo:
     nombre (opcional), ciudad (select principales ciudades), empresa (opcional).
     Esto enriquece el mensaje.

4. COTIZAR PRODUCTO INDIVIDUAL:
   - En la página de detalle, botón 'Cotizar este producto por WhatsApp'.
   - Genera mensaje:
     'Hola, quiero cotizar: [Nombre] (Ref: [SKU]), Cantidad: [X]. Mi ciudad: ____'
   - Abre WhatsApp directamente.

5. IMPLEMENTACIÓN TÉCNICA:
   - Todo en JavaScript vanilla (no necesita backend).
   - Archivo: public/js/quoter.js
   - Clase Quoter con métodos:
     · add(product) — agrega o incrementa
     · remove(productId) — elimina
     · updateQty(productId, qty) — cambia cantidad
     · clear() — vacía todo
     · getItems() — retorna array
     · getCount() — retorna total items
     · generateWhatsAppUrl(userData) — genera URL de WhatsApp
   - Guardar en localStorage key: 'compusum_quoter'
   - Eventos custom para actualizar UI (badge, drawer).
   - Funciona sin JavaScript del server (client-side only)."
```

---

## ═══════════════════════════════════════════
## FASE 6 — SEO, RENDIMIENTO Y SEGURIDAD
## ═══════════════════════════════════════════

```
PROMPT PARA IA / INSTRUCCIÓN:

"Optimiza la tienda web de Compusum en tres áreas:

═══ SEO ═══
- Cada página tiene meta title y meta description únicos (dinámicos desde BD).
- Estructura de URLs amigables:
  /catalogo, /producto/crayones-faber-castell-x12, /marcas/faber-castell
  /categoria/escolar/cuadernos, /temporada/regreso-a-clases-2025
- Open Graph tags y Twitter Cards en todas las páginas.
- Schema.org structured data:
  · Organization (datos de Compusum).
  · Product (en detalle de producto).
  · BreadcrumbList (en todas las páginas).
  · LocalBusiness (en contacto/nosotros).
- Sitemap.xml dinámico (generado desde productos/categorías activos).
- robots.txt (bloquear /admin/, /api/).
- Canonical URLs.
- Alt text en todas las imágenes (desde campo alt_text o nombre producto).
- Heading hierarchy correcta (h1 único por página).
- Internal linking: productos relacionados, breadcrumbs, categorías.

═══ RENDIMIENTO ═══
- Imágenes WebP con lazy loading (loading='lazy' + lazysizes.js).
- Thumbnails para listados, imágenes full solo en detalle/lightbox.
- CSS y JS minificados en producción.
- Gzip/Brotli compression (middleware compression de Express).
- Cache headers para assets estáticos (1 año para imágenes, 1 mes para CSS/JS).
- Preconnect a Google Fonts y CDNs.
- Critical CSS inline en el head.
- Defer/async en scripts no críticos.
- Paginación en catálogo (no cargar todo de golpe).
- Índices en BD: slug, category_id, brand_id, is_active, is_featured.

═══ SEGURIDAD ═══
- helmet.js (headers de seguridad).
- CORS configurado solo para dominio propio.
- Rate limiting (express-rate-limit):
  · API pública: 100 req/min por IP.
  · Login: 5 intentos/15 min por IP.
  · Contacto: 3 mensajes/hora por IP.
- express-validator en toda entrada de usuario.
- Sanitización contra XSS (xss-clean o sanitize-html).
- SQL injection prevenido por Sequelize (queries parametrizados).
- CSRF tokens en formularios admin (csurf).
- Cookies httpOnly, secure, sameSite.
- Passwords hasheados con bcrypt (saltRounds: 12).
- Variables sensibles solo en .env (nunca en código).
- Ocultar header X-Powered-By.
- Validación de tipos de archivo en uploads (solo imágenes).
- Limitar tamaño de uploads (5MB máx).
- No exponer stack traces en producción."
```

---

## ═══════════════════════════════════════════
## FASE 7 — DEPLOY EN SPACESHIP
## ═══════════════════════════════════════════

```
PROMPT PARA IA / INSTRUCCIÓN:

"Configura el deployment de la tienda Compusum en Spaceship hosting.
Spaceship soporta Node.js con acceso SSH y MySQL.

PASOS DE CONFIGURACIÓN:

1. PREPARAR EL PROYECTO PARA PRODUCCIÓN:
   - Archivo .env.production con variables de Spaceship.
   - Script 'build' si usas Tailwind con JIT (compilar CSS de producción).
   - Verificar que NODE_ENV=production.

2. CONFIGURACIÓN EN SPACESHIP:
   a) Crear la base de datos MySQL desde el panel:
      - Nombre: compusum_db
      - Usuario: compusum_user
      - Password: [generado seguro]
      - Host: proporcionado por Spaceship (ej: localhost o IP interna)

   b) Configurar Node.js:
      - Seleccionar versión Node.js 20.x LTS.
      - Entry point: server.js
      - Puerto: el que asigne Spaceship (usar process.env.PORT).

   c) Subir el proyecto:
      OPCIÓN A — Git deploy:
      - Conectar repositorio de GitHub.
      - Push a branch 'main' para deploy automático.

      OPCIÓN B — SSH + SFTP:
      - Conectar vía SSH.
      - Clonar repo o subir archivos.
      - npm install --production.

3. CONFIGURAR PM2 (process manager):
   ecosystem.config.js:
   ```js
   module.exports = {
     apps: [{
       name: 'compusum-web',
       script: 'server.js',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '512M',
       env_production: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   };
   ```

4. EJECUTAR MIGRACIONES Y SEEDS:
   - Sequelize sync en primera ejecución (o usar migrations).
   - Correr seeds: npm run seed:all
   - Verificar acceso a /admin/login.

5. CONFIGURAR DOMINIO:
   - Apuntar DNS del dominio (ej: compusum.com.co) a IP de Spaceship.
   - Configurar SSL (Let's Encrypt o el que ofrezca Spaceship).
   - Forzar HTTPS (redirect).

6. VERIFICACIONES POST-DEPLOY:
   - [ ] Sitio carga correctamente en HTTPS.
   - [ ] Panel admin accesible (/admin).
   - [ ] Subida de imágenes funciona.
   - [ ] Formulario de contacto envía email.
   - [ ] Botones de WhatsApp funcionan.
   - [ ] Responsive en móvil y tablet.
   - [ ] Velocidad aceptable (GTmetrix/Lighthouse).
   - [ ] sitemap.xml accesible.
   - [ ] robots.txt correcto.
   - [ ] 404 personalizado funciona.

7. BACKUPS:
   - Configurar backup automático de MySQL (cron diario).
   - Backup de carpeta uploads (semanal).
   - Script: scripts/backup.sh

8. MONITOREO:
   - PM2 logs: pm2 logs compusum-web
   - Uptime checks (UptimeRobot free).
   - Google Search Console.
   - Google Analytics (o alternativa privada)."
```

---

## ═══════════════════════════════════════════
## FASE 8 — POST-LANZAMIENTO Y MEJORAS
## ═══════════════════════════════════════════

```
PRIORIDAD ALTA (semanas 1-4):
- [ ] Cargar todos los productos reales con fotos de calidad.
- [ ] Verificar que todas las categorías y marcas tienen productos.
- [ ] Testear el flujo completo de cotización WhatsApp.
- [ ] Registrar en Google Search Console y enviar sitemap.
- [ ] Configurar Google Analytics / Clarity (heatmaps).
- [ ] Publicar enlace en Instagram y Facebook.
- [ ] Probar en múltiples dispositivos y navegadores.

PRIORIDAD MEDIA (meses 2-3):
- [ ] Importador masivo de productos (CSV/Excel → BD).
- [ ] Newsletter básico (captar emails, enviar novedades con Nodemailer).
- [ ] Blog/noticias (posts simples para SEO).
- [ ] Sistema de búsqueda mejorado (Fuse.js para búsqueda fuzzy en el frontend).
- [ ] Cache con Redis para consultas frecuentes.
- [ ] Galería de catálogos PDF descargables por marca.

PRIORIDAD BAJA (futuro):
- [ ] Cuenta de cliente (registro, historial de cotizaciones).
- [ ] Comparador de productos.
- [ ] Lista de favoritos/deseos.
- [ ] Integración con CRM (HubSpot, Zoho).
- [ ] Chat en vivo (Tawk.to o similar).
- [ ] App móvil PWA.
- [ ] Multi-idioma (español + inglés).
- [ ] Pasarela de pago (cuando el negocio lo requiera).
```

---

## ═══════════════════════════════════════════
## 📌 RESUMEN DE COMANDOS CLAVE
## ═══════════════════════════════════════════

```bash
# === DESARROLLO ===
npm run dev                    # Inicia con nodemon
npm run seed                   # Ejecuta seed del admin
npm run seed:all               # Todos los seeds

# === PRODUCCIÓN ===
npm start                      # Inicia con Node directo
pm2 start ecosystem.config.js  # Inicia con PM2
pm2 restart compusum-web       # Reiniciar
pm2 logs compusum-web          # Ver logs
pm2 monit                      # Monitor en tiempo real

# === BASE DE DATOS ===
npx sequelize-cli db:create    # Crear BD (si usas CLI)
npx sequelize-cli db:migrate   # Correr migraciones
npx sequelize-cli db:seed:all  # Correr todos los seeds

# === UTILIDADES ===
npm run build:css              # Compilar Tailwind (si aplica)
```

---

## 🎯 INSTRUCCIÓN FINAL PARA GLM 5

Cuando uses este prompt con GLM 5 u otra IA, copia y pega la fase correspondiente como instrucción. Ejemplo para empezar:

> "Estoy creando una tienda web para Compusum, una papelería mayorista colombiana ubicada en Pereira. Stack: Node.js + Express + MySQL (Sequelize) + EJS + Tailwind CSS. [Pega aquí la FASE 0 y FASE 1 completas]. Crea la estructura de archivos, el server.js, la configuración de base de datos y todos los modelos Sequelize descritos. Incluye el archivo models/index.js con todas las asociaciones."

Luego avanza fase por fase, siempre proporcionando el contexto de lo que ya está hecho.

---

*Documento creado como guía maestra para el desarrollo de compusum.com.co*
*Última actualización: Febrero 2026*
