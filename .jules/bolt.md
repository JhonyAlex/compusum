## 2024-03-13 - [HomePage Performance]
**Learning:** Next.js `force-dynamic` forces the homepage to render dynamically on every request. This is because we fetch `brands` from the database. But the homepage brands do not change frequently enough to warrant SSR on every single hit.
**Action:** We can either change the caching strategy (e.g. `revalidate = 3600`) or remove `force-dynamic` and rely on default Next.js static caching for better performance.
