import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const wasm = readFileSync(new URL('../public/workspace/core/process.wasm', import.meta.url));
const bridge = readFileSync(new URL('../public/workspace/js/core-process.js', import.meta.url), 'utf8');
async function setup() {
  const context = vm.createContext({ WebAssembly, TextEncoder, TextDecoder, fetch: async () => ({ ok: true, arrayBuffer: async () => wasm }) });
  vm.runInContext(`${bridge}\nglobalThis.core = CoreProcess`, context);
  await context.core.load();
  return context;
}

test('real C/Wasm registry owns IDs, lifecycle and protected services', async () => {
  const { core } = await setup();
  assert.equal(core.status().implementation, 'C / WebAssembly');
  assert.deepEqual(Array.from(core.list(), p => p.name), ['init', 'vfs', 'helix-app']);
  const service = core.spawn('tinyemu', 'guest', { kind: 'service', state: 'starting', protected: true });
  assert.equal(service.state, 'starting');
  assert.equal(core.kill(service.pid), false);
  assert.equal(core.update(service.pid, 'running'), true);
  assert.equal(core.list().at(-1).state, 'running');
  assert.equal(core.update(service.pid, 'invented'), false);
  assert.equal(core.release(service.pid), true);
  assert.equal(core.release(1), false);
  assert.equal(core.kill(4294967297), false);
  const next = core.spawn('Editor', 'guest');
  assert.ok(next.pid > service.pid);
  assert.equal(core.kill(next.pid), true);
  assert.equal(core.kill(next.pid), false);
});

test('C table has bounded storage, safe UTF-8 strings and reusable slots', async () => {
  const { core } = await setup();
  const first = core.spawn('🚀'.repeat(80), 'user');
  assert.ok(new TextEncoder().encode(first.name).length < 96);
  assert.ok(!first.name.includes('�'));
  for (let i = core.list().length; i < 128; i++) core.spawn('process', 'user');
  assert.throws(() => core.spawn('overflow', 'user'), /full/);
  assert.equal(core.kill(first.pid), true);
  assert.ok(core.spawn('reused', 'user').pid > first.pid);
});

test('Kernel login/logout does not leak shells or invent resource statistics', async () => {
  const context = await setup();
  Object.assign(context, { localStorage: { getItem: () => null, setItem() {} }, VFS: { read: () => ({ error: true }), write() {} } });
  const source = readFileSync(new URL('../public/workspace/js/kernel.js', import.meta.url), 'utf8');
  vm.runInContext(`${source}\nglobalThis.kernel = Kernel`, context);
  const { kernel } = context;
  for (let i = 0; i < 3; i++) {
    assert.equal(kernel.login('guest', 'guest').user, 'guest');
    assert.equal(kernel.processes.filter(p => p.name === 'hsh').length, 1);
    assert.equal(kernel.kill(kernel.processes.at(-1).pid), false);
    assert.ok(!('cpu' in kernel.processes[0]));
    kernel.logout();
    assert.equal(kernel.processes.length, 3);
  }
});

test('failed Wasm loading is explicit and retryable, never a JS registry fallback', async () => {
  let attempts = 0;
  const context = vm.createContext({ WebAssembly, TextEncoder, TextDecoder, fetch: async () => {
    attempts++;
    return { ok: attempts > 1, arrayBuffer: async () => wasm };
  } });
  vm.runInContext(`${bridge}\nglobalThis.core = CoreProcess`, context);
  await assert.rejects(context.core.load(), /could not be loaded/);
  assert.equal(context.core.status().ready, false);
  assert.throws(() => context.core.spawn('test', 'guest'), /not initialized/);
  await context.core.load();
  assert.equal(context.core.list().length, 3);
});
