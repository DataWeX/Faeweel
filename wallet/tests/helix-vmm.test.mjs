import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../public/workspace/js/vmm.js', import.meta.url), 'utf8');

function loadVmm({ tiny = false } = {}) {
  const detached = [];
  const kernel = {
    env: {},
    log() {},
    spawn(name) { return { pid: name === 'vmm' ? 1 : 2 }; },
    kill(pid) { detached.push(pid); },
  };
  const module = {
    calledRun: true,
    ccall() {},
  };
  const context = {
    Kernel: kernel,
    window: {
      location: { href: 'https://helix.test/workspace/' },
      Module: module,
    },
    document: {
      createElement() { return {}; },
      head: { appendChild(script) { script.onload(); } },
    },
    URL,
    Promise,
    Set,
    Error,
    String,
    V86: class {
      constructor() { this.stopped = false; this.destroyed = false; }
      add_listener() {}
      async stop() { this.stopped = true; }
      async destroy() { this.destroyed = true; }
    },
  };
  if (tiny) context.Module = module;
  vm.runInNewContext(`${source}\nthis.VMM = VMM;`, context);
  return { VMM: context.VMM, kernel, detached };
}

test('TinyEMU stop reports reload requirement without detaching or changing running status', async () => {
  const { VMM, kernel, detached } = loadVmm({ tiny: true });
  assert.deepEqual(await VMM.start(), { ok: true });
  const stop = await VMM.stop();

  assert.equal(stop.error, 'TinyEMU cannot be stopped; reload the page to stop it.');
  assert.equal(VMM.status().running, true);
  assert.equal(VMM.status().backend, 'tinyemu');
  assert.equal(kernel.env.VMM, 'tinyemu');
  assert.deepEqual(detached, []);
});

test('stopped VMM status has no active kernel', () => {
  const { VMM } = loadVmm();
  assert.equal(VMM.status().running, false);
  assert.equal(VMM.status().backend, 'none');
  assert.equal(VMM.status().kernel, null);
});

test('v86 stop destroys the emulator and clears backend status', async () => {
  const { VMM, kernel, detached } = loadVmm();
  assert.deepEqual(await VMM.start(), { ok: true, fallback: true });
  assert.equal(VMM.status().backend, 'v86');

  assert.deepEqual(await VMM.stop(), { ok: true });
  assert.equal(VMM.status().running, false);
  assert.equal(VMM.status().backend, 'none');
  assert.equal(VMM.status().kernel, null);
  assert.equal(kernel.env.VMM, undefined);
  assert.deepEqual(detached, [1, 2]);
});
