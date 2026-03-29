Commit: feat(api): add route to increment product views count 
##########################################
### Download Github Archive Started...
### Sun, 29 Mar 2026 22:14:03 GMT
##########################################

#0 building with "default" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.14kB done
#1 DONE 0.0s

#2 [internal] load metadata for docker.io/oven/bun:latest
#2 DONE 0.3s

#3 [internal] load .dockerignore
#3 transferring context: 177B done
#3 DONE 0.0s

#4 [base 1/1] FROM docker.io/oven/bun:latest@sha256:0733e50325078969732ebe3b15ce4c4be5082f18c4ac1a0f0ca4839c2e4e42a7
#4 resolve docker.io/oven/bun:latest@sha256:0733e50325078969732ebe3b15ce4c4be5082f18c4ac1a0f0ca4839c2e4e42a7 done
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 1.50MB 0.0s done
#5 DONE 0.0s

#6 [deps 3/3] RUN bun install --frozen-lockfile
#6 CACHED

#7 [deps 1/3] WORKDIR /app
#7 CACHED

#8 [deps 2/3] COPY package.json bun.lock* ./
#8 CACHED

#9 [builder 2/5] COPY --from=deps /app/node_modules ./node_modules
#9 CACHED

#10 [builder 3/5] COPY . .
#10 DONE 0.1s

#11 [builder 4/5] RUN bunx prisma generate
#11 0.903 Environment variables loaded from .env
#11 0.904 Prisma schema loaded from prisma/schema.prisma
#11 1.345 
#11 1.532 ✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 127ms
#11 1.532 
#11 1.532 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
#11 1.532 
#11 1.532 Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints
#11 1.532 
#11 DONE 1.6s

#12 [builder 5/5] RUN bun run build
#12 0.053 $ next build && node scripts/copy-standalone-assets.mjs
#12 1.277 ▲ Next.js 16.1.3 (Turbopack)
#12 1.277 - Environments: .env
#12 1.277 
#12 1.289 
#12 1.289 > Build error occurred
#12 1.292 Error: Ambiguous app routes detected:
#12 1.292 
#12 1.292 Ambiguous route pattern "/api/products/[*]/view" matches multiple routes:
#12 1.292   - /api/products/[id]/view
#12 1.292   - /api/products/[slug]/view
#12 1.292 
#12 1.292 These routes cannot be distinguished from each other when matching URLs. Please ensure that dynamic segments have unique patterns or use different static segments.
#12 1.292     at processTicksAndRejections (null)
#12 1.315 error: script "build" exited with code 1
#12 ERROR: process "/bin/sh -c bun run build" did not complete successfully: exit code: 1
------
 > [builder 5/5] RUN bun run build:
1.289 > Build error occurred
1.292 Error: Ambiguous app routes detected:
1.292 
1.292 Ambiguous route pattern "/api/products/[*]/view" matches multiple routes:
1.292   - /api/products/[id]/view
1.292   - /api/products/[slug]/view
1.292 
1.292 These routes cannot be distinguished from each other when matching URLs. Please ensure that dynamic segments have unique patterns or use different static segments.
1.292     at processTicksAndRejections (null)
1.315 error: script "build" exited with code 1
------
Dockerfile:19
--------------------
  17 |     RUN bunx prisma generate
  18 |     ENV NEXT_TELEMETRY_DISABLED=1
  19 | >>> RUN bun run build
  20 |     
  21 |     # 3. Runner (Producción)
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c bun run build" did not complete successfully: exit code: 1
##########################################
### Error
### Sun, 29 Mar 2026 22:14:07 GMT
##########################################
