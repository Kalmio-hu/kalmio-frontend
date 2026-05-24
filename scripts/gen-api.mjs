#!/usr/bin/env node
/**
 * Generate or verify the typed OpenAPI client for the Kalmio backend.
 *
 * Usage:
 *   node scripts/gen-api.mjs           # generate src/types/api.d.ts (soft-fails if backend is offline)
 *   node scripts/gen-api.mjs --strict  # generate; FAIL (exit 1) if backend is offline
 *   node scripts/gen-api.mjs --check   # generate to a temp file and diff against committed; exit 1 if different
 *
 * Env:
 *   KALMIO_API_URL   defaults to http://localhost:8090
 *
 * KALMIO-387 — generate from `${KALMIO_API_URL}/v3/api-docs` (springdoc), output to
 * `src/types/api.d.ts`. Soft-fail mode lets `pnpm dev` work when the backend isn't
 * running locally; strict and check modes are for CI / pre-commit.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const outputPath = resolve(projectRoot, 'src/types/api.d.ts');

const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const check = args.has('--check');

const apiUrl = process.env.KALMIO_API_URL ?? 'http://localhost:8090';
const specUrl = `${apiUrl}/v3/api-docs`;

const HEADER = `/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source: ${apiUrl}/v3/api-docs (springdoc OpenAPI on the kalmio-backend)
 * Regenerate with: pnpm gen:api
 *
 * If you see this file in a diff: the backend route surface changed. Either commit
 * the regenerated file alongside your frontend update, or sync with whoever shipped
 * the backend change. See KALMIO-387 for the rationale.
 */
`;

async function fetchSpec() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(specUrl, { signal: controller.signal });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} from ${specUrl}`);
    }
    return await resp.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function generate() {
  const spec = await fetchSpec();
  const ast = await openapiTS(spec);
  return HEADER + astToString(ast);
}

async function writeIfChanged(content) {
  await mkdir(dirname(outputPath), { recursive: true });
  let existing = null;
  try { existing = await readFile(outputPath, 'utf8'); } catch { /* file may not exist */ }
  if (existing === content) {
    return false;
  }
  await writeFile(outputPath, content);
  return true;
}

async function diffAgainstCommitted(generated) {
  let existing = '';
  try { existing = await readFile(outputPath, 'utf8'); } catch { /* file may not exist */ }
  return existing === generated;
}

(async () => {
  let generated;
  try {
    generated = await generate();
  } catch (err) {
    const msg = err?.message ?? String(err);
    if (strict || check) {
      console.error(`✗ gen:api failed: ${msg}`);
      console.error(`  Backend must be reachable at ${apiUrl} for --strict / --check modes.`);
      process.exit(1);
    }
    console.warn(`⚠ gen:api soft-fail: ${msg}`);
    console.warn(`  Skipping type regeneration. Existing src/types/api.d.ts will be used.`);
    process.exit(0);
  }

  if (check) {
    const same = await diffAgainstCommitted(generated);
    if (!same) {
      console.error('✗ src/types/api.d.ts is stale.');
      console.error('  The backend OpenAPI spec differs from the committed types.');
      console.error('  Run `pnpm gen:api` and commit the result.');
      process.exit(1);
    }
    console.log('✓ src/types/api.d.ts matches the backend spec.');
    return;
  }

  const changed = await writeIfChanged(generated);
  console.log(changed
    ? `✓ wrote ${outputPath}`
    : `✓ ${outputPath} already up to date`);
})();
