const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
const targets = [
  path.join(__dirname, '../dist-electron/main/sql-wasm.wasm'),
  path.join(__dirname, '../dist-electron/sql-wasm.wasm'),
  path.join(__dirname, '../dist/sql-wasm.wasm'),
];

for (const dest of targets) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[copy-wasm] Copied sql-wasm.wasm to ${dest}`);
  }
}
