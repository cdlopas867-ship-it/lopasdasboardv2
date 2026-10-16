#!/usr/bin/env node

// scripts/force-drive-import.mjs
// Run this inside the project (node >= 18) to force an import from the Drive.
// Useful when testing locally or inside the container.

import { importarSeMudou } from "../src/lib/drive-auto-import";

async function main() {
  try {
    const updated = await importarSeMudou(true);
    console.log('[scripts/force-drive-import] updated:', updated);
    process.exit(updated ? 0 : 0);
  } catch (err) {
    console.error('[scripts/force-drive-import] erro:', err);
    process.exit(2);
  }
}

main();
