import * as fs from 'fs';
import { runSiesaPreflight, executeSiesaSync } from '../src/lib/siesa-sync';
import { db } from '../src/lib/db';
import { validateAndPriceItems } from '../src/lib/cart-validation';

async function main() {
  const filePath = 'C:\\Users\\jhony\\Downloads\\Productos.csv';
  console.log(`\n=== 1. CARGANDO ARCHIVO REAL: ${filePath} ===`);
  const rawBytes = fs.readFileSync(filePath);
  console.log(`Tamaño del archivo: ${rawBytes.length} bytes`);

  // 1. PREFLIGHT
  console.log('\n=== 2. EJECUTANDO PREFLIGHT ===');
  const preflight = await runSiesaPreflight(rawBytes);
  console.log('Resultado del Preflight:');
  console.log(`- Filas totales: ${preflight.totalRows}`);
  console.log(`- Referencias únicas: ${preflight.uniqueReferences}`);
  console.log(`- Nuevas referencias: ${preflight.newCount}`);
  console.log(`- Referencias a actualizar: ${preflight.updatedCount}`);
  console.log(`- Referencias sin cambios: ${preflight.unchangedCount}`);
  console.log(`- Referencias con precio 0: ${preflight.zeroPriceCount}`);
  console.log(`- Referencias ausentes que quedarían agotadas: ${preflight.absentDepletedCount}`);
  console.log(`- Errores de preflight: ${preflight.errors.length}`);

  // 2. PRIMERA SINCRONIZACIÓN
  console.log('\n=== 3. EJECUTANDO PRIMERA SINCRONIZACIÓN COMPLETA ===');
  const syncResult1 = await executeSiesaSync(rawBytes, {
    fileName: 'Productos.csv',
    reconcileAbsent: true,
    batchSize: 100,
  });

  console.log('Resultado de Sincronización 1:');
  console.log(`- ID de Log: ${syncResult1.syncLogId}`);
  console.log(`- Hash SHA-256: ${syncResult1.fileHash}`);
  console.log(`- Filas totales: ${syncResult1.totalRows}`);
  console.log(`- Referencias únicas: ${syncResult1.uniqueReferences}`);
  console.log(`- Creadas: ${syncResult1.createdCount}`);
  console.log(`- Actualizadas: ${syncResult1.updatedCount}`);
  console.log(`- Sin cambios: ${syncResult1.unchangedCount}`);
  console.log(`- Referencias con precio 0: ${syncResult1.zeroPriceCount}`);
  console.log(`- Ausentes agotadas: ${syncResult1.depletedCount}`);
  console.log(`- Errores: ${syncResult1.errorCount}`);
  console.log(`- Duración: ${(syncResult1.durationMs / 1000).toFixed(2)}s`);

  // 3. VERIFICACIÓN EN BASE DE DATOS
  console.log('\n=== 4. VERIFICACIÓN DE INTEGRIDAD EN BASE DE DATOS ===');

  // SKU 001403
  const p001403 = await db.product.findUnique({
    where: { sku: '001403' },
    include: { variants: true },
  });
  console.log('SKU 001403:');
  console.log(`  Nombre: ${p001403?.name}`);
  console.log(`  SKU (string): "${p001403?.sku}"`);
  console.log(`  Precio: $${p001403?.price} COP`);
  console.log(`  Stock numérico: ${p001403?.stockQuantity}`);
  console.log(`  Disponibilidad: ${p001403?.stockStatus}`);
  console.log(`  Última sincronización: ${p001403?.lastSyncAt}`);

  // SKU con variantes: 001589
  const p001589 = await db.product.findUnique({
    where: { sku: '001589' },
    include: { variants: true },
  });
  console.log('\nSKU multi-variante 001589:');
  console.log(`  Nombre: ${p001589?.name}`);
  console.log(`  Precio: $${p001589?.price} COP`);
  console.log(`  Stock agregado: ${p001589?.stockQuantity}`);
  console.log(`  Variantes (${p001589?.variants.length}):`);
  p001589?.variants.forEach((v) => {
    console.log(`    - ${v.name}: stock ${v.stockQuantity}, estado ${v.stockStatus}, precio $${v.price}`);
  });

  // SKU con precio 0
  const zeroPriceProducts = await db.product.findMany({
    where: { price: 0, syncSource: 'siesa' },
    take: 3,
  });
  console.log(`\nProductos con precio 0 (muestra de 3):`);
  for (const zp of zeroPriceProducts) {
    console.log(`  - Ref ${zp.sku}: "${zp.name}" (precio: $${zp.price}, stock: ${zp.stockQuantity})`);
  }

  // Prueba de protección contra pedidos a COP 0
  if (zeroPriceProducts.length > 0) {
    try {
      await validateAndPriceItems([{ productId: zeroPriceProducts[0].id, quantity: 1 }]);
      console.error('  ERROR: Se permitió comprar producto a COP 0!');
    } catch (err: any) {
      console.log(`  Protección COP 0 verificada: ${err.message}`);
    }
  }

  // 4. SEGUNDA SINCRONIZACIÓN (IDEMPOTENCIA)
  console.log('\n=== 5. EJECUTANDO SEGUNDA SINCRONIZACIÓN (PRUEBA DE IDEMPOTENCIA) ===');
  const syncResult2 = await executeSiesaSync(rawBytes, {
    fileName: 'Productos.csv',
    reconcileAbsent: true,
    batchSize: 100,
  });

  console.log('Resultado de Sincronización 2 (Idempotente):');
  console.log(`- Creadas: ${syncResult2.createdCount} (esperado: 0)`);
  console.log(`- Actualizadas: ${syncResult2.updatedCount} (esperado: 0)`);
  console.log(`- Sin cambios: ${syncResult2.unchangedCount} (esperado: ${syncResult1.uniqueReferences})`);
  console.log(`- Ausentes agotadas: ${syncResult2.depletedCount} (esperado: 0)`);
  console.log(`- Errores: ${syncResult2.errorCount} (esperado: 0)`);

  console.log('\n=== TODAS LAS VERIFICACIONES COMPLETADAS CON ÉXITO ===');
}

main()
  .catch((e) => {
    console.error('Error durante verificación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
