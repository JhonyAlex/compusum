import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const staticSrc = resolve(root, ".next/static");
const staticDest = resolve(root, ".next/standalone/.next/static");
const publicSrc = resolve(root, "public");
const publicDest = resolve(root, ".next/standalone/public");

const ensureDir = (path) => {
  mkdirSync(dirname(path), { recursive: true });
};

if (existsSync(staticSrc)) {
  ensureDir(staticDest);
  cpSync(staticSrc, staticDest, { recursive: true, force: true });
}

if (existsSync(publicSrc)) {
  ensureDir(publicDest);
  cpSync(publicSrc, publicDest, { recursive: true, force: true });
}
