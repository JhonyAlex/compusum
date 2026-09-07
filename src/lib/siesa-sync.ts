import { createHash } from 'crypto';
import { db } from './db';
import { parseSiesaCSV, ParsedSiesaResult, SiesaProductGroup } from './siesa-parser';

export interface PreflightSummary {
  totalRows: number;
  uniqueReferences: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  zeroPriceCount: number;
  absentDepletedCount: number;
  absentSampleSkus: string[];
  errors: string[];
}

export interface SyncExecutionOptions {
  fileName?: string;
  reconcileAbsent?: boolean;
  batchSize?: number;
}

export interface SyncExecutionResult {
  syncLogId: string;
  fileHash: string;
  totalRows: number;
  uniqueReferences: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  zeroPriceCount: number;
  depletedCount: number;
  errorCount: number;
  errors: string[];
  durationMs: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeSHA256(content: string | Buffer | Uint8Array): string {
  const hash = createHash('sha256');
  if (typeof content === 'string') {
    hash.update(content, 'utf8');
  } else {
    hash.update(content);
  }
  return hash.digest('hex');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function normalizeLookup(value?: string): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeVariantName(value?: string): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// ─── Concurrency Lock (Atomic Mutual Exclusion in PostgreSQL) ────────────────

const SIESA_LOCK_KEY = 'siesa_sync';
const LOCK_TIMEOUT_MINUTES = 15;

export interface SyncLockResult {
  acquired: boolean;
  runningLogId?: string;
  holderId?: string;
}

export async function acquireSyncLock(holderId?: string): Promise<SyncLockResult> {
  const effectiveHolderId =
    holderId || `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timeoutMs = LOCK_TIMEOUT_MINUTES * 60 * 1000;
  const expiresAt = new Date(Date.now() + timeoutMs);

  try {
    const result = await db.$queryRaw<{ holderId: string }[]>`
      INSERT INTO "SyncLock" ("id", "holderId", "acquiredAt", "expiresAt")
      VALUES (${SIESA_LOCK_KEY}, ${effectiveHolderId}, NOW(), ${expiresAt})
      ON CONFLICT ("id") DO UPDATE
      SET "holderId" = EXCLUDED."holderId",
          "acquiredAt" = EXCLUDED."acquiredAt",
          "expiresAt" = EXCLUDED."expiresAt"
      WHERE "SyncLock"."expiresAt" < NOW()
      RETURNING "holderId"
    `;

    if (result.length > 0 && result[0].holderId === effectiveHolderId) {
      return { acquired: true, holderId: effectiveHolderId };
    }

    const activeLog = await db.productSyncLog.findFirst({
      where: { status: 'running' },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });

    return {
      acquired: false,
      runningLogId: activeLog?.id,
    };
  } catch (error) {
    console.error('Error al adquirir lock atómico en PostgreSQL:', error);
    return { acquired: false };
  }
}

export async function releaseSyncLock(holderId: string): Promise<void> {
  if (!holderId) return;
  try {
    await db.$executeRaw`
      DELETE FROM "SyncLock"
      WHERE "id" = ${SIESA_LOCK_KEY} AND "holderId" = ${holderId}
    `;
  } catch (err) {
    console.error('Error al liberar lock de sincronización:', err);
  }
}

// ─── Preflight Analysis ──────────────────────────────────────────────────────

/**
 * Runs a non-mutating preflight analysis of the Siesa CSV against current database state.
 */
export async function runSiesaPreflight(
  rawInput: string | Buffer | Uint8Array
): Promise<PreflightSummary> {
  const parsed = parseSiesaCSV(rawInput);

  if (parsed.products.length === 0) {
    return {
      totalRows: parsed.totalRows,
      uniqueReferences: 0,
      newCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
      zeroPriceCount: 0,
      absentDepletedCount: 0,
      absentSampleSkus: [],
      errors: parsed.errors,
    };
  }

  // Load all references from CSV
  const csvSkus = parsed.products.map((p) => p.reference);

  // Query existing products matching CSV references
  const existingProducts = await db.product.findMany({
    where: {
      sku: { in: csvSkus },
    },
    select: {
      id: true,
      sku: true,
      price: true,
      stockQuantity: true,
      stockStatus: true,
      variants: {
        select: {
          id: true,
          normalizedName: true,
          price: true,
          stockQuantity: true,
        },
      },
    },
  });

  const existingBySku = new Map<string, (typeof existingProducts)[number]>();
  for (const ep of existingProducts) {
    if (ep.sku) existingBySku.set(ep.sku, ep);
  }

  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  for (const prod of parsed.products) {
    const existing = existingBySku.get(prod.reference);
    if (!existing) {
      newCount++;
      continue;
    }

    const priceMatches = Math.abs((existing.price ?? 0) - prod.price) < 0.01;
    const stockMatches = existing.stockQuantity === prod.stockQuantity;

    // Check variant stock/prices
    let variantsMatch = true;
    if (prod.variants.length > 0) {
      if (existing.variants.length !== prod.variants.length) {
        variantsMatch = false;
      } else {
        for (const v of prod.variants) {
          const norm = normalizeVariantName(v.name);
          const ev = existing.variants.find((x) => x.normalizedName === norm);
          if (!ev || ev.stockQuantity !== v.stockQuantity || Math.abs((ev.price ?? 0) - v.price) >= 0.01) {
            variantsMatch = false;
            break;
          }
        }
      }
    }

    if (priceMatches && stockMatches && variantsMatch) {
      unchangedCount++;
    } else {
      updatedCount++;
    }
  }

  // Check absent products in DB that currently have stock > 0
  const csvSkuSet = new Set(csvSkus);
  const activeDbProducts = await db.product.findMany({
    where: {
      sku: { not: null },
      stockQuantity: { gt: 0 },
    },
    select: { sku: true },
  });

  const absentSkus: string[] = [];
  for (const ap of activeDbProducts) {
    if (ap.sku && !csvSkuSet.has(ap.sku)) {
      absentSkus.push(ap.sku);
    }
  }

  return {
    totalRows: parsed.totalRows,
    uniqueReferences: parsed.uniqueReferences,
    newCount,
    updatedCount,
    unchangedCount,
    zeroPriceCount: parsed.zeroPriceReferences,
    absentDepletedCount: absentSkus.length,
    absentSampleSkus: absentSkus.slice(0, 10),
    errors: parsed.errors,
  };
}

// ─── Siesa Sync Execution ────────────────────────────────────────────────────

/**
 * Performs an idempotent, audited synchronization from Siesa CSV data.
 */
export async function executeSiesaSync(
  rawInput: string | Buffer | Uint8Array,
  options: SyncExecutionOptions = {}
): Promise<SyncExecutionResult> {
  const startTime = Date.now();
  const fileHash = computeSHA256(rawInput);
  const fileName = options.fileName || 'Productos.csv';
  const batchSize = options.batchSize || 50;

  // 1. Parse CSV and validate Siesa format strictly BEFORE database writes
  const parsed = parseSiesaCSV(rawInput);
  if (parsed.errors.some((e) => e.includes('Cabecera CSV inválida'))) {
    throw new Error('El archivo no corresponde inequívocamente al formato CSV de Siesa: cabecera inválida.');
  }
  if (parsed.products.length === 0) {
    throw new Error('El archivo CSV no contiene registros de productos válidos.');
  }

  // 2. Atomic PostgreSQL concurrency lock
  const lock = await acquireSyncLock();
  if (!lock.acquired || !lock.holderId) {
    throw new Error(
      `Otra sincronización está actualmente en progreso (Sync ID: ${lock.runningLogId || 'activo'}). Espere a que finalice.`
    );
  }

  try {
    // 3. Create Audit Log
    const syncLog = await db.productSyncLog.create({
      data: {
        fileName,
        fileHash,
        status: 'running',
        totalRows: parsed.totalRows,
        uniqueRefs: parsed.uniqueReferences,
        zeroPriceCount: parsed.zeroPriceReferences,
        startedAt: new Date(),
        metadata: JSON.stringify({
          reconcileAbsent: options.reconcileAbsent ?? true,
          batchSize,
        }),
      },
    });

    let createdCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    let depletedCount = 0;
    const executionErrors: string[] = [...parsed.errors];

    try {
    // 4. Preload brands and ensure fallback category
    const allBrands = await db.brand.findMany({ select: { id: true, name: true, slug: true } });
    const brandMap = new Map(allBrands.map((b) => [normalizeLookup(b.name), b]));

    let fallbackCategory = await db.category.findUnique({ where: { slug: 'sin-categoria' } });
    if (!fallbackCategory) {
      fallbackCategory = await db.category.upsert({
        where: { slug: 'sin-categoria' },
        update: {},
        create: { name: 'Sin categoría', slug: 'sin-categoria', isActive: true },
      });
    }

    const syncTimestamp = new Date();

    // 5. Process products in batches
    const products = parsed.products;
    let hadBatchFailure = false;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      try {
        await db.$transaction(
          async (tx) => {
            for (const item of batch) {
              // ── Resolve Brand ──────────────────────────────────────────
              let brandId: string | null = null;
              if (item.brand) {
                const brandKey = normalizeLookup(item.brand);
                let brandRecord = brandMap.get(brandKey);
                if (!brandRecord) {
                  let bSlug = slugify(item.brand);
                  if (!bSlug) bSlug = `marca-${Date.now()}`;
                  brandRecord = await tx.brand.upsert({
                    where: { slug: bSlug },
                    update: {},
                    create: { name: item.brand.trim(), slug: bSlug, isActive: true },
                    select: { id: true, name: true, slug: true },
                  });
                  brandMap.set(brandKey, brandRecord);
                }
                brandId = brandRecord.id;
              }

              // ── Check Existing Product ─────────────────────────────────
              const existing = await tx.product.findUnique({
                where: { sku: item.reference },
                include: {
                  variants: true,
                },
              });

              let targetProductId: string;

              if (existing) {
                // Check if anything actually changed (idempotency check)
                const priceMatches = Math.abs((existing.price ?? 0) - item.price) < 0.01;
                const stockMatches = existing.stockQuantity === item.stockQuantity;

                let variantsMatch = true;
                if (item.variants.length > 0) {
                  if (existing.variants.length !== item.variants.length) {
                    variantsMatch = false;
                  } else {
                    for (const v of item.variants) {
                      const norm = normalizeVariantName(v.name);
                      const ev = existing.variants.find((x) => x.normalizedName === norm);
                      if (!ev || ev.stockQuantity !== v.stockQuantity || Math.abs((ev.price ?? 0) - v.price) >= 0.01) {
                        variantsMatch = false;
                        break;
                      }
                    }
                  }
                }

                if (priceMatches && stockMatches && variantsMatch) {
                  unchangedCount++;
                } else {
                  updatedCount++;
                }

                // Important: Preserve admin editorial choice (isActive is NEVER reactivated if admin disabled it)
                await tx.product.update({
                  where: { id: existing.id },
                  data: {
                    price: item.price,
                    stockQuantity: item.stockQuantity,
                    stockStatus: item.stockStatus,
                    lastSyncAt: syncTimestamp,
                    syncSource: 'siesa',
                    ...(brandId && !existing.brandId ? { brandId } : {}),
                  },
                });

                targetProductId = existing.id;
              } else {
                // Brand new product
                createdCount++;
                let pSlug = slugify(item.name);
                const slugExists = await tx.product.findUnique({ where: { slug: pSlug } });
                if (slugExists) {
                  pSlug = `${pSlug}-${item.reference.toLowerCase()}`;
                }

                const created = await tx.product.create({
                  data: {
                    name: item.name,
                    slug: pSlug,
                    sku: item.reference, // Preserved as string
                    price: item.price,
                    stockQuantity: item.stockQuantity,
                    stockStatus: item.stockStatus,
                    categoryId: fallbackCategory.id,
                    brandId,
                    isActive: true, // Default active for newly imported
                    lastSyncAt: syncTimestamp,
                    syncSource: 'siesa',
                  },
                });

                targetProductId = created.id;
              }

              // ── Sync Variants ──────────────────────────────────────────
              const activeVariantNorms = new Set<string>();

              for (let vi = 0; vi < item.variants.length; vi++) {
                const v = item.variants[vi];
                const normalizedName = normalizeVariantName(v.name);
                if (!normalizedName) continue;

                activeVariantNorms.add(normalizedName);

                await tx.productVariant.upsert({
                  where: {
                    productId_normalizedName: {
                      productId: targetProductId,
                      normalizedName,
                    },
                  },
                  update: {
                    name: v.name,
                    code: v.code,
                    price: v.price,
                    stockQuantity: v.stockQuantity,
                    stockStatus: v.stockStatus,
                    lastSyncAt: syncTimestamp,
                  },
                  create: {
                    productId: targetProductId,
                    name: v.name,
                    code: v.code,
                    normalizedName,
                    price: v.price,
                    stockQuantity: v.stockQuantity,
                    stockStatus: v.stockStatus,
                    sortOrder: vi,
                    isActive: true,
                    lastSyncAt: syncTimestamp,
                  },
                });
              }

              // For any pre-existing variants of this product no longer in the CSV,
              // mark them as stockQuantity: 0, stockStatus: 'agotado' (NEVER DELETE)
              if (existing && existing.variants.length > 0) {
                for (const oldVariant of existing.variants) {
                  if (!activeVariantNorms.has(oldVariant.normalizedName)) {
                    await tx.productVariant.update({
                      where: { id: oldVariant.id },
                      data: {
                        stockQuantity: 0,
                        stockStatus: 'agotado',
                        lastSyncAt: syncTimestamp,
                      },
                    });
                  }
                }
              }
            }
          },
          { timeout: 30000 }
        );
      } catch (batchErr: unknown) {
        hadBatchFailure = true;
        const msg = batchErr instanceof Error ? batchErr.message : String(batchErr);
        executionErrors.push(`Error en lote ${Math.floor(i / batchSize) + 1}: ${msg}`);
      }
    }

    // 6. Absent Reference Safe Reconciliation
    // Only reconcile if explicitly enabled, zero parser errors, zero batch failures, and zero execution errors.
    const shouldReconcile =
      Boolean(options.reconcileAbsent) &&
      parsed.errors.length === 0 &&
      !hadBatchFailure &&
      executionErrors.length === 0;

    if (shouldReconcile) {
      // Find Siesa products that were NOT touched in this run and have stock > 0
      const absentProducts = await db.product.findMany({
        where: {
          syncSource: 'siesa',
          sku: { not: null },
          stockQuantity: { gt: 0 },
          OR: [
            { lastSyncAt: { lt: syncTimestamp } },
            { lastSyncAt: null },
          ],
        },
        select: { id: true, sku: true },
      });

      if (absentProducts.length > 0) {
        const absentIds = absentProducts.map((p) => p.id);

        await db.product.updateMany({
          where: { id: { in: absentIds } },
          data: {
            stockQuantity: 0,
            stockStatus: 'agotado',
            lastSyncAt: syncTimestamp,
          },
        });

        await db.productVariant.updateMany({
          where: { productId: { in: absentIds } },
          data: {
            stockQuantity: 0,
            stockStatus: 'agotado',
            lastSyncAt: syncTimestamp,
          },
        });

        depletedCount = absentProducts.length;
      }
    }

    // 7. Complete Audit Log (never completed if there are any parser or batch errors)
    const hasAnyError = hadBatchFailure || parsed.errors.length > 0 || executionErrors.length > 0;
    const finalStatus = hasAnyError ? 'failed' : 'completed';
    await db.productSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: finalStatus,
        createdCount,
        updatedCount,
        unchangedCount,
        depletedCount,
        errorCount: executionErrors.length,
        errors: executionErrors.length > 0 ? JSON.stringify(executionErrors.slice(0, 100)) : null,
        completedAt: new Date(),
      },
    });

    return {
      syncLogId: syncLog.id,
      fileHash,
      totalRows: parsed.totalRows,
      uniqueReferences: parsed.uniqueReferences,
      createdCount,
      updatedCount,
      unchangedCount,
      zeroPriceCount: parsed.zeroPriceReferences,
      depletedCount,
      errorCount: executionErrors.length,
      errors: executionErrors,
      durationMs: Date.now() - startTime,
    };
  } catch (fatalErr: unknown) {
    const msg = fatalErr instanceof Error ? fatalErr.message : String(fatalErr);
    executionErrors.push(`Fallo fatal en sincronización: ${msg}`);

    await db.productSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'failed',
        errorCount: executionErrors.length,
        errors: JSON.stringify(executionErrors.slice(0, 100)),
        completedAt: new Date(),
      },
    });

    throw fatalErr;
  }
  } finally {
    await releaseSyncLock(lock.holderId);
  }
}
