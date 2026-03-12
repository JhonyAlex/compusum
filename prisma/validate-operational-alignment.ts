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
  console.error(
    "La base de datos no coincide con prisma/schema.prisma despues de migrate deploy. Aborto antes del seed para evitar errores operativos como P2022.",
  );
  process.exit(1);
}

process.exit(exitCode);