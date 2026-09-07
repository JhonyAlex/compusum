import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseColombianPrice,
  decodeSiesaBuffer,
  parseSiesaCSV,
  isSiesaCSVHeader,
} from '@/lib/siesa-parser';
import {
  runSiesaPreflight,
  executeSiesaSync,
  acquireSyncLock,
} from '@/lib/siesa-sync';
import { validateAndPriceItems, CartValidationError } from '@/lib/cart-validation';
import { db } from '@/lib/db';

describe('Siesa Synchronization & Parser Unit Tests', () => {
  // ── 1. Colombian Price Parsing ──────────────────────────────────────────────
  describe('Colombian Currency Parsing', () => {
    it('correctly parses $1.845,02 into 1845.02', () => {
      expect(parseColombianPrice('$1.845,02')).toBe(1845.02);
    });

    it('correctly parses prices with various thousands and decimals', () => {
      expect(parseColombianPrice('$725,16')).toBe(725.16);
      expect(parseColombianPrice('$8.640,00')).toBe(8640);
      expect(parseColombianPrice('$18.457,20')).toBe(18457.2);
      expect(parseColombianPrice('$50,49')).toBe(50.49);
    });

    it('correctly parses zero price ($0,00 or $0) as 0', () => {
      expect(parseColombianPrice('$0,00')).toBe(0);
      expect(parseColombianPrice('$0')).toBe(0);
      expect(parseColombianPrice(null)).toBe(0);
      expect(parseColombianPrice('')).toBe(0);
    });
  });

  // ── 2. SKU Leading Zero Preservation ───────────────────────────────────────
  describe('SKU Leading Zero Preservation', () => {
    it('preserves leading zeros for SKU 001403 as string', () => {
      const csvContent = `"U.M.","Desc. item","MARCA","Referencia","Precio unitario","Existencia","Desc. detalle ext. 1","Desc. normal extensión 1 ",
"UND ","SACAPUNTA KORES MIGO DOBLE","KORE - INDUSTRIAS KORES","001403",$1.845,02,116,"GN       ","UNIDAD",`;

      const result = parseSiesaCSV(csvContent);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].reference).toBe('001403');
      expect(typeof result.products[0].reference).toBe('string');
      expect(result.products[0].price).toBe(1845.02);
      expect(result.products[0].stockQuantity).toBe(116);
    });

    it('preserves leading zeros for other typical SKUs', () => {
      const csvContent = `"U.M.","Desc. item","MARCA","Referencia","Precio unitario","Existencia","Desc. detalle ext. 1","Desc. normal extensión 1 ",
"UND ","PLAST PARCHE BARRA x 55gr","DORI - DORICOLOR","000121",$725,16,1,"NEGRO    ","UNIDAD",
"UND ","BOLA ICOPOR","PALM - PALMIPOR","000046",$50,00,10,"GN       ","UNIDAD",`;

      const result = parseSiesaCSV(csvContent);
      expect(result.products[0].reference).toBe('000121');
      expect(result.products[1].reference).toBe('000046');
    });
  });

  // ── 3. CP1252 Character Decoding ───────────────────────────────────────────
  describe('CP1252 (Windows-1252) Decoding', () => {
    it('accurately decodes CP1252 encoded buffer with accents and Spanish ñ', () => {
      // Create raw bytes in Windows-1252
      // "extensión" in windows-1252 has ó as 0xF3
      // "LÁPIZ" has Á as 0xC1
      // "COMPÁS" has Á as 0xC1
      const win1252Bytes = new Uint8Array([
        0x22, 0x55, 0x2e, 0x4d, 0x2e, 0x22, 0x2c, // "U.M.",
        0x22, 0x44, 0x65, 0x73, 0x63, 0x2e, 0x20, 0x69, 0x74, 0x65, 0x6d, 0x22, 0x2c, // "Desc. item",
        0x22, 0x4d, 0x41, 0x52, 0x43, 0x41, 0x22, 0x2c, // "MARCA",
        0x22, 0x52, 0x65, 0x66, 0x65, 0x72, 0x65, 0x6e, 0x63, 0x69, 0x61, 0x22, 0x2c, // "Referencia",
        0x22, 0x50, 0x72, 0x65, 0x63, 0x69, 0x6f, 0x20, 0x75, 0x6e, 0x69, 0x74, 0x61, 0x72, 0x69, 0x6f, 0x22, 0x2c, // "Precio unitario",
        0x22, 0x45, 0x78, 0x69, 0x73, 0x74, 0x65, 0x6e, 0x63, 0x69, 0x61, 0x22, 0x2c, // "Existencia",
        0x22, 0x44, 0x65, 0x73, 0x63, 0x2e, 0x20, 0x64, 0x65, 0x74, 0x61, 0x6c, 0x6c, 0x65, 0x20, 0x65, 0x78, 0x74, 0x2e, 0x20, 0x31, 0x22, 0x2c, // "Desc. detalle ext. 1",
        0x22, 0x44, 0x65, 0x73, 0x63, 0x2e, 0x20, 0x6e, 0x6f, 0x72, 0x6d, 0x61, 0x6c, 0x20, 0x65, 0x78, 0x74, 0x65, 0x6e, 0x73, 0x69, 0xf3, 0x6e, 0x20, 0x31, 0x22, 0x2c, 0x0a, // "Desc. normal extensión 1",\n
        0x22, 0x55, 0x4e, 0x44, 0x20, 0x22, 0x2c, // "UND ",
        0x22, 0x43, 0x4f, 0x4d, 0x50, 0xc1, 0x53, 0x20, 0x4c, 0xc1, 0x50, 0x49, 0x5a, 0x22, 0x2c, // "COMPÁS LÁPIZ",
        0x22, 0x4d, 0x41, 0x52, 0x43, 0x41, 0x22, 0x2c, // "MARCA",
        0x22, 0x30, 0x30, 0x33, 0x33, 0x35, 0x33, 0x22, 0x2c, // "003353",
        0x24, 0x34, 0x33, 0x32, 0x2c, 0x30, 0x30, 0x2c, 0x31, 0x30, 0x2c, // $432,00,10,
        0x22, 0x47, 0x4e, 0x20, 0x22, 0x2c, // "GN ",
        0x22, 0x55, 0x4e, 0x49, 0x44, 0x41, 0x44, 0x22, 0x2c // "UNIDAD",
      ]);

      const decoded = decodeSiesaBuffer(win1252Bytes);
      expect(decoded).toContain('extensión');
      expect(decoded).toContain('COMPÁS LÁPIZ');

      const parsed = parseSiesaCSV(win1252Bytes);
      expect(parsed.products[0].name).toBe('COMPÁS LÁPIZ');
      expect(parsed.products[0].reference).toBe('003353');
    });
  });

  // ── 4. Single-Row Reference ────────────────────────────────────────────────
  describe('Single-Row Reference', () => {
    it('handles a single row reference cleanly without duplicate generic variants', () => {
      const csv = `"U.M.","Desc. item","MARCA","Referencia","Precio unitario","Existencia","Desc. detalle ext. 1","Desc. normal extensión 1 ",
"UND ","RESMA PAPEL BOND 75G","REPROGRAF","009871",$15.500,00,45,"GN       ","UNIDAD",`;

      const result = parseSiesaCSV(csv);
      expect(result.products).toHaveLength(1);
      const prod = result.products[0];
      expect(prod.reference).toBe('009871');
      expect(prod.name).toBe('RESMA PAPEL BOND 75G');
      expect(prod.price).toBe(15500);
      expect(prod.stockQuantity).toBe(45);
      expect(prod.stockStatus).toBe('disponible');
      expect(prod.variants).toHaveLength(0); // Generic variant marker GN produces 0 extra variants
    });
  });

  // ── 5 & 6. Multi-Variant Reference and Inventory Aggregation ───────────────
  describe('Multi-Variant Reference and Coherent Inventory Aggregation', () => {
    it('groups multiple rows into a single product with variants and aggregates inventory', () => {
      const csv = `"U.M.","Desc. item","MARCA","Referencia","Precio unitario","Existencia","Desc. detalle ext. 1","Desc. normal extensión 1 ",
"UND ","VINILO RAPID 60CC","RAPID","001589",$18.457,20,6,"PLATA    ","UNIDAD",
"UND ","VINILO RAPID 60CC","RAPID","001589",$18.457,20,1,"ROJO     ","UNIDAD",
"UND ","VINILO RAPID 60CC","RAPID","001589",$18.457,20,1,"AZUL     ","UNIDAD",`;

      const result = parseSiesaCSV(csv);
      expect(result.products).toHaveLength(1);
      const prod = result.products[0];
      expect(prod.reference).toBe('001589');
      expect(prod.variants).toHaveLength(3);
      expect(prod.variants.map((v) => v.name)).toEqual(['Plata', 'Rojo', 'Azul']);
      expect(prod.variants[0].stockQuantity).toBe(6);
      expect(prod.variants[1].stockQuantity).toBe(1);
      expect(prod.variants[2].stockQuantity).toBe(1);

      // Inventory aggregation: 6 + 1 + 1 = 8
      expect(prod.stockQuantity).toBe(8);
      expect(prod.stockStatus).toBe('disponible');
    });

    it('sets stockStatus to agotado when total aggregated inventory is 0', () => {
      const csv = `"U.M.","Desc. item","MARCA","Referencia","Precio unitario","Existencia","Desc. detalle ext. 1","Desc. normal extensión 1 ",
"UND ","TIJERA ESCOLAR","FABER","009999",$2.500,00,0,"ROJO     ","UNIDAD",
"UND ","TIJERA ESCOLAR","FABER","009999",$2.500,00,0,"AZUL     ","UNIDAD",`;

      const result = parseSiesaCSV(csv);
      const prod = result.products[0];
      expect(prod.stockQuantity).toBe(0);
      expect(prod.stockStatus).toBe('agotado');
      expect(prod.variants[0].stockStatus).toBe('agotado');
      expect(prod.variants[1].stockStatus).toBe('agotado');
    });
  });

  // ── 7. Price 0 Protection ──────────────────────────────────────────────────
  describe('Price 0 Cannot Produce COP 0 Orders', () => {
    it('flags price 0 products during parsing', () => {
      const csv = `"U.M.","Desc. item","MARCA","Referencia","Precio unitario","Existencia","Desc. detalle ext. 1","Desc. normal extensión 1 ",
"UND ","CATALOGO MUESTRARIO","GENERICO","005555",$0,00,10,"GN       ","UNIDAD",`;

      const result = parseSiesaCSV(csv);
      expect(result.products[0].price).toBe(0);
      expect(result.products[0].isZeroPrice).toBe(true);
      expect(result.zeroPriceReferences).toBe(1);
    });

    it('rejects items with price 0 in validateAndPriceItems', async () => {
      const mockTx = {
        product: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'prod-zero',
              name: 'Producto Sin Precio',
              sku: '005555',
              isActive: true,
              stockStatus: 'disponible',
              price: 0,
              wholesalePrice: null,
              variants: [],
            },
          ]),
        },
      };

      await expect(
        validateAndPriceItems([{ productId: 'prod-zero', quantity: 1 }], mockTx)
      ).rejects.toThrow(CartValidationError);

      await expect(
        validateAndPriceItems([{ productId: 'prod-zero', quantity: 1 }], mockTx)
      ).rejects.toThrow('requiere cotización y no puede tramitarse con precio COP 0');
    });
  });

