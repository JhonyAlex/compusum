Commit: fix: update db:init script to accept data loss during prisma db push 
##########################################
### Download Github Archive Started...
### Mon, 09 Mar 2026 13:14:44 GMT
##########################################

#0 building with "default" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.63kB done
#1 DONE 0.0s

#2 [internal] load metadata for docker.io/oven/bun:latest
#2 DONE 0.2s

#3 [internal] load .dockerignore
#3 transferring context: 177B done
#3 DONE 0.0s

#4 [base 1/1] FROM docker.io/oven/bun:latest@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e
#4 resolve docker.io/oven/bun:latest@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e done
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 1.01MB 0.0s done
#5 DONE 0.0s

#6 [deps 1/3] WORKDIR /app
#6 CACHED

#7 [deps 2/3] COPY package.json bun.lock* ./
#7 DONE 0.0s

#8 [deps 3/3] RUN bun install --frozen-lockfile
#8 0.045 bun install v1.3.10 (30e609e0)
#8 5.431 
#8 5.431 + @tailwindcss/postcss@4.1.18
#8 5.431 + @types/bcryptjs@3.0.0
#8 5.431 + @types/react@19.2.8
#8 5.431 + @types/react-dom@19.2.3
#8 5.431 + bun-types@1.3.6
#8 5.431 + eslint@9.39.2
#8 5.431 + eslint-config-next@16.1.3
#8 5.431 + tailwindcss@4.1.18
#8 5.431 + tw-animate-css@1.4.0
#8 5.431 + typescript@5.9.3
#8 5.431 + @dnd-kit/core@6.3.1
#8 5.431 + @dnd-kit/sortable@10.0.0
#8 5.431 + @dnd-kit/utilities@3.2.2
#8 5.431 + @floating-ui/dom@1.7.6
#8 5.431 + @floating-ui/react-dom@2.1.8
#8 5.431 + @hookform/resolvers@5.2.2
#8 5.431 + @mdxeditor/editor@3.52.3
#8 5.431 + @prisma/client@6.19.2
#8 5.431 + @radix-ui/react-accordion@1.2.12
#8 5.431 + @radix-ui/react-alert-dialog@1.1.15
#8 5.431 + @radix-ui/react-aspect-ratio@1.1.8
#8 5.431 + @radix-ui/react-avatar@1.1.11
#8 5.431 + @radix-ui/react-checkbox@1.3.3
#8 5.431 + @radix-ui/react-collapsible@1.1.12
#8 5.431 + @radix-ui/react-context-menu@2.2.16
#8 5.431 + @radix-ui/react-dialog@1.1.15
#8 5.431 + @radix-ui/react-dropdown-menu@2.1.16
#8 5.431 + @radix-ui/react-hover-card@1.1.15
#8 5.431 + @radix-ui/react-label@2.1.8
#8 5.431 + @radix-ui/react-menubar@1.1.16
#8 5.431 + @radix-ui/react-navigation-menu@1.2.14
#8 5.431 + @radix-ui/react-popover@1.1.15
#8 5.431 + @radix-ui/react-progress@1.1.8
#8 5.431 + @radix-ui/react-radio-group@1.3.8
#8 5.431 + @radix-ui/react-scroll-area@1.2.10
#8 5.431 + @radix-ui/react-select@2.2.6
#8 5.431 + @radix-ui/react-separator@1.1.8
#8 5.431 + @radix-ui/react-slider@1.3.6
#8 5.431 + @radix-ui/react-slot@1.2.4
#8 5.431 + @radix-ui/react-switch@1.2.6
#8 5.431 + @radix-ui/react-tabs@1.1.13
#8 5.431 + @radix-ui/react-toast@1.2.15
#8 5.431 + @radix-ui/react-toggle@1.1.10
#8 5.431 + @radix-ui/react-toggle-group@1.1.11
#8 5.431 + @radix-ui/react-tooltip@1.2.8
#8 5.431 + @reactuses/core@6.1.9
#8 5.431 + @tanstack/react-query@5.90.19
#8 5.431 + @tanstack/react-table@8.21.3
#8 5.431 + bcryptjs@3.0.3
#8 5.431 + class-variance-authority@0.7.1
#8 5.431 + clsx@2.1.1
#8 5.431 + cmdk@1.1.1
#8 5.431 + date-fns@4.1.0
#8 5.431 + embla-carousel-react@8.6.0
#8 5.431 + framer-motion@12.26.2
#8 5.431 + input-otp@1.4.2
#8 5.431 + lucide-react@0.525.0
#8 5.431 + next@16.1.3
#8 5.431 + next-auth@4.24.13
#8 5.431 + next-intl@4.7.0
#8 5.431 + next-themes@0.4.6
#8 5.431 + prisma@6.19.2
#8 5.431 + react@19.2.3
#8 5.431 + react-day-picker@9.13.0
#8 5.431 + react-dom@19.2.3
#8 5.431 + react-hook-form@7.71.1
#8 5.431 + react-markdown@10.1.0
#8 5.431 + react-resizable-panels@3.0.6
#8 5.431 + react-syntax-highlighter@15.6.6
#8 5.431 + recharts@2.15.4
#8 5.431 + sharp@0.34.5
#8 5.431 + sonner@2.0.7
#8 5.431 + tailwind-merge@3.4.0
#8 5.431 + tailwindcss-animate@1.0.7
#8 5.431 + uuid@11.1.0
#8 5.431 + vaul@1.1.2
#8 5.431 + z-ai-web-dev-sdk@0.0.16
#8 5.431 + zod@4.3.5
#8 5.431 + zustand@5.0.10
#8 5.431 
#8 5.431 833 packages installed [5.39s]
#8 DONE 6.6s

