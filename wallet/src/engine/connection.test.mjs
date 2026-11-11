import test from 'node:test';
import assert from 'node:assert/strict';
import { connectWallet, readWallet, WalletConnectionError } from './connection.js';

const ACCOUNT = '0x1234567890abcdef1234567890abcdef12345678';

function providerFor(responses) {
  const calls = [];
  return {
    calls,
    request: async (request) => {
      calls.push(request);
      const result = responses[request.method];
      if (result instanceof Error) throw result;
      return typeof result === 'function' ? result(request) : result;
    },
  };
}

test('connect requests account access, network, and native balance in order', async () => {
  const provider = providerFor({
    eth_requestAccounts: [ACCOUNT],
    eth_chainId: '0x1',
    eth_getBalance: '0x16345785d8a0000',
  });

  assert.deepEqual(await connectWallet(provider), {
    address: ACCOUNT,
    chainId: '0x1',
    network: 'Ethereum',
    symbol: 'ETH',
    balance: '0.1',
  });
  assert.deepEqual(provider.calls, [
    { method: 'eth_requestAccounts' },
    { method: 'eth_chainId' },
    { method: 'eth_getBalance', params: [ACCOUNT, 'latest'] },
  ]);
});

test('readWallet supports configured networks and canonicalizes chain IDs', async () => {
  const provider = providerFor({
    eth_chainId: '0X89',
    eth_getBalance: '0x0',
  });

  assert.deepEqual(await readWallet(provider, ACCOUNT), {
    address: ACCOUNT,
    chainId: '0x89',
    network: 'Polygon',
    symbol: 'POL',
    balance: '0.0',
  });
});

test('missing provider and malformed accounts are rejected', async () => {
  await assert.rejects(connectWallet(undefined), { name: 'WalletConnectionError', code: 'NO_PROVIDER' });
  const provider = providerFor({ eth_requestAccounts: ['not-an-address'] });
  await assert.rejects(connectWallet(provider), { name: 'WalletConnectionError', code: 'INVALID_ACCOUNT' });
  assert.equal(provider.calls.length, 1);
});

test('unsupported chains stop before requesting a balance', async () => {
  const provider = providerFor({ eth_chainId: '0x539', eth_getBalance: '0x0' });
  await assert.rejects(readWallet(provider, ACCOUNT), { name: 'WalletConnectionError', code: 'UNSUPPORTED_CHAIN' });
  assert.deepEqual(provider.calls, [{ method: 'eth_chainId' }]);
});

test('invalid chain and balance responses are rejected', async () => {
  const invalidChain = providerFor({ eth_chainId: '1' });
  await assert.rejects(readWallet(invalidChain, ACCOUNT), { name: 'WalletConnectionError', code: 'INVALID_CHAIN' });

  const invalidBalance = providerFor({ eth_chainId: '0x1', eth_getBalance: '1 ETH' });
  await assert.rejects(readWallet(invalidBalance, ACCOUNT), { name: 'WalletConnectionError', code: 'INVALID_BALANCE' });
});

test('wallet rejections are propagated unchanged', async () => {
  const rejection = Object.assign(new Error('User rejected the request.'), { code: 4001 });
  const provider = providerFor({ eth_requestAccounts: rejection });
  await assert.rejects(connectWallet(provider), (error) => error === rejection);
});

test('request failures during balance reads are propagated unchanged', async () => {
  const failure = new Error('Provider unavailable');
  const provider = providerFor({ eth_chainId: '0x1', eth_getBalance: failure });
  await assert.rejects(readWallet(provider, ACCOUNT), (error) => error === failure);
});
