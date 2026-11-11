import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../public/workspace/js/shell.js', import.meta.url), 'utf8');
function load(storage) {
  const events = [];
  const document = { documentElement: { dataset: {} } };
  const context = {
    document, localStorage: storage,
    window: { dispatchEvent(event) { events.push(event); } },
    Event: class { constructor(type) { this.type = type; } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  };
  const Shell = vm.runInNewContext(`${source}; Shell`, context);
  return { Shell, events, document };
}
function storage(initial = null) {
  return {
    value: initial, fail: false,
    getItem() { return this.value; },
    setItem(_key, value) { if (this.fail) throw new Error('blocked'); this.value = value; }
  };
}

test('shell profiles run without an emulator and persist across reloads', () => {
  const saved = storage();
  const { Shell, document, events } = load(saved);
  assert.equal(Shell.status().profile, 'helix');
  for (const profile of ['plasma', 'xfce', 'helix']) {
    assert.equal(Shell.setProfile(profile).profile, profile);
    assert.equal(document.documentElement.dataset.shell, profile);
    assert.equal(load(saved).Shell.status().profile, profile);
    assert.equal(events.at(-2).type, 'resize');
    assert.equal(events.at(-1).type, 'helix:shell');
  }
});

test('unknown or corrupt profiles fall back safely and cannot be applied', () => {
  const { Shell, document } = load(storage('invalid'));
  assert.equal(Shell.status().profile, 'helix');
  assert.equal(Shell.setProfile('invalid').error, 'Unknown desktop profile');
  assert.equal(document.documentElement.dataset.shell, 'helix');
});

test('storage failure still applies the shell and reports session-only state, then recovers', () => {
  const saved = storage();
  const { Shell, document } = load(saved);
  saved.fail = true;
  assert.equal(Shell.setProfile('xfce').persistent, false);
  assert.equal(document.documentElement.dataset.shell, 'xfce');
  saved.fail = false;
  assert.equal(Shell.setProfile('plasma').persistent, true);
  assert.equal(load(saved).Shell.status().profile, 'plasma');
});
