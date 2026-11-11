import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const compiler = process.env.CLANG || 'clang-18';
const exports = ['hx_init', 'hx_name_input', 'hx_user_input', 'hx_capacity', 'hx_pid_at', 'hx_spawn', 'hx_release', 'hx_kill', 'hx_state', 'hx_kind', 'hx_protected', 'hx_name', 'hx_user', 'hx_update'];
mkdirSync(`${root}public/workspace/core`, { recursive: true });
const result = spawnSync(compiler, [
  '--target=wasm32', '-std=c11', '-Os', '-Wall', '-Wextra', '-Werror',
  '-ffreestanding', '-fno-builtin', '-nostdlib', '-Wl,--no-entry',
  '-Wl,--export-memory', '-Wl,--strip-all',
  ...exports.map(name => `-Wl,--export=${name}`),
  'core/process.c', '-o', 'public/workspace/core/process.wasm'
], { cwd: root, stdio: 'inherit' });
if (result.error) console.error(`C/Wasm compiler unavailable: run scripts/setup-core.sh (${result.error.message})`);
process.exit(result.status ?? 1);