#9 [builder 2/5] COPY --from=deps /app/node_modules ./node_modules
#9 CACHED

#10 [builder 3/5] COPY . .
#10 DONE 0.1s

#11 [builder 4/5] RUN bunx prisma generate
#11 1.098 Environment variables loaded from .env
#11 1.101 Prisma schema loaded from prisma/schema.prisma
#11 1.442 
#11 1.626 ✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 114ms
#11 1.626 
#11 1.626 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
#11 1.626 
#11 1.626 Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate
#11 1.626 
#11 DONE 2.1s

#12 [builder 5/5] RUN bun run build
#12 0.055 $ next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
#12 1.416 ▲ Next.js 16.1.3 (Turbopack)
#12 1.416 - Environments: .env
#12 1.416 
#12 1.418 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
#12 1.439   Creating an optimized production build ...
#12 7.529 ✓ Compiled successfully in 5.2s
#12 7.532   Skipping validation of types
#12 7.627   Collecting page data using 5 workers ...
#12 8.280   Generating static pages using 5 workers (0/20) ...
#12 8.309   Generating static pages using 5 workers (5/20) 
#12 8.410   Generating static pages using 5 workers (10/20) 
#12 8.421   Generating static pages using 5 workers (15/20) 
#12 8.586 ✓ Generating static pages using 5 workers (20/20) in 304.9ms
#12 8.592   Finalizing page optimization ...
#12 8.954 
#12 8.958 Route (app)
#12 8.958 ┌ ƒ /
#12 8.958 ├ ○ /_not-found
#12 8.958 ├ ƒ /admin
#12 8.958 ├ ƒ /admin/categorias
#12 8.958 ├ ƒ /admin/categorias/[id]
#12 8.958 ├ ƒ /admin/categorias/nueva
#12 8.958 ├ ƒ /admin/configuracion
#12 8.958 ├ ƒ /admin/login
#12 8.958 ├ ƒ /admin/marcas
#12 8.958 ├ ƒ /admin/marcas/[id]
#12 8.958 ├ ƒ /admin/marcas/nueva
#12 8.958 ├ ƒ /admin/paginas
#12 8.958 ├ ƒ /admin/productos
#12 8.958 ├ ƒ /admin/productos/[id]
#12 8.958 ├ ƒ /admin/productos/nuevo
#12 8.958 ├ ƒ /api
#12 8.958 ├ ƒ /api/admin/brands
#12 8.958 ├ ƒ /api/admin/brands/[id]
#12 8.958 ├ ƒ /api/admin/categories
#12 8.958 ├ ƒ /api/admin/categories/[id]
#12 8.958 ├ ƒ /api/admin/products
#12 8.958 ├ ƒ /api/admin/products/[id]
#12 8.958 ├ ƒ /api/auth/login
#12 8.958 ├ ƒ /api/auth/logout
#12 8.958 ├ ƒ /api/auth/me
#12 8.958 ├ ƒ /api/banners
#12 8.958 ├ ƒ /api/brands
#12 8.958 ├ ƒ /api/brands/[slug]
#12 8.958 ├ ƒ /api/categories
#12 8.958 ├ ƒ /api/categories/[slug]
#12 8.958 ├ ƒ /api/contact
#12 8.958 ├ ƒ /api/home
#12 8.958 ├ ƒ /api/products
#12 8.958 ├ ƒ /api/products/[slug]
#12 8.958 ├ ƒ /api/seasons
#12 8.958 ├ ƒ /api/seasons/[slug]
#12 8.958 ├ ƒ /api/settings
#12 8.958 ├ ƒ /api/settings/[group]
#12 8.958 ├ ƒ /catalogo
#12 8.958 ├ ○ /contacto
#12 8.958 ├ ƒ /marcas
#12 8.958 ├ ○ /mayoristas
#12 8.958 ├ ○ /nosotros
#12 8.958 ├ ƒ /producto/[slug]
#12 8.958 └ ƒ /temporadas
#12 8.958 
#12 8.958 
#12 8.958 ƒ Proxy (Middleware)
#12 8.958 
#12 8.959 ○  (Static)   prerendered as static content
#12 8.959 ƒ  (Dynamic)  server-rendered on demand
#12 8.959 
#12 DONE 9.4s

