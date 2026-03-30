import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = process.cwd();

const ALLOWED_FILES = new Set([
  "src/app/globals.css",
]);

const FILE_PATTERN = /\.(ts|tsx|css)$/i;
const FORBIDDEN_PATTERNS = [
  {
    id: "hex-color",
    regex: /#[0-9a-fA-F]{3,8}\b/g,
    message: "No uses colores hex directos. Usa tokens CSS (var(--...)) o clases semanticas.",
  },
  {
    id: "rgba-rgb",
    regex: /\brgba?\s*\(/g,
    message: "No uses rgb/rgba directos. Centraliza el color en tokens globales.",
  },
  {
    id: "inline-font-token",
    regex: /style\s*=\s*\{\{[^}]*fontFamily\s*:\s*["']var\(--font-fredoka\)["']/g,
    message: "Evita style inline para tipografia. Usa la clase global .font-heading.",
  },
];

function getChangedFiles() {
  try {
    const output = execSync("git diff --name-only --diff-filter=ACMRTUXB HEAD", {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (!output) {
      return [];
    }

    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((file) => FILE_PATTERN.test(file))
      .filter((file) => !ALLOWED_FILES.has(file));
  } catch {
    return [];
  }
}

function getAddedLines(file) {
  try {
    const output = execSync(`git diff --unified=0 -- ${file}`, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return output
      .split(/\r?\n/)
      .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
      .map((line) => line.slice(1));
  } catch {
    return [];
  }
}

function inspectLine(line) {
  const matches = [];

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.regex.test(line)) {
      matches.push(pattern);
    }
    pattern.regex.lastIndex = 0;
  }

  return matches;
}

function run() {
  const changedFiles = getChangedFiles();

  if (!changedFiles.length) {
    console.log("[styles:guard] Sin archivos de estilos/codigo modificados para validar.");
    process.exit(0);
  }

  const violations = [];

  for (const file of changedFiles) {
    const absolutePath = resolve(repoRoot, file);

    if (!existsSync(absolutePath)) {
      continue;
    }

    const addedLines = getAddedLines(file);
    const candidateLines = addedLines.length ? addedLines : readFileSync(absolutePath, "utf8").split(/\r?\n/);

    for (const [index, line] of candidateLines.entries()) {
      const lineViolations = inspectLine(line);
      if (!lineViolations.length) {
        continue;
      }

      for (const violation of lineViolations) {
        violations.push({
          file,
          line: index + 1,
          message: violation.message,
          sample: line.trim().slice(0, 160),
        });
      }
    }
  }

  if (!violations.length) {
    console.log("[styles:guard] OK. No se detectaron literales de estilos prohibidos en cambios nuevos.");
    process.exit(0);
  }

  console.error("[styles:guard] Se detectaron estilos hardcodeados en cambios nuevos:");
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} -> ${violation.message}`);
    console.error(`  ${violation.sample}`);
  }

  console.error("\nUsa tokens de src/app/globals.css y clases semanticas para mantener consistencia.");
  process.exit(1);
}

run();
