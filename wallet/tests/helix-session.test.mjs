import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = async name => readFile(new URL(`../public/workspace/js/${name}.js`, import.meta.url), 'utf8');

function element() {
  return {
    hidden: false, value: '', textContent: '', dataset: {}, listeners: new Map(), attributes: {}, children: [],
    classList: { toggle() {}, contains() { return false; } },
    addEventListener(name, fn) { this.listeners.set(name, fn); },
    removeEventListener(name, fn) { if (this.listeners.get(name) === fn) this.listeners.delete(name); },
    setAttribute(name, value) { this.attributes[name] = value; },
    appendChild(child) { this.children.push(child); }, focus() {}
  };
}

function environment() {
  const nodes = new Map();
  const get = name => {
    if (!nodes.has(name)) nodes.set(name, element());
    return nodes.get(name);
  };
  const document = {
    getElementById: get, createElement: element,
    documentElement: element(), body: element()
  };
  const context = {
    document, window: element(), navigator: {}, matchMedia: () => ({ matches: false }),
    setInterval() {}, localStorage: { getItem() {} },
    Kernel: { session: { loggedIn: false }, env: { HOSTNAME: 'helix' }, logout() { this.session.loggedIn = false; } },
    Desktop: { bind() {}, start() { this.started = true; }, applyLook() {} },
    VFS: { getStorageStatus: () => ({ persistent: true }) },
    CoreProcess: { load: async () => {} },
    WM: { list: () => [] }, XmlWin: { load: async () => {} },
    Shell: { profiles: [], status: () => ({ profile: 'helix', persistent: true }) },
    Terminal: { bindTty() {} }
  };
  return { context, get };
}

test('direct desktop entry keeps welcome visible on changed guest credentials', async () => {
  const { context, get } = environment();
  context.Kernel.login = () => ({ error: 'Login incorrect' });
  await vm.runInNewContext(await source('main'), context);
  get('enterDesktop').listeners.get('click')();
  assert.equal(get('welcome').hidden, false);
  assert.match(get('welcomeMessage').textContent, /password has changed/);
  assert.equal(context.Desktop.started, undefined);
});

test('successful direct login opens the desktop', async () => {
  const { context, get } = environment();
  context.Kernel.login = () => ({ user: 'guest' });
  await vm.runInNewContext(await source('main'), context);
  get('enterDesktop').listeners.get('click')();
  assert.equal(get('welcome').hidden, true);
  assert.equal(context.Desktop.started, true);
});

test('console login is ready synchronously and clears stale input on reentry', async () => {
  const { context, get } = environment();
  get('tty').querySelector = get;
  const Terminal = vm.runInNewContext(`${await source('terminal')}; Terminal`, context);
  get('.term-in').value = 'stale password';
  get('.term-ghost').textContent = 'stale completion';
  Terminal.boot();
  assert.equal(get('.term-in').disabled, false);
  assert.equal(get('.term-in').value, '');
  assert.equal(get('.term-ghost').textContent, '');
  assert.equal(get('.term-prompt').textContent, 'helix login:');
  assert.equal(get('.term-in').type, 'text');
});

test('System storage status updates live and unsubscribes when closed', async () => {
  const { context, get } = environment();
  let close;
  context.WM.open = (_title, _html, options) => {
    close = options.onClose;
    return { dataset: { id: 'w1' }, querySelector: get };
  };
  const System = vm.runInNewContext(`${await source('system')}; System`, context);
  System.open();
  assert.match(get('[data-storage]').textContent, /Browser local storage/);
  context.VFS.getStorageStatus = () => ({ persistent: false });
  context.window.listeners.get('helix:storage')();
  assert.match(get('[data-storage]').textContent, /In-memory only/);
  context.VFS.getStorageStatus = () => ({ persistent: true });
  context.window.listeners.get('helix:storage')();
  assert.match(get('[data-storage]').textContent, /Browser local storage/);
  close();
  assert.equal(context.window.listeners.has('helix:storage'), false);
});


test('console input has accessible state labels, touch submit and non-overlaid completion', async () => {
  const { context, get } = environment();
  get('tty').querySelector = get;
  context.VFS.read = () => ({ error: 'not found' });
  context.Kernel.prompt = () => 'guest@helix:~$';
  context.Commands = { complete: () => ['whoami'] };
  const Terminal = vm.runInNewContext(`${await source('terminal')}; Terminal`, context);
  Terminal.boot();
  assert.equal(get('.term-in').attributes['aria-label'], 'Username');
  assert.equal(get('.term-form').children[0].type, 'submit');
  assert.equal(get('.term-form').children[0].textContent, 'Enter');
  assert.equal(get('.term-ghost').attributes['aria-hidden'], 'true');
  Terminal.tty.enterShell();
  get('.term-in').value = 'whoam';
  get('.term-in').listeners.get('input')();
  assert.equal(get('.term-ghost').textContent, 'Tab → whoami');
  assert.equal(get('.term-in').attributes['aria-label'], 'Terminal command');
});