#13 [runner 2/5] COPY --from=builder /app/.next/standalone ./
#13 DONE 1.1s

#14 [runner 3/5] COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
#14 DONE 0.1s

#15 [runner 4/5] COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
#15 DONE 0.3s

#16 [runner 5/5] COPY --from=builder /app/prisma ./prisma
#16 DONE 0.0s

#17 exporting to image
#17 exporting layers
#17 exporting layers 4.3s done
#17 exporting manifest sha256:c1aafe79d9e2657b0c4c7228602f51f32b686fc2c24a7e4cd3eb2196b686fd1f done
#17 exporting config sha256:c100617523aeaa748f90a274873be02ce046fea47ec9ca7c701355e87ecf121c done
#17 exporting attestation manifest sha256:8f07dc47e814c03d3cf1fe045049b8e046d5ce57126a3863a426d59cae53512e done
#17 exporting manifest list sha256:6df26c76bdfe6293e5f03bdcdc883601e42f2caa4c0cefa3d9c3bc0861ed4142 done
#17 naming to docker.io/easypanel/compusum-shop/compusum-app:latest done
#17 unpacking to docker.io/easypanel/compusum-shop/compusum-app:latest
#17 unpacking to docker.io/easypanel/compusum-shop/compusum-app:latest 1.4s done
#17 DONE 5.7s
##########################################
### Success
### Mon, 09 Mar 2026 13:15:18 GMT
##########################################


Commit: fix: update db:init script to accept data loss during prisma db push 
##########################################
### Download Github Archive Started...
### Mon, 09 Mar 2026 13:14:44 GMT
##########################################

#0 building with "default" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.63kB done
#1 DONE 0.0s

#2 [internal] load metadata for docker.io/oven/bun:latest
#2 DONE 0.2s

#3 [internal] load .dockerignore
#3 transferring context: 177B done
#3 DONE 0.0s

#4 [base 1/1] FROM docker.io/oven/bun:latest@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e
#4 resolve docker.io/oven/bun:latest@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e done
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 1.01MB 0.0s done
#5 DONE 0.0s

#6 [deps 1/3] WORKDIR /app
#6 CACHED

#7 [deps 2/3] COPY package.json bun.lock* ./
#7 DONE 0.0s

