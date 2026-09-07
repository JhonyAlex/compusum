import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdminApi } from '@/lib/auth';
import { runSiesaPreflight, executeSiesaSync } from '@/lib/siesa-sync';

// ─── GET /api/admin/siesa ─────────────────────────────────────────────────────
// Retorna el historial reciente de sincronizaciones y estado actual del lock.
export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const [recentLogs, activeLock] = await Promise.all([
      db.productSyncLog.findMany({
        take: 5,
        orderBy: { startedAt: 'desc' },
      }),
      db.syncLock.findUnique({
        where: { id: 'siesa_sync' },
      }),
    ]);

    const isLocked = Boolean(activeLock && activeLock.expiresAt > new Date());

    return NextResponse.json({
      success: true,
      data: {
        recentLogs,
        isLocked,
        activeLock: isLocked ? activeLock : null,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al consultar logs de sincronización';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ─── POST /api/admin/siesa ────────────────────────────────────────────────────
// Recibe Productos.csv mediante multipart/form-data preservando bytes binarios CP1252.
// Acciones:
//   - ?action=preflight (por defecto)
//   - ?action=sync (&reconcileAbsent=true|false)
export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  let action = searchParams.get('action') || 'preflight';
  let reconcileAbsent = searchParams.get('reconcileAbsent') === 'true';
  let batchSize = Number(searchParams.get('batchSize') || 50);

  let rawBuffer: Buffer;
  let fileName = 'Productos.csv';

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se envió ningún archivo en el campo "file"' }, { status: 400 });
    }

    fileName = file.name || fileName;
    if (formData.has('action')) {
      action = String(formData.get('action'));
    }
    if (formData.has('reconcileAbsent')) {
      reconcileAbsent = formData.get('reconcileAbsent') === 'true';
    }
    if (formData.has('batchSize')) {
      batchSize = Number(formData.get('batchSize')) || batchSize;
    }

    const arrayBuffer = await file.arrayBuffer();
    rawBuffer = Buffer.from(arrayBuffer);
  } else if (contentType.includes('application/json')) {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'JSON malformado' }, { status: 400 });
    }

    if (body.action) action = body.action;
    if (body.reconcileAbsent !== undefined) reconcileAbsent = Boolean(body.reconcileAbsent);
    if (body.batchSize) batchSize = Number(body.batchSize);
    if (body.fileName) fileName = body.fileName;

    if (!body.rawCSV) {
      return NextResponse.json({ success: false, error: 'Falta rawCSV o archivo binario' }, { status: 400 });
    }

    rawBuffer = Buffer.from(body.rawCSV, 'utf-8');
  } else {
    // Binary stream directly
    const arrayBuffer = await request.arrayBuffer();
    rawBuffer = Buffer.from(arrayBuffer);
  }

  if (!rawBuffer || rawBuffer.length === 0) {
    return NextResponse.json({ success: false, error: 'El contenido del archivo está vacío' }, { status: 400 });
  }

  if (action === 'preflight') {
    try {
      const summary = await runSiesaPreflight(rawBuffer);
      return NextResponse.json({ success: true, data: summary });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error durante el preflight Siesa';
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
  }

  if (action === 'sync') {
    try {
      const result = await executeSiesaSync(rawBuffer, {
        fileName,
        reconcileAbsent,
        batchSize,
      });
      return NextResponse.json({ success: true, data: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error en sincronización Siesa';
      const status = msg.includes('progreso') ? 409 : 400;
      return NextResponse.json({ success: false, error: msg }, { status });
    }
  }

  return NextResponse.json(
    { success: false, error: `Acción desconocida "${action}". Use "preflight" o "sync".` },
    { status: 400 }
  );
}
