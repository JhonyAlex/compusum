const databaseUrl = process.env.DATABASE_URL;
const bunExecutable = process.execPath;

if (!databaseUrl) {
  console.error("DATABASE_URL no esta definido.");
  process.exit(1);
}

const processResult = Bun.spawn(
  [
    bunExecutable,
    "x",
    "prisma",
    "migrate",
    "diff",
    "--from-url",
    databaseUrl,
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--script",
    "--exit-code",
  ],
  {
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  },
);

const [stdout, stderr, exitCode] = await Promise.all([
  new Response(processResult.stdout).text(),
  new Response(processResult.stderr).text(),
  processResult.exited,
]);

if (stdout.trim()) {
  console.log(stdout.trim());
}

if (stderr.trim()) {
  console.error(stderr.trim());
}

if (exitCode === 0) {
  console.log("Operational schema validation passed.");
  process.exit(0);
}

if (exitCode === 2) {
  // Prisma schema cannot represent some DB-native details (e.g. partial unique indexes).
  // We only block on structural drift that can trigger runtime failures like P2022.
  const normalized = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("--"))
    .join("\n");

  const hasStructuralDrift =
    /\bCREATE\s+TABLE\b/i.test(normalized) ||
    /\bDROP\s+TABLE\b/i.test(normalized) ||
    /\bALTER\s+TABLE\b[\s\S]*\bADD\s+COLUMN\b/i.test(normalized) ||
    /\bALTER\s+TABLE\b[\s\S]*\bDROP\s+COLUMN\b/i.test(normalized) ||
    /\bALTER\s+TABLE\b[\s\S]*\bALTER\s+COLUMN\b/i.test(normalized);

  if (hasStructuralDrift) {
    console.error(
      "La base de datos no coincide con prisma/schema.prisma despues de migrate deploy (drift estructural). Aborto antes del seed para evitar errores operativos como P2022.",
    );
    process.exit(1);
  }

  console.warn(
    "Se detectaron diferencias no estructurales (por ejemplo, indices/constraints) que Prisma no modela completamente. Se permite continuar.",
  );
  process.exit(0);
}

process.exit(exitCode);