#8 [deps 3/3] RUN bun install --frozen-lockfile
#8 0.045 bun install v1.3.10 (30e609e0)
#8 5.431 
#8 5.431 + @tailwindcss/postcss@4.1.18
#8 5.431 + @types/bcryptjs@3.0.0
#8 5.431 + @types/react@19.2.8
#8 5.431 + @types/react-dom@19.2.3
#8 5.431 + bun-types@1.3.6
#8 5.431 + eslint@9.39.2
#8 5.431 + eslint-config-next@16.1.3
#8 5.431 + tailwindcss@4.1.18
#8 5.431 + tw-animate-css@1.4.0
#8 5.431 + typescript@5.9.3
#8 5.431 + @dnd-kit/core@6.3.1
#8 5.431 + @dnd-kit/sortable@10.0.0
#8 5.431 + @dnd-kit/utilities@3.2.2
#8 5.431 + @floating-ui/dom@1.7.6
#8 5.431 + @floating-ui/react-dom@2.1.8
#8 5.431 + @hookform/resolvers@5.2.2
#8 5.431 + @mdxeditor/editor@3.52.3
#8 5.431 + @prisma/client@6.19.2
#8 5.431 + @radix-ui/react-accordion@1.2.12
#8 5.431 + @radix-ui/react-alert-dialog@1.1.15
#8 5.431 + @radix-ui/react-aspect-ratio@1.1.8
#8 5.431 + @radix-ui/react-avatar@1.1.11
#8 5.431 + @radix-ui/react-checkbox@1.3.3
#8 5.431 + @radix-ui/react-collapsible@1.1.12
#8 5.431 + @radix-ui/react-context-menu@2.2.16
#8 5.431 + @radix-ui/react-dialog@1.1.15
#8 5.431 + @radix-ui/react-dropdown-menu@2.1.16
#8 5.431 + @radix-ui/react-hover-card@1.1.15
#8 5.431 + @radix-ui/react-label@2.1.8
#8 5.431 + @radix-ui/react-menubar@1.1.16
#8 5.431 + @radix-ui/react-navigation-menu@1.2.14
#8 5.431 + @radix-ui/react-popover@1.1.15
#8 5.431 + @radix-ui/react-progress@1.1.8
#8 5.431 + @radix-ui/react-radio-group@1.3.8
#8 5.431 + @radix-ui/react-scroll-area@1.2.10
#8 5.431 + @radix-ui/react-select@2.2.6
#8 5.431 + @radix-ui/react-separator@1.1.8
#8 5.431 + @radix-ui/react-slider@1.3.6
#8 5.431 + @radix-ui/react-slot@1.2.4
#8 5.431 + @radix-ui/react-switch@1.2.6
#8 5.431 + @radix-ui/react-tabs@1.1.13
#8 5.431 + @radix-ui/react-toast@1.2.15
#8 5.431 + @radix-ui/react-toggle@1.1.10
#8 5.431 + @radix-ui/react-toggle-group@1.1.11
#8 5.431 + @radix-ui/react-tooltip@1.2.8
#8 5.431 + @reactuses/core@6.1.9
#8 5.431 + @tanstack/react-query@5.90.19
#8 5.431 + @tanstack/react-table@8.21.3
#8 5.431 + bcryptjs@3.0.3
#8 5.431 + class-variance-authority@0.7.1
#8 5.431 + clsx@2.1.1
#8 5.431 + cmdk@1.1.1
#8 5.431 + date-fns@4.1.0
#8 5.431 + embla-carousel-react@8.6.0
#8 5.431 + framer-motion@12.26.2
#8 5.431 + input-otp@1.4.2
#8 5.431 + lucide-react@0.525.0
#8 5.431 + next@16.1.3
#8 5.431 + next-auth@4.24.13
#8 5.431 + next-intl@4.7.0
#8 5.431 + next-themes@0.4.6
#8 5.431 + prisma@6.19.2
#8 5.431 + react@19.2.3
#8 5.431 + react-day-picker@9.13.0
#8 5.431 + react-dom@19.2.3
#8 5.431 + react-hook-form@7.71.1
#8 5.431 + react-markdown@10.1.0
#8 5.431 + react-resizable-panels@3.0.6
#8 5.431 + react-syntax-highlighter@15.6.6
#8 5.431 + recharts@2.15.4
#8 5.431 + sharp@0.34.5
#8 5.431 + sonner@2.0.7
#8 5.431 + tailwind-merge@3.4.0
#8 5.431 + tailwindcss-animate@1.0.7
#8 5.431 + uuid@11.1.0
#8 5.431 + vaul@1.1.2
#8 5.431 + z-ai-web-dev-sdk@0.0.16
#8 5.431 + zod@4.3.5
#8 5.431 + zustand@5.0.10
#8 5.431 
#8 5.431 833 packages installed [5.39s]
#8 DONE 6.6s

#9 [builder 2/5] COPY --from=deps /app/node_modules ./node_modules
#9 CACHED

#10 [builder 3/5] COPY . .
#10 DONE 0.1s

#11 [builder 4/5] RUN bunx prisma generate
#11 1.098 Environment variables loaded from .env
#11 1.101 Prisma schema loaded from prisma/schema.prisma
#11 1.442 
#11 1.626 ✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 114ms
#11 1.626 
#11 1.626 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
#11 1.626 
#11 1.626 Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate
#11 1.626 
#11 DONE 2.1s

