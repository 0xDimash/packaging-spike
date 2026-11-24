/**
 * Bring the built ThreatScope frontend into this repo before packaging.
 *
 * This repo deliberately contains no duplicate frontend source. Clone the product repo next to
 * this one (or set THREATSCOPE_FRONTEND), and the script builds it and copies dist/ here.
 * Set SKIP_FRONTEND_BUILD=1 to reuse an existing dist/ without rebuilding.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontend = process.env.THREATSCOPE_FRONTEND
  ? path.resolve(process.env.THREATSCOPE_FRONTEND)
  : path.resolve(root, '..', 'threatscope', 'frontend');

if (!fs.existsSync(path.join(frontend, 'package.json'))) {
  console.error(`ThreatScope frontend not found at ${frontend}`);
  console.error(
    'Clone https://github.com/0xDimash/threatscope.git next to this repo, ' +
      'or set THREATSCOPE_FRONTEND to its frontend/ directory.',
  );
  process.exit(1);
}

if (process.env.SKIP_FRONTEND_BUILD !== '1') {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  console.log(`Building ${frontend} ...`);
  execFileSync(npm, ['ci'], { cwd: frontend, stdio: 'inherit' });
  execFileSync(npm, ['run', 'build'], { cwd: frontend, stdio: 'inherit' });
}

const from = path.join(frontend, 'dist');
if (!fs.existsSync(from)) {
  console.error(`No dist/ at ${from} — build the frontend first.`);
  process.exit(1);
}

const to = path.join(root, 'dist');
fs.rmSync(to, { recursive: true, force: true });
fs.cpSync(from, to, { recursive: true });
console.log(`Copied ${from} -> ${to}`);