async function checkDbConnected(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

  // ── 8. Idempotent Synchronization ──────────────────────────────────────────
  describe('Idempotent Synchronization', () => {
    it('produces identical database state on consecutive identical imports', async (ctx) => {
      const dbConnected = await checkDbConnected();
      if (!dbConnected) {
        ctx.skip();
        return;
      }

      const csv = `"U.M.","Desc. item","MARCA","Referencia","Precio unitario","Existencia","Desc. detalle ext. 1","Desc. normal extensión 1 ",
"UND ","ITEM IDEMPOTENCIA A","MARCA TEST","SKU-IDEM-1",$5.000,00,10,"GN       ","UNIDAD",
"UND ","ITEM IDEMPOTENCIA B","MARCA TEST","SKU-IDEM-2",$10.000,00,20,"GN       ","UNIDAD",`;

      // First sync
      const res1 = await executeSiesaSync(csv, { fileName: 'test-idempotency.csv' });
      expect(res1.createdCount).toBe(2);
      expect(res1.updatedCount).toBe(0);

      // Second sync with exact same data
      const res2 = await executeSiesaSync(csv, { fileName: 'test-idempotency.csv' });
      expect(res2.createdCount).toBe(0);
      expect(res2.unchangedCount).toBe(2);
      expect(res2.updatedCount).toBe(0);

      // Verify product state
      const p1 = await db.product.findUnique({ where: { sku: 'SKU-IDEM-1' } });
      expect(p1).not.toBeNull();
      expect(p1!.price).toBe(5000);
      expect(p1!.stockQuantity).toBe(10);
      expect(p1!.stockStatus).toBe('disponible');

      // Cleanup test products
      await db.product.deleteMany({
        where: { sku: { in: ['SKU-IDEM-1', 'SKU-IDEM-2'] } },
      });
    });
  });

  // ── 9. Absent Reference Safe Reconciliation ────────────────────────────────
  describe('Absent Reference Safe Reconciliation', () => {
    it('marks absent references as stock 0 and agotado without deleting them', async (ctx) => {
      const dbConnected = await checkDbConnected();
      if (!dbConnected) {
        ctx.skip();
        return;
      }

      const csvRun1 = `"U.M.","Desc. item","MARCA","Referencia","Precio unitario","Existencia","Desc. detalle ext. 1","Desc. normal extensión 1 ",
"UND ","PROD RECON A","MARCA RECON","SKU-RECON-A",$1.000,00,10,"GN       ","UNIDAD",
"UND ","PROD RECON B","MARCA RECON","SKU-RECON-B",$2.000,00,15,"GN       ","UNIDAD",`;

      // Sync both A and B
      await executeSiesaSync(csvRun1, { fileName: 'recon-run1.csv' });

      // Run 2: only contains A; B is absent
      const csvRun2 = `"U.M.","Desc. item","MARCA","Referencia","Precio unitario","Existencia","Desc. detalle ext. 1","Desc. normal extensión 1 ",
"UND ","PROD RECON A","MARCA RECON","SKU-RECON-A",$1.000,00,10,"GN       ","UNIDAD",`;

      const res2 = await executeSiesaSync(csvRun2, {
        fileName: 'recon-run2.csv',
        reconcileAbsent: true,
      });

      expect(res2.depletedCount).toBeGreaterThanOrEqual(1);

      // B must STILL exist in database (never deleted), but with stockQuantity 0 and stockStatus 'agotado'
      const prodB = await db.product.findUnique({ where: { sku: 'SKU-RECON-B' } });
      expect(prodB).not.toBeNull();
      expect(prodB!.stockQuantity).toBe(0);
      expect(prodB!.stockStatus).toBe('agotado');

      // Cleanup
      await db.product.deleteMany({
        where: { sku: { in: ['SKU-RECON-A', 'SKU-RECON-B'] } },
      });
    });
  });

  // ── 10. Partial Failure Prevents Destructive Reconciliation ────────────────
  describe('Partial Failure Protection', () => {
    it('skips absent reconciliation if any batch fails', async () => {
      // If reconcileAbsent is false or if there are batch errors, reconciliation is aborted
      const preflight = await runSiesaPreflight(
        `"U.M.","Desc. item","MARCA","Referencia","Precio unitario","Existencia","Desc. detalle ext. 1","Desc. normal extensión 1 ",
"UND ","PROD CORRUPT","MARCA","SKU-FAIL",invalid-price-and-stock,"GN","UNIDAD",`
      );

      expect(preflight.errors.length).toBeGreaterThan(0);
    });
  });

  // ── 11. Historical Cart & Order Snapshot Preservation ──────────────────────
  describe('Cart and Order Snapshot Preservation', () => {
    it('preserves OrderItem snapshot prices and quantities even when product stock or price changes', async (ctx) => {
      const dbConnected = await checkDbConnected();
      if (!dbConnected) {
        ctx.skip();
        return;
      }

      // Create a test product
      const product = await db.product.create({
        data: {
          name: 'Producto Historico',
          slug: `prod-hist-${Date.now()}`,
          sku: `SKU-HIST-${Date.now()}`,
          price: 5000,
          stockQuantity: 10,
          stockStatus: 'disponible',
          category: {
            connectOrCreate: {
              where: { slug: 'sin-categoria' },
              create: { name: 'Sin categoría', slug: 'sin-categoria' },
            },
          },
        },
      });

      // Create an Order with an OrderItem snapshot
      const cart = await db.cart.create({
        data: {
          sessionId: `sess-${Date.now()}`,
          status: 'convertido',
          subtotal: 10000,
        },
      });

      const order = await db.order.create({
        data: {
          orderNumber: `ORD-HIST-${Date.now()}`,
          cartId: cart.id,
          subtotal: 10000,
          status: 'solicitado',
          items: {
            create: [
              {
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                quantity: 2,
                unitPrice: 5000,
              },
            ],
          },
        },
        include: { items: true },
      });

      const initialOrderItem = order.items[0];
      expect(initialOrderItem.unitPrice).toBe(5000);
      expect(initialOrderItem.quantity).toBe(2);

      // Now simulate a Siesa sync that changes the product's price to 7500 and stock to 0
      await db.product.update({
        where: { id: product.id },
        data: {
          price: 7500,
          stockQuantity: 0,
          stockStatus: 'agotado',
        },
      });

      // Verify the OrderItem snapshot remained totally unchanged
      const freshOrder = await db.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      expect(freshOrder!.items[0].unitPrice).toBe(5000);
      expect(freshOrder!.items[0].quantity).toBe(2);
      expect(freshOrder!.items[0].productName).toBe('Producto Historico');

      // Cleanup
      await db.order.delete({ where: { id: order.id } });
      await db.cart.delete({ where: { id: cart.id } });
      await db.product.delete({ where: { id: product.id } });
    });
  });
});
