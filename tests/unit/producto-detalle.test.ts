import { describe, it, expect, vi } from 'vitest';

/**
 * PRUEBA FUNCIONAL — Detalle de producto (P0-4) para DOS perfiles.
 *
 * Simula el pipeline del servidor que alimenta la página /producto/[slug] y
 * el ProductDetailCTA: attachResolvedPrices() sobre el producto (con y sin
 * variantes) y el espejo de precio que el CTA usa para agregar al carrito.
 *
 * Garantías:
 *  - Cliente A (perfil -10%) ve/agrega el precio RESUELTO, no el base.
 *  - Cliente B (sin perfil) ve/agrega el precio base.
 *  - Producto SIN variantes: product.resolvedPrice alimenta cabecera y CTA.
 *  - Producto CON variantes: cada variante lleva su resolvedPrice.
 */

const mockDb = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  priceProfile: { findFirst: vi.fn().mockResolvedValue(null) },
  priceProfileProduct: { findMany: vi.fn().mockResolvedValue([]) },
  priceProfileVariant: { findMany: vi.fn().mockResolvedValue([]) },
  product: { findMany: vi.fn() },
}));

vi.mock('@/lib/db', () => ({ db: mockDb }));

import { attachResolvedPrices } from '@/lib/pricing';

const PRODUCTO_SIN_VARIANTE = {
  id: 'prod-sv',
  price: 12000,
  wholesalePrice: 10000,
  variants: [],
};

const PRODUCTO_CON_VARIANTES = {
  id: 'prod-cv',
  price: 12000,
  wholesalePrice: 10000,
  variants: [
    { id: 'var-1', price: 5000, wholesalePrice: 4000 },
    { id: 'var-2', price: null, wholesalePrice: null },
  ],
};

function txFor(customer: { isActive: boolean; role: string; priceProfile: any }) {
  return {
    product: {
      findMany: vi.fn().mockResolvedValue([
        PRODUCTO_SIN_VARIANTE,
        {
          id: PRODUCTO_CON_VARIANTES.id,
          price: PRODUCTO_CON_VARIANTES.price,
          wholesalePrice: PRODUCTO_CON_VARIANTES.wholesalePrice,
          variants: PRODUCTO_CON_VARIANTES.variants,
        },
      ]),
    },
    user: { findUnique: vi.fn().mockResolvedValue(customer) },
    priceProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    priceProfileProduct: { findMany: vi.fn().mockResolvedValue([]) },
    priceProfileVariant: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

/** Espejo del CTA (product-detail-cta.tsx) para producto sin variante. */
function ctaMirrorSinVariante(product: any) {
  const resolved = product.resolvedPrice;
  const unit =
    resolved && !resolved.requiresQuote && resolved.unitPrice != null ? resolved.unitPrice : null;
  return { price: unit ?? product.price, wholesalePrice: unit ?? product.wholesalePrice };
}

/** Espejo del CTA con variante seleccionada. */
function ctaMirrorConVariante(product: any, variantId: string) {
  const variant = product.variants.find((v: any) => v.id === variantId);
  const resolved = variant.resolvedPrice;
  const unit =
    resolved && !resolved.requiresQuote && resolved.unitPrice != null ? resolved.unitPrice : null;
  return { price: unit ?? variant.price ?? product.price };
}

describe('Detalle de producto: dos perfiles, con y sin variantes', () => {
  const PERFI_A = {
    isActive: true,
    role: 'CUSTOMER',
    priceProfile: { id: 'prof-a', code: 'DESC10', name: 'Descuento 10', percentAdjustment: -10, isActive: true },
  };
  const CLIENTE_B = { isActive: true, role: 'CUSTOMER', priceProfile: null };

  it('Producto SIN variantes: A ve 9000 (resuelto), B ve 10000 (base)', async () => {
    const [paraA] = await attachResolvedPrices([PRODUCTO_SIN_VARIANTE] as any, {
      customerId: 'cust-a',
      tx: txFor(PERFI_A),
    });
    const [paraB] = await attachResolvedPrices([PRODUCTO_SIN_VARIANTE] as any, {
      customerId: 'cust-b',
      tx: txFor(CLIENTE_B),
    });

    // Cabecera de la página (product.resolvedPrice)
    expect(paraA.resolvedPrice.unitPrice).toBe(9000);
    expect(paraA.resolvedPrice.requiresQuote).toBe(false);
    expect(paraB.resolvedPrice.unitPrice).toBe(10000);

    // CTA / AddToCart (espejo del precio resuelto)
    expect(ctaMirrorSinVariante(paraA)).toEqual({ price: 9000, wholesalePrice: 9000 });
    expect(ctaMirrorSinVariante(paraB)).toEqual({ price: 10000, wholesalePrice: 10000 });
  });

  it('Producto CON variantes: A ve 3600/9000 y B ve 4000/10000 por variante/producto', async () => {
    const [paraA] = await attachResolvedPrices([PRODUCTO_CON_VARIANTES] as any, {
      customerId: 'cust-a',
      tx: txFor(PERFI_A),
    });
    const [paraB] = await attachResolvedPrices([PRODUCTO_CON_VARIANTES] as any, {
      customerId: 'cust-b',
      tx: txFor(CLIENTE_B),
    });

    // Variante 1 (base 4000): A 3600, B 4000
    expect(paraA.variants[0].resolvedPrice.unitPrice).toBe(3600);
    expect(paraB.variants[0].resolvedPrice.unitPrice).toBe(4000);
    // Variante 2 sin precio propio => cascada al producto: A 9000, B 10000
    expect(paraA.variants[1].resolvedPrice.unitPrice).toBe(9000);
    expect(paraB.variants[1].resolvedPrice.unitPrice).toBe(10000);
    // Nivel producto (cabecera / CTA sin variante): A 9000, B 10000
    expect(paraA.resolvedPrice.unitPrice).toBe(9000);
    expect(paraB.resolvedPrice.unitPrice).toBe(10000);

    // CTA con variante seleccionada
    expect(ctaMirrorConVariante(paraA, 'var-1')).toEqual({ price: 3600 });
    expect(ctaMirrorConVariante(paraB, 'var-1')).toEqual({ price: 4000 });
  });

  it('ADMIN/AGENT o invitado => precio base en el detalle (nunca un perfil)', async () => {
    const staffTx = txFor({ isActive: true, role: 'ADMIN', priceProfile: PERFI_A.priceProfile });
    const [paraStaff] = await attachResolvedPrices([PRODUCTO_SIN_VARIANTE] as any, {
      customerId: 'admin-1',
      tx: staffTx,
    });
    expect(paraStaff.resolvedPrice.unitPrice).toBe(10000);
  });
});
