#!/usr/bin/env node
/**
 * Theme Token Lock — guards protected theme files from silent overwrites.
 *
 * Compares SHA-256 of each protected file against scripts/theme-lock.json.
 * On mismatch, exits non-zero and blocks dev/build until either:
 *   1) the change is reverted, OR
 *   2) the user explicitly approves and runs: `node scripts/verify-theme-lock.mjs --update`
 *
 * Bypass for a single run (not recommended): THEME_LOCK_BYPASS=1
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = resolve(root, "scripts/theme-lock.json");
const update = process.argv.includes("--update");

if (process.env.THEME_LOCK_BYPASS === "1") {
  console.warn("[theme-lock] BYPASSED via THEME_LOCK_BYPASS=1");
  process.exit(0);
}

if (!existsSync(lockPath)) {
  console.error("[theme-lock] Missing scripts/theme-lock.json");
  process.exit(1);
}

const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const current = {};
let drift = false;

for (const rel of Object.keys(lock)) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) {
    console.error(`[theme-lock] Missing protected file: ${rel}`);
    process.exit(1);
  }
  const h = createHash("sha256").update(readFileSync(abs)).digest("hex");
  current[rel] = h;
  if (h !== lock[rel]) {
    drift = true;
    console.error(`[theme-lock] DRIFT: ${rel}\n  expected ${lock[rel]}\n  actual   ${h}`);
  }
}

if (update) {
  writeFileSync(lockPath, JSON.stringify(current, null, 2) + "\n");
  console.log("[theme-lock] Lock file updated.");
  process.exit(0);
}

if (drift) {
  console.error(
    "\n[theme-lock] Protected theme tokens changed.\n" +
      "  - Revert the change, OR\n" +
      "  - If intentional, re-run with: node scripts/verify-theme-lock.mjs --update\n"
  );
  process.exit(1);
}

console.log("[theme-lock] OK — protected theme files intact.");