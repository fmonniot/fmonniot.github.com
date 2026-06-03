// Losslessly shrink the committed visual baselines with oxipng.
//
// Safe for visual regression: oxipng only re-encodes the PNG (better
// compression, metadata stripped) — the decoded RGBA pixels are byte-for-byte
// identical, and Playwright compares decoded pixels, so optimised baselines
// still match a fresh render exactly. Idempotent: re-running on already-optimised
// files is a no-op. Run automatically after `npm run test:visual:update`.
//
// Usage: node scripts/optimize-baselines.mjs [dir]   (default: the snapshots dir)

import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] ?? 'tests/visual.spec.ts-snapshots';

/** Resolve how to invoke oxipng: directly on PATH, else via mise. */
function resolveOxipng() {
  for (const [cmd, base] of [
    ['oxipng', []],
    ['mise', ['exec', '--', 'oxipng']],
  ]) {
    const probe = spawnSync(cmd, [...base, '--version'], { stdio: 'ignore' });
    if (!probe.error && probe.status === 0) return { cmd, base };
  }
  return null;
}

function pngFiles(root) {
  const out = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...pngFiles(full));
    else if (entry.name.endsWith('.png')) out.push(full);
  }
  return out;
}

const totalSize = (files) => files.reduce((n, f) => n + statSync(f).size, 0);
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

const files = pngFiles(dir);
if (files.length === 0) {
  console.log(`optimize-baselines: no PNGs under ${dir}, nothing to do.`);
  process.exit(0);
}

const oxipng = resolveOxipng();
if (!oxipng) {
  console.warn(
    'optimize-baselines: oxipng not found — skipping optimisation. ' +
      'Install it with `mise install oxipng` (declared in mise.toml).',
  );
  process.exit(0);
}

const before = totalSize(files);
// -o max: most thorough lossless preset. --strip safe: drop non-essential
// metadata while keeping colour-critical chunks. Multiple files in one pass.
execFileSync(oxipng.cmd, [...oxipng.base, '-o', 'max', '--strip', 'safe', ...files], {
  stdio: 'inherit',
});
const after = totalSize(files);

const saved = before - after;
const pct = before ? ((saved / before) * 100).toFixed(1) : '0.0';
console.log(
  `optimize-baselines: ${files.length} files ${mb(before)} → ${mb(after)} ` +
    `(saved ${mb(saved)}, ${pct}%)`,
);
