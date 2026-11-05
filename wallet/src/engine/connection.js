import { formatEther } from 'ethers';

export const SUPPORTED_CHAINS = Object.freeze({
  '0x1': 'Ethereum',
  '0x2105': 'Base',
  '0xa4b1': 'Arbitrum One',
  '0xa': 'Optimism',
  '0x89': 'Polygon',
});

export class WalletConnectionError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'WalletConnectionError';
    this.code = code;
  }
}

function assertProvider(provider) {
  if (!provider || typeof provider.request !== 'function') {
    throw new WalletConnectionError('No injected wallet provider was found.', 'NO_PROVIDER');
  }
}

function normalizeChainId(value) {
  try {
    if (typeof value !== 'string' || !/^0x[\da-f]+$/i.test(value)) throw new Error();
    return `0x${BigInt(value).toString(16)}`;
  } catch {
    throw new WalletConnectionError('The wallet returned an invalid network ID.', 'INVALID_CHAIN');
  }
}

function supportedNetwork(chainId) {
  const name = SUPPORTED_CHAINS[chainId];
  if (!name) {
    throw new WalletConnectionError('This network is not supported for balance display.', 'UNSUPPORTED_CHAIN');
  }
  return { chainId, network: name };
}

function validAddress(address) {
  return typeof address === 'string' && /^0x[\da-f]{40}$/i.test(address);
}

export async function readWallet(provider, address) {
  assertProvider(provider);
  if (!validAddress(address)) {
    throw new WalletConnectionError('The wallet returned an invalid account address.', 'INVALID_ACCOUNT');
  }

  const chainId = normalizeChainId(await provider.request({ method: 'eth_chainId' }));
  const network = supportedNetwork(chainId);
  const balance = await provider.request({
    method: 'eth_getBalance',
    params: [address, 'latest'],
  });
  if (typeof balance !== 'string' || !/^0x[\da-f]+$/i.test(balance)) {
    throw new WalletConnectionError('The wallet returned an invalid native balance.', 'INVALID_BALANCE');
  }

  return { address, ...network, balance: formatEther(BigInt(balance)) };
}

export async function connectWallet(provider) {
  assertProvider(provider);
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!Array.isArray(accounts) || accounts.length === 0 || !validAddress(accounts[0])) {
    throw new WalletConnectionError('The wallet did not provide a valid account.', 'INVALID_ACCOUNT');
  }
  return readWallet(provider, accounts[0]);
}
