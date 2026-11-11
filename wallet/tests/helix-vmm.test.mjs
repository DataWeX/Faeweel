import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../public/workspace/js/vmm.js', import.meta.url), 'utf8');

function loadVmm({ tiny = false, tinyFailure = false, v86 = true, v86Ready = true, stopFailure = false } = {}) {
  const processes = [];
  const calls = [];
  const emulators = [];
  const kernel = {
    env: {},
    log() {},
    spawn(name, options) {
      const process = { pid: processes.length + 1, name, options, state: options.state };
      processes.push(process);
      calls.push(['spawn', name, options]);
      return process;
    },
    updateProcess(pid, state) {
      calls.push(['update', pid, state]);
      processes.find((process) => process.pid === pid).state = state;
    },
    release(pid) { calls.push(['release', pid]); },
  };
  const module = { calledRun: true, ccall() { calls.push(['ccall']); } };
  const context = {
    Kernel: kernel,
    window: {
      location: { href: 'https://helix.test/workspace/' },
      Module: module,
    },
    document: {
      createElement() { return {}; },
      head: {
        appendChild(script) {
          if (tinyFailure) script.onerror();
          else script.onload();
        },
      },
    },
    URL,
    Promise,
    Set,
    Error,
    String,
  };
  if (tiny) context.Module = module;
  if (v86) {
    context.V86 = class {
      constructor() {
        this.listeners = new Map();
        this.stoppedFailure = stopFailure;
        emulators.push(this);
      }
      add_listener(name, fn) {
        this.listeners.set(name, fn);
        if (name === 'emulator-ready' && v86Ready) queueMicrotask(fn);
      }
      emit(name, value) { this.listeners.get(name)?.(value); }
      async stop() {
        calls.push(['stop']);
        if (this.stoppedFailure) throw new Error('stop failed');
      }
      async destroy() { calls.push(['destroy']); }
      serial0_send() {}
    };
  }
  vm.runInNewContext(`${source}\nthis.VMM = VMM;`, context);
  return { VMM: context.VMM, kernel, processes, calls, emulators };
}

test('TinyEMU registers one protected service and retains it when stop requires reload', async () => {
  const { VMM, kernel, processes, calls } = loadVmm({ tiny: true });
  assert.equal((await VMM.start()).ok, true);

  assert.equal(processes.length, 1);
  assert.equal(processes[0].name, 'vmm');
  assert.deepEqual(processes[0].options, { kind: 'service', state: 'starting', protected: true });
  assert.deepEqual(calls.filter(([type]) => type === 'update'), [['update', 1, 'running']]);
  assert.equal(VMM.status().runtimeActive, true);
  assert.equal(VMM.status().linuxReady, false);
  assert.equal(VMM.status().backend, 'tinyemu');

  const stop = await VMM.stop();
  assert.equal(stop.error, 'TinyEMU cannot be stopped; reload the page to stop it.');
  assert.equal(VMM.status().running, true);
  assert.equal(kernel.env.VMM, 'tinyemu');
  assert.deepEqual(calls.filter(([type]) => type === 'release'), []);
});

test('simultaneous starts share one pending runtime initialization', async () => {
  const { VMM, processes, calls, emulators } = loadVmm({ tinyFailure: true, v86Ready: false });
  const first = VMM.start();
  const second = VMM.start();
  assert.equal(first, second);

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(emulators.length, 1);
  assert.equal(processes.length, 1);
  assert.equal(processes[0].state, 'starting');
  assert.equal(VMM.status().starting, true);
  assert.equal(VMM.status().runtimeActive, false);

  emulators[0].emit('emulator-ready');
  const results = await Promise.all([first, second]);
  assert.equal(results[0].ok, true);
  assert.equal(results[1].ok, true);
  assert.equal(VMM.status().runtimeActive, true);
  assert.deepEqual(calls.filter(([type]) => type === 'update'), [['update', 1, 'running']]);
});

test('failed runtime startup releases its service and clears environment', async () => {
  const { VMM, kernel, calls } = loadVmm({ tinyFailure: true, v86: false });
  const result = await VMM.start();

  assert.equal(result.error, 'v86 runtime missing');
  assert.equal(VMM.status().starting, false);
  assert.equal(VMM.status().runtimeActive, false);
  assert.equal(VMM.status().backend, 'none');
  assert.equal(kernel.env.VMM, undefined);
  assert.equal(kernel.env.GUEST_ARCH, undefined);
  assert.deepEqual(calls.filter(([type]) => type === 'release'), [['release', 1]]);
});

test('Linux readiness is reported only after a guest console prompt', async () => {
  const { VMM, emulators } = loadVmm({ tinyFailure: true });
  await VMM.start();
  assert.equal(VMM.status().runtimeActive, true);
  assert.equal(VMM.status().linuxReady, false);

  for (const byte of new TextEncoder().encode('booting\nhelix login:')) {
    emulators[0].emit('serial0-output-byte', byte);
  }
  assert.equal(VMM.status().linuxReady, true);
});

test('v86 stop failure preserves active service state', async () => {
  const { VMM, kernel, calls } = loadVmm({ tinyFailure: true, stopFailure: true });
  await VMM.start();
  const result = await VMM.stop();

  assert.equal(result.error, 'stop failed');
  assert.equal(VMM.status().running, true);
  assert.equal(VMM.status().backend, 'v86');
  assert.equal(kernel.env.VMM, 'v86');
  assert.deepEqual(calls.filter(([type]) => type === 'release'), []);
  assert.equal(calls.some(([type]) => type === 'destroy'), false);
});

test('successful v86 stop destroys the emulator and releases its service', async () => {
  const { VMM, kernel, calls, processes } = loadVmm({ tinyFailure: true });
  const start = await VMM.start();
  assert.equal(start.ok, true);
  assert.equal(start.fallback, true);
  assert.equal(processes.length, 1);

  assert.equal((await VMM.stop()).ok, true);
  assert.equal(VMM.status().running, false);
  assert.equal(VMM.status().backend, 'none');
  assert.equal(VMM.status().kernel, null);
  assert.equal(kernel.env.VMM, undefined);
  assert.equal(kernel.env.GUEST_ARCH, undefined);
  assert.deepEqual(calls.filter(([type]) => type === 'release'), [['release', 1]]);
  assert.deepEqual(calls.filter(([type]) => type === 'stop' || type === 'destroy'), [['stop'], ['destroy']]);
});

test('initial VMM status is stopped with no active service', () => {
  const { VMM } = loadVmm();
  assert.equal(VMM.status().running, false);
  assert.equal(VMM.status().runtimeActive, false);
  assert.equal(VMM.status().linuxReady, false);
  assert.equal(VMM.status().backend, 'none');
  assert.equal(VMM.status().kernel, null);
});
