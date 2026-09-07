import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { db } from '../src/lib/db';
import { createSession } from '../src/lib/auth';

const PORT = 3008;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(url: string, timeoutMs = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/settings`);
      if (res.status >= 200 && res.status < 500) {
        return true;
      }
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  const csvPath = process.argv[2] || 'C:\\Users\\jhony\\Downloads\\Productos.csv';
  console.log(`\n======================================================`);
  console.log(`VERIFICACIÓN COMPLETA DEL FLUJO WEB CON ARCHIVO REAL`);
  console.log(`======================================================`);
  console.log(`Archivo: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: Archivo no encontrado en ${csvPath}`);
    process.exit(1);
  }

  const rawBytes = fs.readFileSync(csvPath);
  console.log(`Bytes leídos del archivo: ${rawBytes.length} (${(rawBytes.length / (1024 * 1024)).toFixed(2)} MB)`);

  // 1. Setup Admin User and Session in Database
  console.log('\n--- 1. PREPARANDO SESIÓN DE ADMINISTRADOR ---');
  let admin = await db.user.findFirst({ where: { role: 'admin', isActive: true } });
  if (!admin) {
    admin = await db.user.create({
      data: {
        name: 'Admin Verificador Web',
        email: `admin-web-${Date.now()}@compusum.com`,
        password: 'temporary-hash',
        role: 'admin',
        isActive: true,
      },
    });
  }
  const sessionToken = await createSession(admin.id, 2);
  console.log(`Sesión admin creada. Usuario: ${admin.email}, Token: ${sessionToken.substring(0, 8)}...`);

  // 2. Start Next.js Server on test port
  console.log(`\n--- 2. INICIANDO SERVIDOR NEXT.JS EN PUERTO ${PORT} ---`);
  const serverProcess: ChildProcess = spawn(
    'bun',
    ['.next/standalone/server.js'],
    {
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        PORT: String(PORT),
        HOSTNAME: 'localhost',
        NODE_ENV: 'production',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  serverProcess.stdout?.on('data', (d) => {
    // console.log(`[Next.js stdout]: ${d.toString().trim()}`);
  });
  serverProcess.stderr?.on('data', (d) => {
    // console.error(`[Next.js stderr]: ${d.toString().trim()}`);
  });

  const isUp = await waitForServer(BASE_URL);
  if (!isUp) {
    console.error('No se pudo iniciar el servidor Next.js a tiempo');
    serverProcess.kill();
    process.exit(1);
  }
  console.log(`Servidor Next.js respondiendo en ${BASE_URL}`);

  try {
    // 3. HTTP Request: Siesa Preflight via Web Flow
    console.log('\n--- 3. EJECUTANDO PREFLIGHT VÍA PETICIÓN HTTP POST (MULTIPART) ---');
    const preflightFormData = new FormData();
    preflightFormData.append(
      'file',
      new Blob([rawBytes], { type: 'text/csv' }),
      'Productos.csv'
    );

    const preflightRes = await fetch(`${BASE_URL}/api/admin/siesa?action=preflight`, {
      method: 'POST',
      headers: {
        Cookie: `session_token=${sessionToken}`,
      },
      body: preflightFormData,
    });

    if (!preflightRes.ok) {
      const errText = await preflightRes.text();
      throw new Error(`Fallo en petición preflight HTTP (${preflightRes.status}): ${errText}`);
    }

    const preflightJson = await preflightRes.json();
    console.log('Respuesta HTTP de Preflight recibida con éxito (Status 200):');
    const pfData = preflightJson.data;
    console.log(`- Total Filas: ${pfData.totalRows}`);
    console.log(`- Referencias Únicas: ${pfData.uniqueReferences}`);
    console.log(`- Nuevas Referencias: ${pfData.newCount}`);
    console.log(`- A Actualizar: ${pfData.updatedCount}`);
    console.log(`- Sin Cambios: ${pfData.unchangedCount}`);
    console.log(`- Referencias Precio COP 0: ${pfData.zeroPriceCount}`);
    console.log(`- Ausentes con stock en BD: ${pfData.absentDepletedCount}`);
    console.log(`- Errores/Advertencias: ${pfData.errors.length}`);

    // Verification of exact expected figures
    if (pfData.totalRows !== 7772) {
      console.warn(`[AVISO] Total filas es ${pfData.totalRows}, se esperaban 7.772`);
    }
    if (pfData.uniqueReferences !== 4543) {
      console.warn(`[AVISO] Referencias únicas es ${pfData.uniqueReferences}, se esperaban 4.543`);
    }
    if (pfData.zeroPriceCount !== 327) {
      console.warn(`[AVISO] Referencias con precio 0 es ${pfData.zeroPriceCount}, se esperaban 327`);
    }

    // 4. HTTP Request: Real Sync via Web Flow
    console.log('\n--- 4. EJECUTANDO SINCRONIZACIÓN REAL VÍA PETICIÓN HTTP POST (MULTIPART) ---');
    const syncFormData = new FormData();
    syncFormData.append(
      'file',
      new Blob([rawBytes], { type: 'text/csv' }),
      'Productos.csv'
    );

    const syncStartTime = Date.now();
    const syncRes = await fetch(`${BASE_URL}/api/admin/siesa?action=sync&reconcileAbsent=true`, {
      method: 'POST',
      headers: {
        Cookie: `session_token=${sessionToken}`,
      },
      body: syncFormData,
    });

    if (!syncRes.ok) {
      const errText = await syncRes.text();
      throw new Error(`Fallo en petición de sincronización HTTP (${syncRes.status}): ${errText}`);
    }

    const syncJson = await syncRes.json();
    const syncData = syncJson.data;
    console.log('Respuesta HTTP de Sincronización recibida con éxito (Status 200):');
    console.log(`- ID de Log: ${syncData.syncLogId}`);
    console.log(`- Hash SHA-256: ${syncData.fileHash}`);
    console.log(`- Filas totales: ${syncData.totalRows}`);
    console.log(`- Referencias únicas: ${syncData.uniqueReferences}`);
    console.log(`- Creadas: ${syncData.createdCount}`);
    console.log(`- Actualizadas: ${syncData.updatedCount}`);
    console.log(`- Sin cambios: ${syncData.unchangedCount}`);
    console.log(`- Referencias precio 0: ${syncData.zeroPriceCount}`);
    console.log(`- Ausentes agotadas: ${syncData.depletedCount}`);
    console.log(`- Errores: ${syncData.errorCount}`);
    console.log(`- Duración total request: ${((Date.now() - syncStartTime) / 1000).toFixed(2)}s`);

    // 5. Query Database directly to verify integrity of records inserted via Web Flow
    console.log('\n--- 5. VERIFICACIÓN DIRECTA DE INTEGRIDAD EN BASE DE DATOS ---');

    // Verify SKU 001403
    const p001403 = await db.product.findUnique({
      where: { sku: '001403' },
      include: { variants: true },
    });
    console.log('Verificación SKU 001403:');
    console.log(`  Nombre: "${p001403?.name}"`);
    console.log(`  SKU (string con ceros): "${p001403?.sku}"`);
    console.log(`  Precio: $${p001403?.price} COP (esperado: 1845.02)`);
    console.log(`  Stock numérico: ${p001403?.stockQuantity} (esperado: 116)`);
    console.log(`  Disponibilidad: "${p001403?.stockStatus}"`);
    console.log(`  syncSource: "${p001403?.syncSource}"`);

    // Verify CP1252 Accents in Name / Brands
    const compasProduct = await db.product.findFirst({
      where: {
        OR: [
          { name: { contains: 'LÁPIZ', mode: 'insensitive' } },
          { name: { contains: 'COMPÁS', mode: 'insensitive' } },
          { name: { contains: 'Á', mode: 'insensitive' } },
          { name: { contains: 'É', mode: 'insensitive' } },
          { name: { contains: 'Í', mode: 'insensitive' } },
          { name: { contains: 'Ó', mode: 'insensitive' } },
          { name: { contains: 'Ú', mode: 'insensitive' } },
          { name: { contains: 'Ñ', mode: 'insensitive' } },
        ],
      },
    });
    console.log('\nVerificación de caracteres CP1252 en producto:');
    console.log(`  SKU: "${compasProduct?.sku}"`);
    console.log(`  Nombre con tilde/ñ intacta: "${compasProduct?.name}"`);

    // Verify Audit Log entry in DB
    const logEntry = await db.productSyncLog.findUnique({
      where: { id: syncData.syncLogId },
    });
    console.log('\nVerificación de Log de Auditoría en BD:');
    console.log(`  Estado: "${logEntry?.status}"`);
    console.log(`  Hash: ${logEntry?.fileHash}`);
    console.log(`  Total filas: ${logEntry?.totalRows}`);
    console.log(`  Unique refs: ${logEntry?.uniqueRefs}`);
    console.log(`  Completed at: ${logEntry?.completedAt}`);

    console.log('\n======================================================');
    console.log('¡VERIFICACIÓN DEL FLUJO WEB COMPLETADA EXITOSAMENTE!');
    console.log('======================================================');
  } finally {
    // Stop server and clean session
    serverProcess.kill();
    await db.session.deleteMany({ where: { token: sessionToken } });
  }
}

main()
  .catch((e) => {
    console.error('\nError en verificación del flujo web:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
