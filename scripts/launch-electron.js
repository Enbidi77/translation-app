const { spawn, execSync } = require('child_process');
const electronPath = require('electron');
const path = require('path');

// Ensure wasm binaries are copied
require('./copy-wasm');

// Sanitize environment variables so Electron never runs as node in dev
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

// Terminate any previous dev electron processes to avoid lock collisions
if (process.platform === 'win32') {
  try {
    execSync('taskkill /F /IM electron.exe /T 2>nul', { stdio: 'ignore' });
  } catch (_) {}
}

const child = spawn(electronPath, ['.'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env,
  windowsHide: false,
});

child.on('close', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('[Launch Electron] Error spawning electron:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  try { child.kill('SIGINT'); } catch (_) {}
  process.exit(0);
});

process.on('SIGTERM', () => {
  try { child.kill('SIGTERM'); } catch (_) {}
  process.exit(0);
});
