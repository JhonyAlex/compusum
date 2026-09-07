import * as fs from 'fs';
import * as path from 'path';
import { runSiesaPreflight, executeSiesaSync } from '../src/lib/siesa-sync';
import { db } from '../src/lib/db';
import { validateAndPriceItems } from '../src/lib/cart-validation';

function printUsage() {
  console.log(`
Uso: bun scripts/verify-real-siesa-sync.ts <ruta-al-csv> [opciones]

Opciones:
  --apply             Aplica los cambios en la base de datos. Por defecto es DRY-RUN (solo preflight).
  --reconcile-absent  Reconcilia referencias ausentes marcándolas con stock 0 y agotado.
                      Requiere --apply y un archivo 100% válido sin errores de parser.
  --test-idempotency  Ejecuta una segunda sincronización consecutiva para verificar idempotencia.
  --help, -h          Muestra este mensaje de ayuda.

Ejemplo:
  bun scripts/verify-real-siesa-sync.ts ./Productos.csv
  bun scripts/verify-real-siesa-sync.ts ./Productos.csv --apply
  bun scripts/verify-real-siesa-sync.ts ./Productos.csv --apply --reconcile-absent
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const nonFlags = args.filter((a) => !a.startsWith('--'));

  if (nonFlags.length === 0) {
    console.error('Error: Debe especificar la ruta al archivo CSV.');
    printUsage();
    process.exit(1);
  }

  const filePath = path.resolve(nonFlags[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: El archivo "${filePath}" no existe.`);
    process.exit(1);
  }

  const shouldApply = flags.has('--apply');
  const reconcileAbsent = flags.has('--reconcile-absent');
  const testIdempotency = flags.has('--test-idempotency');

  console.log(`\n======================================================`);
  console.log(`HERRAMIENTA DE SINCRONIZACIÓN SIESA (COMPUSUM ERP)`);
  console.log(`======================================================`);
  console.log(`Archivo: ${filePath}`);
  const rawBytes = fs.readFileSync(filePath);
  console.log(`Tamaño: ${rawBytes.length} bytes (${(rawBytes.length / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Modo: ${shouldApply ? 'APLICAR CAMBIOS EN BD (--apply)' : 'DRY-RUN / SOLO PREFLIGHT (seguro, sin mutaciones)'}`);
  console.log(`Reconciliación de ausentes: ${reconcileAbsent ? 'ACTIVADA (--reconcile-absent)' : 'DESACTIVADA (por defecto)'}`);

  // 1. PREFLIGHT
  console.log('\n--- 1. EJECUTANDO PREFLIGHT (Análisis no mutante) ---');
  const preflight = await runSiesaPreflight(rawBytes);
  console.log(`- Filas totales en CSV: ${preflight.totalRows.toLocaleString()}`);
  console.log(`- Referencias únicas: ${preflight.uniqueReferences.toLocaleString()}`);
  console.log(`- Nuevas referencias a crear: ${preflight.newCount.toLocaleString()}`);
  console.log(`- Referencias a actualizar: ${preflight.updatedCount.toLocaleString()}`);
  console.log(`- Referencias sin cambios: ${preflight.unchangedCount.toLocaleString()}`);
  console.log(`- Referencias con precio COP 0: ${preflight.zeroPriceCount.toLocaleString()}`);
  console.log(`- Referencias ausentes con stock > 0 en BD: ${preflight.absentDepletedCount.toLocaleString()}`);
  console.log(`- Errores/Advertencias de parser: ${preflight.errors.length}`);

  if (preflight.errors.length > 0) {
    console.log('Muestra de errores detectados:');
    preflight.errors.slice(0, 5).forEach((e) => console.log(`  * ${e}`));
    if (reconcileAbsent) {
      console.warn('\n[ADVERTENCIA] Hay errores estructurales. La reconciliación de ausentes quedará bloqueada por seguridad.');
    }
  }

  if (!shouldApply) {
    console.log('\n[DRY-RUN FINALIZADO] No se modificó la base de datos.');
    console.log('Para ejecutar la sincronización y persistir cambios, ejecute con --apply.');
    return;
  }

  // 2. SINCRONIZACIÓN
  console.log('\n--- 2. EJECUTANDO SINCRONIZACIÓN REAL (executeSiesaSync) ---');
  const fileName = path.basename(filePath);
  const syncResult1 = await executeSiesaSync(rawBytes, {
    fileName,
    reconcileAbsent,
    batchSize: 100,
  });

  console.log('Resultado de Sincronización:');
  console.log(`- ID de Log en BD: ${syncResult1.syncLogId}`);
  console.log(`- Hash SHA-256: ${syncResult1.fileHash}`);
  console.log(`- Filas totales: ${syncResult1.totalRows.toLocaleString()}`);
  console.log(`- Referencias únicas: ${syncResult1.uniqueReferences.toLocaleString()}`);
  console.log(`- Creadas: ${syncResult1.createdCount.toLocaleString()}`);
  console.log(`- Actualizadas: ${syncResult1.updatedCount.toLocaleString()}`);
  console.log(`- Sin cambios: ${syncResult1.unchangedCount.toLocaleString()}`);
  console.log(`- Referencias con precio 0: ${syncResult1.zeroPriceCount.toLocaleString()}`);
  console.log(`- Ausentes agotadas: ${syncResult1.depletedCount.toLocaleString()}`);
  console.log(`- Errores de ejecución: ${syncResult1.errorCount}`);
  console.log(`- Duración: ${(syncResult1.durationMs / 1000).toFixed(2)}s`);

  // 3. VERIFICACIÓN DE INTEGRIDAD EN BD
  console.log('\n--- 3. VERIFICACIÓN DE INTEGRIDAD EN BASE DE DATOS ---');

  // SKU 001403
  const p001403 = await db.product.findUnique({
    where: { sku: '001403' },
    include: { variants: true },
  });
  console.log('SKU 001403:');
  console.log(`  Nombre: ${p001403?.name}`);
  console.log(`  SKU (string con ceros a la izquierda): "${p001403?.sku}"`);
  console.log(`  Precio: $${p001403?.price} COP`);
  console.log(`  Stock numérico: ${p001403?.stockQuantity}`);
  console.log(`  Disponibilidad: ${p001403?.stockStatus}`);
  console.log(`  Fuente de sincronización: ${p001403?.syncSource}`);

  // SKU multi-variante 001589
  const p001589 = await db.product.findUnique({
    where: { sku: '001589' },
    include: { variants: true },
  });
  if (p001589) {
    console.log('\nSKU multi-variante 001589:');
    console.log(`  Nombre: ${p001589.name}`);
    console.log(`  Precio: $${p001589.price} COP`);
    console.log(`  Stock agregado: ${p001589.stockQuantity}`);
    console.log(`  Variantes (${p001589.variants.length}):`);
    p001589.variants.forEach((v) => {
      console.log(`    - ${v.name}: stock ${v.stockQuantity}, estado ${v.stockStatus}, precio $${v.price}`);
    });
  }

  // Prueba de protección contra pedidos a COP 0
  const zeroPriceProducts = await db.product.findMany({
    where: { price: 0, syncSource: 'siesa' },
    take: 1,
  });
  if (zeroPriceProducts.length > 0) {
    try {
      await validateAndPriceItems([{ productId: zeroPriceProducts[0].id, quantity: 1 }]);
      console.error('  ERROR: Se permitió comprar producto a COP 0!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`\nProtección COP 0 verificada: ${msg}`);
    }
  }

  // 4. IDEMPOTENCIA (Opcional si se solicita)
  if (testIdempotency) {
    console.log('\n--- 4. PRUEBA DE IDEMPOTENCIA (Segunda sincronización consecutiva) ---');
    const syncResult2 = await executeSiesaSync(rawBytes, {
      fileName,
      reconcileAbsent,
      batchSize: 100,
    });
    console.log(`- Creadas: ${syncResult2.createdCount} (esperado: 0)`);
    console.log(`- Actualizadas: ${syncResult2.updatedCount} (esperado: 0)`);
    console.log(`- Sin cambios: ${syncResult2.unchangedCount} (esperado: ${syncResult1.uniqueReferences})`);
    console.log(`- Ausentes agotadas: ${syncResult2.depletedCount} (esperado: 0)`);
  }

  console.log('\n======================================================');
  console.log('VERIFICACIÓN FINALIZADA CON ÉXITO');
  console.log('======================================================');
}

main()
  .catch((e) => {
    console.error('Error durante ejecución:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
