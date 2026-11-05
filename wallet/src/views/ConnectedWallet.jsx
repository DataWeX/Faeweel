import { useCallback, useEffect, useRef, useState } from 'react';
import { connectWallet, readWallet, WalletConnectionError } from '../engine/connection.js';

const NO_PROVIDER_GUIDANCE = 'No injected wallet found. Open this page in your wallet app’s in-app browser, or install a browser wallet.';

function errorMessage(error) {
  if (error?.code === 4001) return 'Connection was rejected in your wallet.';
  if (error instanceof WalletConnectionError && error.code === 'NO_PROVIDER') return NO_PROVIDER_GUIDANCE;
  return error?.message || 'Unable to read wallet information.';
}

export default function ConnectedWallet() {
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const providerRef = useRef(null);
  const generationRef = useRef(0);

  const disconnect = useCallback(() => {
    generationRef.current += 1;
    providerRef.current = null;
    setWallet(null);
    setError('');
    setBusy(false);
  }, []);

  const refresh = useCallback(async (provider = providerRef.current, address = wallet?.address) => {
    if (!provider || !address) return;
    const generation = ++generationRef.current;
    setBusy(true);
    setError('');
    try {
      const nextWallet = await readWallet(provider, address);
      if (generation === generationRef.current && provider === providerRef.current) setWallet(nextWallet);
    } catch (cause) {
      if (generation === generationRef.current && provider === providerRef.current) {
        setWallet((current) => current ? {
          ...current,
          ...(cause?.code === 'UNSUPPORTED_CHAIN' ? { network: 'Unsupported network' } : {}),
          balance: 'Unavailable',
        } : current);
        setError(errorMessage(cause));
      }
    } finally {
      if (generation === generationRef.current) setBusy(false);
    }
  }, [wallet?.address]);

  const handleAccountsChanged = useCallback(async (accounts) => {
    const provider = providerRef.current;
    if (!provider) return;
    const generation = ++generationRef.current;
    if (!accounts?.length) {
      disconnect();
      return;
    }
    if (!/^0x[\da-f]{40}$/i.test(accounts[0])) {
      setWallet(null);
      setError('The wallet returned an invalid account address.');
      setBusy(false);
      return;
    }
    setWallet((current) => current ? { ...current, address: accounts[0], balance: '—' } : current);
    setBusy(true);
    setError('');
    try {
      const nextWallet = await readWallet(provider, accounts[0]);
      if (generation === generationRef.current && provider === providerRef.current) setWallet(nextWallet);
    } catch (cause) {
      if (generation === generationRef.current && provider === providerRef.current) {
        setWallet((current) => current ? {
          ...current,
          ...(cause?.code === 'UNSUPPORTED_CHAIN' ? { network: 'Unsupported network' } : {}),
          balance: 'Unavailable',
        } : current);
        setError(errorMessage(cause));
      }
    } finally {
      if (generation === generationRef.current) setBusy(false);
    }
  }, [disconnect]);

  const handleChainChanged = useCallback(() => {
    if (providerRef.current && wallet?.address) {
      setWallet((current) => current ? { ...current, network: 'Checking network…', balance: '—' } : current);
      refresh(providerRef.current, wallet.address);
    }
  }, [refresh, wallet?.address]);

  const connect = async () => {
    const provider = typeof window !== 'undefined' ? window.ethereum : null;
    const generation = ++generationRef.current;
    setBusy(true);
    setError('');
    try {
      const nextWallet = await connectWallet(provider);
      if (generation !== generationRef.current) return;
      providerRef.current = provider;
      setWallet(nextWallet);
    } catch (cause) {
      if (generation === generationRef.current) setError(errorMessage(cause));
    } finally {
      if (generation === generationRef.current) setBusy(false);
    }
  };

  useEffect(() => {
    const provider = providerRef.current;
    if (!wallet || !provider) return undefined;
    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);
    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [wallet?.address, handleAccountsChanged, handleChainChanged]);

  useEffect(() => () => {
    generationRef.current += 1;
  }, []);

  return (
    <section className="panel wallet-connect" aria-labelledby="connected-wallet-title">
      <div className="eyebrow">Read-only wallet</div>
      <h2 id="connected-wallet-title">Connect wallet</h2>
      {wallet ? (
        <dl>
          <div><dt>Address</dt><dd><code>{wallet.address}</code></dd></div>
          <div><dt>Network</dt><dd>{wallet.network}</dd></div>
          <div><dt>Native balance</dt><dd>{wallet.balance} {wallet.symbol}</dd></div>
        </dl>
      ) : <p className="muted">Connect to view your public address, network, and native balance.</p>}
      <div className="wallet-connect-actions">
        {wallet ? <>
          <button className="button" type="button" onClick={() => refresh()} disabled={busy}>
            {busy ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="button" type="button" onClick={disconnect} disabled={busy}>Disconnect</button>
        </> : (
          <button className="button" type="button" onClick={connect} disabled={busy}>
            {busy ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
      </div>
      {wallet && <p className="muted">Disconnect only clears this app’s local connection; it does not revoke wallet permission.</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
