import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

/**
 * TEST DE INTEGRACIÓN PostgreSQL REAL — migración de canonicalización de
 * teléfonos (20260907130000_canonical_phone_and_default_profile).
 *
 * Reproduce EXACTAMENTE la secuencia operativa:
 *   1. aplicar TODAS las migraciones hasta ANTES de 20260907130000;
 *   2. insertar usuarios legacy con datos reales (móvil local, fijo, ya
 *      canónico, pareja en colisión, teléfono extranjero);
 *   3. aplicar la migración 20260907130000 (mismo SQL que ejecuta
 *      `prisma migrate deploy`);
 *   4. verificar transformaciones, no-fusión de colisiones, intactos y
 *      idempotencia (segunda ejecución = no-op).
 *
 * Corre sobre una BASE DE DATOS RASCANTE propia (no toca la BD de tests).
 * Si no hay PostgreSQL se omite explícitamente.
 */

const HAS_POSTGRES = Boolean(process.env.DATABASE_URL?.startsWith('postgres'));

const MIGRATION_UNDER_TEST = '20260907130000_canonical_phone_and_default_profile';
const SCRATCH_DB = 'compusum_migtest_phone_canonical';

const repoRoot = path.resolve(__dirname, '..', '..');
const migrationsDir = path.join(repoRoot, 'prisma', 'migrations');

function serverUrl(): string {
  return process.env.DATABASE_URL!;
}
function scratchUrl(): string {
  const u = new URL(serverUrl());
  u.pathname = `/${SCRATCH_DB}`;
  return u.toString();
}

/** Ejecuta un script SQL contra `url` con el mismo motor que usa migrate deploy. */
function dbExecute(label: string, sqlFile: string, url: string): void {
  const res = spawnSync(
    'bun',
    ['x', 'prisma', 'db', 'execute', '--file', sqlFile, '--url', url],
    // shell:true: en Windows `bun` instalado por npm es un shim .cmd que Node
    // no puede spawnear directo. Los argumentos no contienen espacios.
    { encoding: 'utf8', cwd: repoRoot, env: process.env, shell: process.platform === 'win32' }
  );
  // NOTA: los RAISE WARNING del script (p.ej. colisiones saltadas) salen por
  // stderr con exit code 0: NO son fallos.
  if (res.status !== 0) {
    throw new Error(
      `prisma db execute falló (${label}):\nstdout: ${res.stdout}\nstderr: ${res.stderr}`
    );
  }
}

