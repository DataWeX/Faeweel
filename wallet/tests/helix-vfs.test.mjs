import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../public/workspace/js/vfs.js', import.meta.url), 'utf8');

function createVfs(storage) {
  const events = [];
  class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options.detail;
    }
  }
  const context = vm.createContext({
    localStorage: storage,
    window: { dispatchEvent: event => events.push(event) },
    CustomEvent
  });
  vm.runInContext(source, context, { filename: 'vfs.js' });
  return { VFS: vm.runInContext('VFS', context), events };
}

function memoryStorage() {
  const values = new Map();
  return {
    values,
    failWrites: false,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      if (this.failWrites) throw new Error('quota exceeded');
      values.set(key, String(value));
    }
  };
}

test('writes, reads, creates directories, and restores persisted state', () => {
  const storage = memoryStorage();
  const { VFS } = createVfs(storage);

  assert.equal(VFS.mkdir('/home/guest/workspace', { recursive: true }).path, '/home/guest/workspace');
  assert.equal(VFS.write('/home/guest/workspace/notes.txt', 'saved').path, '/home/guest/workspace/notes.txt');
  assert.equal(VFS.read('/home/guest/workspace/notes.txt').content, 'saved');

  const reloaded = createVfs(storage).VFS;
  assert.equal(reloaded.read('/home/guest/workspace/notes.txt').content, 'saved');
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded.getStorageStatus())), { persistent: true, error: null });
});

test('reports quota failures while retaining in-memory data and reports recovery', () => {
  const storage = memoryStorage();
  const { VFS, events } = createVfs(storage);
  storage.failWrites = true;

  VFS.write('/tmp/draft.txt', 'still available');
  assert.equal(VFS.read('/tmp/draft.txt').content, 'still available');
  assert.deepEqual(JSON.parse(JSON.stringify(VFS.getStorageStatus())), {
    persistent: false,
    error: 'Unable to save filesystem to browser storage'
  });
  assert.equal(events.at(-1)?.type, 'helix:storage');
  assert.equal(events.at(-1)?.detail.persistent, false);
  assert.equal(storage.values.size, 0);

  storage.failWrites = false;
  VFS.write('/tmp/draft.txt', 'saved now');
  assert.deepEqual(JSON.parse(JSON.stringify(VFS.getStorageStatus())), { persistent: true, error: null });
  assert.equal(events.at(-1)?.detail.persistent, true);
  assert.equal(createVfs(storage).VFS.read('/tmp/draft.txt').content, 'saved now');
});

test('rejects corrupt roots and uses a safe seeded in-memory filesystem', () => {
  const storage = memoryStorage();
  storage.values.set('helixos.vfs.v1', JSON.stringify({ type: 'file', content: 'not a root directory' }));
  const { VFS } = createVfs(storage);

  assert.equal(VFS.stat('/').type, 'dir');
  assert.equal(VFS.read('/bin/cat').content, 'builtin');
  assert.deepEqual(JSON.parse(JSON.stringify(VFS.getStorageStatus())), {
    persistent: false,
    error: 'Saved filesystem is corrupt; using an in-memory copy'
  });
  assert.equal(JSON.parse(storage.values.get('helixos.vfs.v1')).type, 'file');
});

test('bounds recursive validation of saved trees', () => {
  const storage = memoryStorage();
  let nested = { type: 'file', mode: 420, owner: 'root', group: 'staff', mtime: 1, ctime: 1, content: '' };
  for (let i = 0; i < 130; i++) {
    nested = { type: 'dir', mode: 493, owner: 'root', group: 'staff', mtime: 1, ctime: 1, children: { child: nested } };
  }
  storage.values.set('helixos.vfs.v1', JSON.stringify(nested));

  const { VFS } = createVfs(storage);
  assert.equal(VFS.stat('/').type, 'dir');
  assert.equal(VFS.getStorageStatus().persistent, false);
});
