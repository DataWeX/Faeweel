import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/workspace/js/wallet-app.js', import.meta.url), 'utf8');
test('Wallet launcher owns one window, focuses it on repeat, and recreates after close', () => {
  const windows = [];
  const frames = [];
  let focused;
  const context = vm.createContext({
    WM: {
      open(title, body, options) {
        const element = { title, options, isConnected: true, style: {},
          parentElement: { clientWidth: 1000, clientHeight: 700 }, offsetWidth: 900, offsetHeight: 600,
          classList: { add() {} }, querySelector: () => ({ appendChild: frame => frames.push(frame) }) };
        windows.push(element);
        return element;
      },
      focus: element => { focused = element; }
    },
    document: { createElement: tag => ({ tag }) }
  });
  vm.runInContext(source + '\nglobalThis.wallet = WalletApp;', context);
  const first = context.wallet.open();
  assert.equal(first.title, 'Wallet — Aether Vault');
  assert.equal(frames[0].src, '/vault.html');
  assert.match(frames[0].title, /simulation/);
  assert.equal(first.style.left, '50px');
  assert.equal(context.wallet.open(), first);
  assert.equal(focused, first);
  assert.equal(windows.length, 1);
  first.isConnected = false;
  first.options.onClose();
  assert.notEqual(context.wallet.open(), first);
  assert.equal(windows.length, 2);
});

test('Restored wallet uses local simulation and does not mount the legacy signing client', () => {
  const app = readFileSync(new URL('../src/vault/VaultApp.jsx', import.meta.url), 'utf8');
  const operator = readFileSync(new URL('../src/vault/VaultOperator.jsx', import.meta.url), 'utf8');
  assert.match(app, /Local simulation/);
  assert.match(app, /<VaultOperator/);
  assert.doesNotMatch(app, /fetch\(|views\/Operator/);
  assert.doesNotMatch(operator, /operator\/client|fetch\(/);
  assert.match(operator, /disabled>Unlock vault/);
});

test('production build includes the standalone Vault entry', async () => {
  const { default: config } = await import('../vite.config.js');
  assert.equal(config.build.rollupOptions.input.vault, 'vault.html');
  const entry = readFileSync(new URL('../vault.html', import.meta.url), 'utf8');
  assert.match(entry, /src\/vault\/main.jsx/);
});