function withSqlFile<T>(label: string, sql: string, fn: (file: string) => T): T {
  const dir = path.join(os.tmpdir(), 'compusum-migtest');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${label.replace(/[^a-z0-9-]/gi, '_')}.sql`);
  writeFileSync(file, sql, 'utf8');
  try {
    return fn(file);
  } finally {
    rmSync(file, { force: true });
  }
}

describe.skipIf(!HAS_POSTGRES)('MIGRACIÓN REAL: canonicalización de teléfonos (M1 -> legacy -> M2)', () => {
  let scratch: PrismaClient;

  const LEGACY_USERS = [
    { id: 'migtest-movil', phone: '3001234567', email: null, name: 'Movil local 10 digitos' },
    { id: 'migtest-fijo', phone: '6012345678', email: null, name: 'Fijo local 10 digitos' },
    // "Ya canónico" con número DISTINTO al móvil: la migración no debe tocarlo
    { id: 'migtest-canonicol', phone: '573008887777', email: null, name: 'Ya canonico' },
    { id: 'migtest-col-local', phone: '3009876543', email: 'col-local@test.com', name: 'Colision lado local' },
    { id: 'migtest-col-canon', phone: '573009876543', email: 'col-canon@test.com', name: 'Colision lado canonico' },
    { id: 'migtest-foreign', phone: '+15551234567', email: null, name: 'Extranjero historico' },
  ];

  beforeAll(() => {
    if (!HAS_POSTGRES) return;

    // 0) BD rascante limpia
    withSqlFile('drop-scratch', `DROP DATABASE IF EXISTS "${SCRATCH_DB}" WITH (FORCE);`, (f) =>
      dbExecute('drop scratch', f, serverUrl())
    );
    withSqlFile('create-scratch', `CREATE DATABASE "${SCRATCH_DB}";`, (f) =>
      dbExecute('create scratch', f, serverUrl())
    );

    // 1) TODAS las migraciones hasta ANTES de la migración bajo prueba
    const before = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((n) => existsSync(path.join(migrationsDir, n, 'migration.sql')))
      .filter((n) => n !== MIGRATION_UNDER_TEST)
      .sort();

    expect(before).toContain('0_init');
    expect(before).toContain('20260907120000_customer_master_price_profiles');
    expect(before).not.toContain(MIGRATION_UNDER_TEST);

    const concatenated = before
      .map((n) => `-- ==== migración ${n} ====\n${readFileSync(path.join(migrationsDir, n, 'migration.sql'), 'utf8')}`)
      .join('\n\n');
    withSqlFile('pre-m2', concatenated, (f) => dbExecute(`pre-M2 (${before.length} migraciones)`, f, scratchUrl()));

    // 2) Usuarios legacy con las formas que existían antes de canonicalizar
    const inserts = LEGACY_USERS.map(
      (u) =>
        `INSERT INTO "User" ("id", "name", "email", "phone", "password", "role", "isActive", "createdAt", "updatedAt")\n` +
        `VALUES ('${u.id}', '${u.name}', ${u.email ? `'${u.email}'` : 'NULL'}, '${u.phone}', 'legacy-no-login', 'CUSTOMER', true, now(), now());`
    ).join('\n');
    withSqlFile('seed-legacy', inserts, (f) => dbExecute('seed legacy', f, scratchUrl()));

    scratch = new PrismaClient({ datasources: { db: { url: scratchUrl() } } });
  }, 600000);

  afterAll(async () => {
    if (!HAS_POSTGRES) return;
    await scratch?.$disconnect();
    withSqlFile('drop-scratch-final', `DROP DATABASE IF EXISTS "${SCRATCH_DB}" WITH (FORCE);`, (f) =>
      dbExecute('drop scratch final', f, serverUrl())
    );
  }, 120000);

  async function expectedPhones(): Promise<Record<string, string | null>> {
    const rows = (await scratch.$queryRawUnsafe(
      `SELECT "id", "phone" FROM "User" WHERE "id" LIKE 'migtest-%'`
    )) as Array<{ id: string; phone: string | null }>;
    return Object.fromEntries(rows.map((r) => [r.id, r.phone]));
  }

  function applyMigrationUnderTest(): void {
    const file = path.join(migrationsDir, MIGRATION_UNDER_TEST, 'migration.sql');
    // Se pasa por archivo temporal: la ruta del repo puede contener espacios y
    // el spawn con shell en Windows no cita argumentos.
    withSqlFile('m2-under-test', readFileSync(file, 'utf8'), (f) =>
      dbExecute(MIGRATION_UNDER_TEST, f, scratchUrl())
    );
  }

  it('ESTADO PREVIO: los legacy están sin canonicalizar (móvil/fijo locales)', async () => {
    const before = await expectedPhones();
    expect(before['migtest-movil']).toBe('3001234567');
    expect(before['migtest-fijo']).toBe('6012345678');
    expect(before['migtest-canonicol']).toBe('573008887777');
    expect(before['migtest-foreign']).toBe('+15551234567');
  }, 30000);

  it('M2: móvil local SIN colisión -> canónico; fijo -> canónico; canónico intacto', async () => {
    applyMigrationUnderTest();

    const after = await expectedPhones();
    // Móvil local de 10 dígitos (el caso que la regex anterior NO cubría)
    expect(after['migtest-movil']).toBe('573001234567');
    // Fijo local de 10 dígitos
    expect(after['migtest-fijo']).toBe('576012345678');
    // Ya canónico: intacto (no se duplica el prefijo)
    expect(after['migtest-canonicol']).toBe('573008887777');
  }, 120000);

  it('M2: colisión local+canónico -> NO fusionada y NO destruida (ambas cuentas operan)', async () => {
    const after = await expectedPhones();
    // La pareja colisionante conserva su teléfono original: la migración la
    // OMITE (nunca fusiona); la app resuelve ambas formas por variantes.
    expect(after['migtest-col-local']).toBe('3009876543');
    expect(after['migtest-col-canon']).toBe('573009876543');

    // Siguen existiendo las DOS cuentas (no hubo merge ni borrado)
    const rows = (await scratch.$queryRawUnsafe(
      `SELECT count(*)::int AS n FROM "User" WHERE "id" IN ('migtest-col-local','migtest-col-canon')`
    )) as Array<{ n: number }>;
    expect(rows[0].n).toBe(2);
  }, 30000);

  it('M2: teléfono extranjero/histórico queda INTACTO', async () => {
    const after = await expectedPhones();
    expect(after['migtest-foreign']).toBe('+15551234567');
  }, 30000);

  it('M2: total de usuarios inalterado (ninguna fila fusionada/borrada) + índice único creado', async () => {
    const rows = (await scratch.$queryRawUnsafe(
      `SELECT count(*)::int AS n FROM "User" WHERE "id" LIKE 'migtest-%'`
    )) as Array<{ n: number }>;
    expect(rows[0].n).toBe(LEGACY_USERS.length);

    const idx = (await scratch.$queryRawUnsafe(
      `SELECT indexname FROM pg_indexes WHERE indexname = 'PriceProfile_isDefault_one_row'`
    )) as Array<{ indexname: string }>;
    expect(idx).toHaveLength(1);
  }, 30000);

  it('SEGUNDA EJECUCIÓN de M2: idempotente, estado idéntico', async () => {
    const snapshot = await expectedPhones();

    applyMigrationUnderTest(); // re-ejecutar el MISMO SQL (no-op seguro)

    const after = await expectedPhones();
    expect(after).toEqual(snapshot);

    // Y la pareja colisionante SIGUE sin fusionarse tras re-ejecutar
    expect(after['migtest-col-local']).toBe('3009876543');
    expect(after['migtest-col-canon']).toBe('573009876543');
  }, 120000);
});