#12 [builder 5/5] RUN bun run build
#12 0.055 $ next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
#12 1.416 ▲ Next.js 16.1.3 (Turbopack)
#12 1.416 - Environments: .env
#12 1.416 
#12 1.418 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
#12 1.439   Creating an optimized production build ...
#12 7.529 ✓ Compiled successfully in 5.2s
#12 7.532   Skipping validation of types
#12 7.627   Collecting page data using 5 workers ...
#12 8.280   Generating static pages using 5 workers (0/20) ...
#12 8.309   Generating static pages using 5 workers (5/20) 
#12 8.410   Generating static pages using 5 workers (10/20) 
#12 8.421   Generating static pages using 5 workers (15/20) 
#12 8.586 ✓ Generating static pages using 5 workers (20/20) in 304.9ms
#12 8.592   Finalizing page optimization ...
#12 8.954 
#12 8.958 Route (app)
#12 8.958 ┌ ƒ /
#12 8.958 ├ ○ /_not-found
#12 8.958 ├ ƒ /admin
#12 8.958 ├ ƒ /admin/categorias
#12 8.958 ├ ƒ /admin/categorias/[id]
#12 8.958 ├ ƒ /admin/categorias/nueva
#12 8.958 ├ ƒ /admin/configuracion
#12 8.958 ├ ƒ /admin/login
#12 8.958 ├ ƒ /admin/marcas
#12 8.958 ├ ƒ /admin/marcas/[id]
#12 8.958 ├ ƒ /admin/marcas/nueva
#12 8.958 ├ ƒ /admin/paginas
#12 8.958 ├ ƒ /admin/productos
#12 8.958 ├ ƒ /admin/productos/[id]
#12 8.958 ├ ƒ /admin/productos/nuevo
#12 8.958 ├ ƒ /api
#12 8.958 ├ ƒ /api/admin/brands
#12 8.958 ├ ƒ /api/admin/brands/[id]
#12 8.958 ├ ƒ /api/admin/categories
#12 8.958 ├ ƒ /api/admin/categories/[id]
#12 8.958 ├ ƒ /api/admin/products
#12 8.958 ├ ƒ /api/admin/products/[id]
#12 8.958 ├ ƒ /api/auth/login
#12 8.958 ├ ƒ /api/auth/logout
#12 8.958 ├ ƒ /api/auth/me
#12 8.958 ├ ƒ /api/banners
#12 8.958 ├ ƒ /api/brands
#12 8.958 ├ ƒ /api/brands/[slug]
#12 8.958 ├ ƒ /api/categories
#12 8.958 ├ ƒ /api/categories/[slug]
#12 8.958 ├ ƒ /api/contact
#12 8.958 ├ ƒ /api/home
#12 8.958 ├ ƒ /api/products
#12 8.958 ├ ƒ /api/products/[slug]
#12 8.958 ├ ƒ /api/seasons
#12 8.958 ├ ƒ /api/seasons/[slug]
#12 8.958 ├ ƒ /api/settings
#12 8.958 ├ ƒ /api/settings/[group]
#12 8.958 ├ ƒ /catalogo
#12 8.958 ├ ○ /contacto
#12 8.958 ├ ƒ /marcas
#12 8.958 ├ ○ /mayoristas
#12 8.958 ├ ○ /nosotros
#12 8.958 ├ ƒ /producto/[slug]
#12 8.958 └ ƒ /temporadas
#12 8.958 
#12 8.958 
#12 8.958 ƒ Proxy (Middleware)
#12 8.958 
#12 8.959 ○  (Static)   prerendered as static content
#12 8.959 ƒ  (Dynamic)  server-rendered on demand
#12 8.959 
#12 DONE 9.4s

#13 [runner 2/5] COPY --from=builder /app/.next/standalone ./
#13 DONE 1.1s

#14 [runner 3/5] COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
#14 DONE 0.1s

#15 [runner 4/5] COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
#15 DONE 0.3s

#16 [runner 5/5] COPY --from=builder /app/prisma ./prisma
#16 DONE 0.0s

#17 exporting to image
#17 exporting layers
#17 exporting layers 4.3s done
#17 exporting manifest sha256:c1aafe79d9e2657b0c4c7228602f51f32b686fc2c24a7e4cd3eb2196b686fd1f done
#17 exporting config sha256:c100617523aeaa748f90a274873be02ce046fea47ec9ca7c701355e87ecf121c done
#17 exporting attestation manifest sha256:8f07dc47e814c03d3cf1fe045049b8e046d5ce57126a3863a426d59cae53512e done
#17 exporting manifest list sha256:6df26c76bdfe6293e5f03bdcdc883601e42f2caa4c0cefa3d9c3bc0861ed4142 done
#17 naming to docker.io/easypanel/compusum-shop/compusum-app:latest done
#17 unpacking to docker.io/easypanel/compusum-shop/compusum-app:latest
#17 unpacking to docker.io/easypanel/compusum-shop/compusum-app:latest 1.4s done
#17 DONE 5.7s
##########################################
### Success
### Mon, 09 Mar 2026 13:15:18 GMT
##########################################