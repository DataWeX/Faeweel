# Faewheel wallet

The browser-based **Faewheel** app, with **Faewheel Expeditions** as its learning-and-quests feature. Adapted from the supplied wallet archive; the existing HDMI/Electron project at the repository root is unchanged.

## Run locally

Requires Node.js 22+ and npm.

```sh
cd wallet
npm ci --ignore-scripts
npm run dev
```

Open port 5173. The development launcher runs Vite and the read-only market API on port 3001, shutting both down together. Vite proxies `/api/market` and `/health` to that API. `npm run build` produces the frontend in `dist`; a production host must also route those endpoints to `node server/market-server.js`. `npm run preview` serves only built frontend assets, not a production API deployment.

```sh
npm test
npm run build
```

## What works

- Responsive dashboard and separate, explicitly labeled sample portfolio from the original archive. Sample prices do not pretend to update live.
- Explicit, read-only connection through an injected EIP-1193 browser wallet: public address, selected network, and native balance. Supports Ethereum, Base, Arbitrum One, Optimism, and Polygon. ERC-20 balances, Solana accounts, transaction history, WalletConnect, and signing are not implemented. On a phone, use a wallet's in-app browser; ordinary Safari does not inject a wallet provider.
- Public CoinGecko research scanner for Bitcoin, Ethereum, Solana, Chainlink, Uniswap, and Aave. Reports historical price changes and volume, not expected returns or verified earning offers. Supports filtering, detail review, and a persistent watchlist.
- Four ordered introductory quests, one-time awards, 25 XP and 10 game coins per quest; 100 XP advances a level. No cash or tokens are minted, paid, promised, or withdrawable.
- Local research-budget preference, milestone journal, and browser-local persistence. The budget is not an enforced on-chain spending policy.

## Trust boundaries

The running app cannot send, swap, bridge, sign, or automatically execute a transaction. It never requests private keys or seed phrases. Disconnect clears this app's connection state, not the permissions granted in your wallet extension. Real balances are read from the user's provider and are not blended into sample balances.

The market API uses a fixed upstream URL, a five-second timeout, a 60-second cache and shared in-flight requests. A failed refresh can return the last snapshot explicitly marked stale; an empty cache returns HTTP 503. The browser also marks snapshots older than two minutes stale. Stale or failed scans do not award scan/review XP. No sample data substitutes for a live market response. Keyless CoinGecko availability/rate limits vary; upstream failures are visible to users.

API: `GET /api/market` returns `{ source, fetchedAt, stale, assets }`; assets include `id`, `symbol`, `name`, `price`, `marketCap`, `change24h`, `volume24h`. Failure: `503 { error: { code, message } }`.

Progress and watchlists live under `faewheel.expedition.v1` in browser storage. They are not authenticated or financially authoritative and can be edited locally. Private browsing/storage restrictions can prevent persistence. No claimed airdrop or yield opportunity is verified by this app.

## Imported legacy code

The supplied intent engine, operator/passkey modules, and old views remain for reference and regression testing. They are **not exposed by the default launcher or frontend**. The legacy `npm run operator` command is development-only and is not a production custody or signing service: its local secret fallback and recovery/identity flows require a separate security redesign before real funds or identities are involved. `server/data/` is ignored; do not commit or share its wallet/recovery files. Legacy `aether.*` storage/protocol identifiers remain unchanged for compatibility; new product surfaces are branded Faewheel.

Source references: [CoinGecko markets endpoint](https://docs.coingecko.com/reference/coins-markets), [EIP-1193 provider API](https://eips.ethereum.org/EIPS/eip-1193).
