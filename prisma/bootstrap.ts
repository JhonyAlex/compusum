type CommandFailure = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

const bunExecutable = process.execPath;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no esta definido. No es posible ejecutar migrate, validar alineacion ni correr seed.");
  process.exit(1);
}

const run = async (command: string[], errorMessage?: string) => {
  const child = Bun.spawn(command, {
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  if (stdout.trim()) {
    console.log(stdout.trim());
  }

  if (stderr.trim()) {
    console.error(stderr.trim());
  }

  if (exitCode !== 0) {
    const failure = new Error(errorMessage ?? `Command failed: ${command.join(" ")}`) as Error & {
      details?: CommandFailure;
    };

    failure.details = { exitCode, stdout, stderr };
    throw failure;
  }

  return { stdout, stderr };
};

await run([bunExecutable, "x", "prisma", "generate"], "Prisma generate failed.");

try {
  await run([bunExecutable, "x", "prisma", "migrate", "deploy"], "Prisma migrate deploy failed.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const output =
    error instanceof Error && "details" in error && error.details
      ? `${error.details.stdout}\n${error.details.stderr}`
      : "";

  if (!message.includes("Prisma migrate deploy failed.") || !output.includes("P3005")) {
    throw error;
  }

  console.log("Baselining existing database with 0_init...");

  try {
    await run([bunExecutable, "x", "prisma", "migrate", "resolve", "--applied", "0_init"]);
  } catch {
    console.log("Skipping baseline resolve because 0_init was already recorded or could not be applied.");
  }

  await run([bunExecutable, "x", "prisma", "migrate", "deploy"], "Prisma migrate deploy failed after baseline.");
}

await run([bunExecutable, "prisma/validate-operational-alignment.ts"], "Operational schema validation failed.");
await run([bunExecutable, "run", "seed"], "Seed failed.");