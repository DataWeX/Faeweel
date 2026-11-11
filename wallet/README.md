# Faewheel wallet

The browser-based **Faewheel** agent workspace, with **Faewheel Expeditions** as its learning-and-quests feature. Adapted from the supplied wallet archive; the existing HDMI/Electron project at the repository root is unchanged.

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

Remote compute is not connected in this version. The workspace framing does not imply that external agents can yet be provisioned or controlled. That requires an authenticated runtime integration.

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


## HelixOS browser workspace

Open **HelixOS desktop** in the sidebar, or visit `/workspace/index.html`. Choose **Open desktop** for the local guest session; **Terminal login** preserves the original shell entry. This is a browser desktop, not native iOS, a secure multi-user OS, or a connected remote agent computer.

- Desktop windows adapt to phone portrait/landscape and browser viewport changes. Terminal has touch shortcuts; browser zoom remains enabled. CRT effects are opt-in in System.
- Files and settings are browser-local, not cloud-synced. Editor Save writes locally; Save to device exports a backup. Storage failures display an in-memory-only warning. Clearing site data removes files. Do not store secrets here.
- The bundled Linux guest is experimental and starts only on request. Emulator startup is not proof of Linux boot; wait for a real guest prompt. TinyEMU cannot be stopped without reloading the page; closing its console only detaches the view. Windows shortcuts do not execute Windows binaries.
- Offline operation and remote agents are not implemented. Physical iPhone/Safari performance still needs device testing.

`npm test` includes HelixOS filesystem-persistence and emulator lifecycle regressions. `npm run build` bundles the browser workspace as static assets.

### Integrated desktop shell profiles

Open **System → Desktop shell → Desktop profile** to select Helix Classic, Plasma-inspired, or XFCE-inspired. These are browser-native presentations of the same HelixOS shell—not KDE/XFCE binaries and not a VM inside a VM. Profiles reuse the existing window manager, terminal, apps, session, and VFS. Switching keeps open windows and unsaved editor contents; your choice is stored under `helixos.shell.v1`. If browser storage is blocked, the selection works for the current session and the panel says so. The optional Linux emulator remains separate and is never started by a profile switch.

The console and terminal provide a full-width labeled input, a touch-friendly Enter button, and separate completion hints. Physical iPhone/Safari software-keyboard behavior still needs on-device verification.

### C core and XML shell styling

The first JavaScript-to-C port is the process registry (`core/process.c`). It compiles to `public/workspace/core/process.wasm`; there is no JavaScript registry fallback. The C table owns IDs, service/application records, bounded names, lifecycle states, and protected removal. `js/core-process.js` bridges its memory and exports to the browser. These are application-level records, not host processes, secure isolation, or a native kernel scheduler. CPU/memory usage is not measured.

JavaScript still owns DOM rendering, input, files/storage, authentication simulation, app logic, and emulator loading. TinyEMU remains one optional runtime service inside the browser application, with v86 as an alternative backend—not a VM inside another VM. Runtime-active status does not imply a booted Linux guest. TinyEMU cannot currently stop without reloading; v86 can stop through its runtime controls. The **Core** app shows live records and runtime controls. Closing a guest console only detaches it.

Shell-profile styling is authored in `public/workspace/xml/shell.xml`, using `<rule selector="…"><property name="…" value="…"/></rule>` and `<media query="…">` groups. `scripts/build-shell-styles.py` validates the XML and generates `css/shell.css` deterministically. Edit the XML, not generated shell CSS. Base/app styles remain CSS; window markup remains in `xml/window.xml`.

Development requires Python 3.10+ and LLVM Clang/LLD 18 in addition to Node.js. On this Ubuntu sandbox, `sh scripts/setup-core.sh` installs the compiler when needed and builds the Wasm module. For other systems install Clang/LLD with wasm32 support; `CLANG` may select an alternative compiler executable. No libc or Emscripten runtime is required.

```sh
sh scripts/setup-core.sh
npm run build:core
npm run build:styles
npm run check:styles
npm run test:helix
```

`npm run dev` regenerates the core and styles at startup; after editing C/XML while it is running, rerun the corresponding build command and reload. `npm run build` also regenerates both before packaging. The generated Wasm is included so a static deployment needs no compiler. Tests exercise the actual compiled module, XML generation/schema rejection, and mocked runtime lifecycle; mocked startup is not proof that an external Linux image boots on a physical phone.
