import { formatEther } from 'ethers';

export const SUPPORTED_CHAINS = Object.freeze({
  '0x1': Object.freeze({ network: 'Ethereum', symbol: 'ETH' }),
  '0x2105': Object.freeze({ network: 'Base', symbol: 'ETH' }),
  '0xa4b1': Object.freeze({ network: 'Arbitrum One', symbol: 'ETH' }),
  '0xa': Object.freeze({ network: 'Optimism', symbol: 'ETH' }),
  '0x89': Object.freeze({ network: 'Polygon', symbol: 'POL' }),
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
  const chain = SUPPORTED_CHAINS[chainId];
  if (!chain) {
    throw new WalletConnectionError('This network is not supported for balance display.', 'UNSUPPORTED_CHAIN');
  }
  return { chainId, ...chain };
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
