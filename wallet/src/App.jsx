import { useEffect, useRef, useState } from 'react'
import { initialAssets, CHAINS, TOKENS } from './data/seed.js'
import { totalValue } from './engine/wallet.js'
import { completeQuest, createProgress, normalizeProgress, questDefinitions, getLevel } from './engine/quests.js'
import ConnectedWallet from './views/ConnectedWallet.jsx'

const KEY = 'faewheel.expedition.v1'
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 1 ? 4 : 2 }).format(n)
const compact = (n) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
const NAV = [['home', 'Overview', 'grid'], ['wallet', 'My wallet', 'wallet'], ['discover', 'Discover', 'compass'], ['quests', 'Quest path', 'flag'], ['activity', 'Activity', 'clock']]
const demoAssets = initialAssets()

function readSaved() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {}
    return { player: normalizeProgress(s.player), watchlist: Array.isArray(s.watchlist) ? s.watchlist.filter(x => typeof x === 'string').slice(0, 100) : [], limit: Number.isFinite(s.limit) && s.limit >= 1 && s.limit <= 100000 ? s.limit : 100 }
  } catch { return { player: createProgress(), watchlist: [], limit: 100 } }
}

function Icon({ name, size = 20 }) {
  const paths = { grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', wallet: 'M3 6h16v14H3z M3 6V3h13v3 M15 11h6v5h-6z', compass: 'M9 9l8-2-2 8-8 2z M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', flag: 'M5 22V3 M5 3h14l-3 5 3 5H5', clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 6v6l4 2', shield: 'M12 2l8 3v7c0 5-8 10-8 10S4 17 4 12V5z M8 11l3 3 5-6', arrow: 'M4 12h16 M14 6l6 6-6 6', check: 'M5 12l4 4L19 6', star: 'M12 2l3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z', search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6', lock: 'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4', refresh: 'M20 8a9 9 0 1 0 1 7 M20 2v6h-6', close: 'M5 5l14 14 M19 5L5 19' }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.star} /></svg>
}

function Island() {
  return <svg className="island-art" viewBox="0 0 440 310" role="img" aria-label="An illustrated floating island with a trail leading to a green flag">
    <defs><linearGradient id="rock" x2="0" y2="1"><stop stopColor="#314b3c"/><stop offset="1" stopColor="#172b23"/></linearGradient><linearGradient id="land" x2="1" y2="1"><stop stopColor="#bddc8e"/><stop offset="1" stopColor="#678557"/></linearGradient></defs>
    <ellipse cx="235" cy="269" rx="135" ry="16" fill="#091b14" opacity=".3"/>
    <g fill="none" stroke="#bfe3a6" opacity=".18"><ellipse cx="230" cy="168" rx="190" ry="83" transform="rotate(-16 230 168)" strokeDasharray="4 8"/><circle cx="230" cy="160" r="133"/></g>
    <path d="M78 183l70 64 68 39 70-38 70-75-119-48z" fill="url(#rock)"/><path d="M148 247l14-72 54 111 14-105 56 67 18-92" fill="none" stroke="#53704d" opacity=".4"/>
    <path d="M78 183l47-60 81-29 98 22 52 57-70 45-105 10z" fill="url(#land)"/><path d="M78 183l103 45 105-10 70-45-70 35-105 8z" fill="#557341"/>
    <path d="M150 208c-1-32 78-12 68-39s-59-4-35-27 65-5 71-30" fill="none" stroke="#e6e7bb" strokeWidth="13" strokeLinecap="round"/>
    <path d="M247 113V51" stroke="#e8f0d8" strokeWidth="4"/><path d="M249 52l49 7-13 15 11 11-47-9z" fill="#c7f87a"/>
    <g fill="#365e3e"><path d="M121 161l17-45 17 45z"/><path d="M290 169l21-56 21 56z"/><path d="M276 139l13-35 13 35z"/></g><g stroke="#445637" strokeWidth="4"><path d="M138 155v16 M311 163v17 M289 134v12"/></g>
    <g fill="#e6c778" stroke="#f8dea3" strokeWidth="2"><ellipse cx="191" cy="164" rx="8" ry="11"/><ellipse cx="214" cy="132" rx="7" ry="10"/></g><path d="M191 159v10 M214 128v8" stroke="#8d723b" strokeWidth="2"/>
    <g fill="#c6f784"><path d="M98 80l3 7 7 3-7 3-3 7-3-7-7-3 7-3z M344 110l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><circle cx="334" cy="67" r="3"/><circle cx="75" cy="215" r="3"/></g>
  </svg>
}

function Detail({ asset, onClose, saved, onSave }) {
  const ref = useRef(null)
  useEffect(() => { ref.current.showModal() }, [])
  return <dialog ref={ref} className="detail-dialog" onClose={onClose} onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close() }}>
    <button className="icon-button close-dialog" aria-label="Close opportunity" onClick={() => ref.current.close()}><Icon name="close"/></button>
    <span className="eyebrow">MARKET RESEARCH · NOT A RECOMMENDATION</span>
    <h2>{asset.name} <span className="muted">{asset.symbol.toUpperCase()}</span></h2><div className="detail-price">{money(asset.price)}</div>
    <div className="detail-stats"><span>24h change<strong className={asset.change24h >= 0 ? 'positive' : 'negative'}>{asset.change24h.toFixed(2)}%</strong></span><span>24h volume<strong>${compact(asset.volume24h)}</strong></span><span>Market cap<strong>${compact(asset.marketCap)}</strong></span></div>
    <h3>What the scout noticed</h3><p>{asset.change24h >= 0 ? 'The price increased' : 'The price decreased'} over the last 24 hours. Reported trading volume is {((asset.volume24h / asset.marketCap) * 100).toFixed(2)}% of market capitalization. These are historical observations, not a forecast.</p>
    <div className="risk-note"><Icon name="shield"/><p>Prices can fall sharply. Volume does not establish liquidity, safety, or future returns. Verify the asset, network, fees, and liquidity independently before taking any action.</p></div>
    <p className="muted">This scanner does not verify airdrops, yield offers, token eligibility, or rewards. No trade is executed here.</p>
    <button className="button primary" onClick={onSave}><Icon name="star"/>{saved ? 'Remove from watchlist' : 'Add to watchlist'}</button>
  </dialog>
}

export default function App() {
  const [saved] = useState(readSaved)
  const [player, setPlayer] = useState(saved.player)
  const [watchlist, setWatchlist] = useState(saved.watchlist)
  const [limit, setLimit] = useState(saved.limit)
  const [limitDraft, setLimitDraft] = useState(String(saved.limit))
  const [view, setView] = useState('home')
  const [market, setMarket] = useState(null)
  const [scanning, setScanning] = useState(false)
  const scanLock = useRef(false)
  const [marketError, setMarketError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const [storageError, setStorageError] = useState(false)
  const level = getLevel(player)
  const nextQuest = questDefinitions.find(q => !player.completed.includes(q.id))
  const rows = (market?.assets || []).filter(a => `${a.name} ${a.symbol}`.toLowerCase().includes(query.toLowerCase()) && (filter !== 'saved' || watchlist.includes(a.id)))
  const stale = market && (market.stale || Date.now() - Date.parse(market.fetchedAt) > 120000)
  const [, tick] = useState(0)

  useEffect(() => { const timer = setInterval(() => tick(n => n + 1), 30000); return () => clearInterval(timer) }, [])
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ player, watchlist, limit })); setStorageError(false) } catch { setStorageError(true) }
  }, [player, watchlist, limit])
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(t) }, [notice])

  function award(id) {
    const quest = questDefinitions.find(q => q.id === id)
    if (quest) setPlayer(p => completeQuest(p, quest.event))
  }
  function navigate(id) { setView(id); if (id === 'wallet') award('explore-wallet') }
  function continueQuest() {
    const destinations = { 'explore-wallet': 'wallet', 'scan-market': 'discover', 'review-opportunity': 'discover', 'set-risk-limit': 'rules' }
    navigate(destinations[nextQuest?.id] || 'discover')
  }
  async function scan() {
    if (scanLock.current) return
    scanLock.current = true; setScanning(true); setMarketError('')
    try {
      const response = await fetch('/api/market', { signal: AbortSignal.timeout(15000) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Market data is unavailable. Please try again shortly.')
      if (!Array.isArray(data.assets) || !data.assets.length || !Number.isFinite(Date.parse(data.fetchedAt)) || !data.assets.every(a => typeof a.id === 'string' && typeof a.symbol === 'string' && typeof a.name === 'string' && Number.isFinite(a.price) && a.price > 0 && Number.isFinite(a.marketCap) && a.marketCap > 0 && Number.isFinite(a.volume24h) && Number.isFinite(a.change24h))) throw new Error('The market provider returned incomplete data. Try again shortly.')
      setMarket(data)
      if (!data.stale && Date.now() - Date.parse(data.fetchedAt) <= 120000) award('scan-market')
    } catch (e) { setMarketError(e.name === 'TimeoutError' ? 'The market scan timed out. Please try again.' : e.message || 'Could not reach the market provider.') }
    finally { scanLock.current = false; setScanning(false) }
  }
  function inspect(asset) { setSelected(asset); if (!stale) award('review-opportunity') }
  function toggleWatch(id) { setWatchlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]) }
  function saveLimit(e) {
    e.preventDefault(); const n = Number(limitDraft)
    if (!Number.isFinite(n) || n < 1 || n > 100000) return
    setLimit(n); award('set-risk-limit'); setNotice('Research budget saved. Transactions remain disabled.')
  }

  const questList = <div className="quest-list">{questDefinitions.map((q, i) => {
    const done = player.completed.includes(q.id), active = nextQuest?.id === q.id
    return <button key={q.id} className={`quest-row ${done ? 'done' : ''} ${active ? 'current' : ''}`} disabled={!active} onClick={continueQuest}>
      <span className="quest-node">{done ? <Icon name="check"/> : active ? i + 1 : <Icon name="lock" size={17}/>}</span><span className="quest-copy"><strong>{q.title}</strong><small>{done ? 'Completed' : active ? q.description : 'Complete the previous quest to unlock'}</small></span><span className="quest-reward">+{q.xp} XP<small>+{q.coins} coins</small></span>{active && <Icon name="arrow" size={17}/>}</button>
  })}</div>

  const marketSection = <>
    <div className="section-head"><div><span className="eyebrow">YOUR READ-ONLY MARKET SCOUT</span><h2>{view === 'home' ? 'A little curiosity goes a long way.' : 'Find your next research lead.'}</h2></div><button className="button primary" disabled={scanning} onClick={scan}><Icon name={scanning ? 'refresh' : 'compass'}/>{scanning ? 'Scanning…' : 'Scan market'}</button></div>
    <div className="scanner-disclaimer"><Icon name="shield" size={16}/><span>Public market signals, not earning offers. No trades. No guaranteed returns.</span></div>
    {marketError && <div className="error" role="alert">{marketError} {market ? 'The previous snapshot is still shown below.' : 'No live prices are being displayed.'}</div>}
    {market ? <>
      <div className="market-toolbar"><label className="search"><Icon name="search" size={17}/><input aria-label="Search markets" placeholder="Search assets…" value={query} onChange={e => setQuery(e.target.value)}/></label><div className="segmented"><button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All assets</button><button aria-pressed={filter === 'saved'} onClick={() => setFilter('saved')}>Watchlist ({watchlist.length})</button></div></div>
      <p className="source"><span className={`status-dot ${stale ? 'amber' : ''}`}/>{market.source} · {stale ? 'Stale snapshot — refresh before researching' : 'Recent snapshot'} · {new Date(market.fetchedAt).toLocaleString()}</p>
      <div className="market-grid">{rows.map(a => <button className="market-card" key={a.id} onClick={() => inspect(a)}><span className="market-card-top"><span className={`token-icon token-${a.symbol.toLowerCase()}`}>{a.symbol[0].toUpperCase()}</span><span><strong>{a.name}</strong><small>{a.symbol.toUpperCase()}</small></span><span className={a.change24h >= 0 ? 'positive' : 'negative'}>{a.change24h > 0 ? '+' : ''}{a.change24h.toFixed(2)}%</span></span><span className="market-price">{money(a.price)}</span><span className="market-card-bottom">24h volume ${compact(a.volume24h)}<span>{watchlist.includes(a.id) ? '★ Saved' : 'Research ↗'}</span></span></button>)}</div>
      {!rows.length && <p className="empty-inline">{filter === 'saved' ? 'No matching watchlist assets. Open an asset and save it to start your list.' : 'No assets match your search.'}</p>}
    </> : <div className="scanner-empty"><div className="radar"><span/><Icon name="compass" size={38}/></div><div><h3>The world is moving. Take a look.</h3><p>Scan six established crypto assets for price changes and trading activity. You choose what to research next.</p><small>Live source: CoinGecko · Read-only · No wallet required</small></div></div>}
  </>

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('home') }}><span className="brand-mark">✳</span>faewheel<span className="brand-period">.</span></a><div className="workspace-label">YOUR PERSONAL EXPEDITION</div><nav aria-label="Main navigation">{NAV.map(([id, label, icon]) => <button key={id} className={view === id ? 'nav-item active' : 'nav-item'} aria-current={view === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={icon}/><span>{label}</span>{id === 'quests' && <span className="nav-count">{questDefinitions.length - player.completed.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="scout-card"><span className="scout-icon"><Icon name="compass" size={24}/></span><strong>Your scout, not your trader.</strong><p>Explore signals. Understand risks. Stay in control.</p><span><span className="status-dot"/> Read-only by design</span></div><button className={`nav-item ${view === 'rules' ? 'active' : ''}`} onClick={() => navigate('rules')}><Icon name="shield"/><span>Safety & preferences</span></button><div className="profile"><span className="avatar">E</span><span><strong>Explorer</strong><small>Level {level.level} · Trailblazer</small></span><span className="profile-dot"/></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><span className="breadcrumb">Your expedition <span>/</span> <strong>{NAV.find(n => n[0] === view)?.[1] || 'Safety'}</strong></span><div className="top-stats"><span className="xp-badge">ϟ <strong>{player.xp}</strong> XP</span><span className="coin-badge"><span>◈</span> <strong>{player.coins}</strong> <span className="coin-label">game coins</span></span><span className="demo-badge">BETA · READ-ONLY</span></div></header>
      <main id="main-content"><div className="page-heading"><div><span className="eyebrow">{view === 'home' ? 'GOOD TO HAVE YOU HERE, EXPLORER' : 'EXPLORE WITH INTENTION'}</span><h1>{{home: 'Small steps. Big discoveries.', wallet: 'Your wallet, your control.', discover: 'Follow your curiosity.', quests: 'Every explorer starts somewhere.', activity: 'Your expedition journal.', rules: 'Set your own boundaries.'}[view]}</h1><p>{{home: 'Build your crypto confidence, one quest at a time.', wallet: 'Real balances stay separate from your practice portfolio.', discover: 'Observe the market. Understand the signal. Decide for yourself.', quests: 'Learn by doing. Earn XP and game coins—not promises of profit.', activity: 'A record of your progress. No invented transactions.', rules: 'Your agent can research. Only you can decide what happens next.'}[view]}</p></div></div>
      {storageError && <div className="error" role="alert">Browser storage is unavailable. Your progress will not survive a reload.</div>}
      {view === 'home' && <>
        <section className="hero"><div className="hero-copy"><span className="chapter-label"><span/> CHAPTER 01 · THE FIRST EXPEDITION</span><h2>A world of possibilities.<br/><em>A smarter way to explore.</em></h2><p>Get to know your wallet. Discover market signals.<br/>Make your first moves with knowledge, not guesswork.</p><button className="button primary" onClick={continueQuest}>{nextQuest ? player.completed.length ? 'Continue your quest' : 'Start your adventure' : 'Explore the market'}<Icon name="arrow" size={18}/></button><span className="hero-footnote">Free to explore. No funds needed.</span></div><Island/></section>
        <section className="summary-grid" aria-label="Expedition summary"><button className="summary-card" onClick={() => navigate('wallet')}><span className="summary-top">Practice portfolio <span className="mini-tag">DEMO</span></span><strong>{money(totalValue(demoAssets))}</strong><span className="muted">Sample funds · not spendable <Icon name="arrow" size={15}/></span></button><button className="summary-card" onClick={() => navigate('quests')}><span className="summary-top">Explorer level <Icon name="flag" size={18}/></span><strong>Level {level.level} <small>Trailblazer</small></strong><span className="level-line"><span style={{width: `${level.progressPercent}%`}}/></span><span className="muted">{level.xpIntoLevel} / {level.xpForNextLevel} XP to the next level</span></button><button className="summary-card" onClick={() => navigate('discover')}><span className="summary-top">Your watchlist <Icon name="compass" size={18}/></span><strong>{watchlist.length.toString().padStart(2, '0')} <small>research leads</small></strong><span className="muted">Curiosity is a good starting point <Icon name="arrow" size={15}/></span></button></section>
        <div className="home-columns"><section className="panel quest-panel"><div className="section-head"><div><span className="eyebrow">LEARN. EXPLORE. LEVEL UP.</span><h2>Your first steps</h2></div><span className="muted">{player.completed.length} / {questDefinitions.length}</span></div>{questList}<div className="quest-footer"><Icon name="star" size={16}/> XP and game coins are progress points, not crypto or cash.</div></section><section className="panel field-note"><span className="note-icon"><Icon name="shield" size={28}/></span><span className="eyebrow">THE EXPLORER’S CODE</span><h2>Adventure.<br/>Not autopilot.</h2><p>A good opportunity starts with a good question. Your scout finds signals—you stay in the driver’s seat.</p><button className="text-button" onClick={() => navigate('rules')}>Meet your guardrails <Icon name="arrow" size={17}/></button></section></div>
        <section className="panel market-section">{marketSection}</section>
      </>}
      {view === 'wallet' && <><ConnectedWallet/><section className="panel holdings-panel"><div className="section-head"><div><span className="eyebrow">PRACTICE PORTFOLIO · DEMO ONLY</span><h2>{money(totalValue(demoAssets))}</h2></div><span className="mini-tag">SAMPLE BALANCES</span></div><p className="muted">Static sample data from the attached wallet. These are not your funds, live quotes, or investment recommendations.</p><div className="table-scroll"><table><thead><tr><th>Asset</th><th>Network</th><th>Amount</th><th>Sample price</th><th>Demo value</th></tr></thead><tbody>{demoAssets.map(a => <tr key={a.id}><td><span className="holding-name"><span className={`token-icon token-${a.symbol.toLowerCase()}`}>{a.symbol[0]}</span><span><strong>{a.symbol}</strong><small>{TOKENS[a.symbol]?.name}</small></span></span></td><td>{CHAINS[a.chain]?.name || a.chain}</td><td>{a.amount.toLocaleString(undefined, {maximumFractionDigits: 6})}</td><td>{money(a.price)}</td><td>{money(a.amount * a.price)}</td></tr>)}</tbody></table></div></section><button className="button primary" onClick={continueQuest}>Continue your expedition <Icon name="arrow"/></button></>}
      {view === 'discover' && <section className="panel market-section">{marketSection}</section>}
      {view === 'quests' && <section className="panel path-panel"><div className="section-head"><div><span className="eyebrow">CHAPTER 01</span><h2>The first expedition</h2></div><span className="level-pill">Level {level.level} · {player.xp} XP</span></div>{questList}<div className="risk-note"><Icon name="star"/><p>Each quest can award points once. Game coins cannot be redeemed or withdrawn. There are no real token rewards in this version.</p></div>{!nextQuest && <div className="chapter-complete"><h2>First expedition complete.</h2><p>You’ve explored your wallet, read the market, and set your boundaries. Keep researching at your own pace.</p><button className="button primary" onClick={() => navigate('discover')}>Back to discovery <Icon name="arrow"/></button></div>}</section>}
      {view === 'activity' && <section className="panel"><h2>Milestones, not made-up money.</h2>{!player.completed.length ? <p className="empty-inline">Your journal is waiting for its first chapter. Complete a quest to start.</p> : questDefinitions.filter(q => player.completed.includes(q.id)).map(q => <div className="journal-row" key={q.id}><span className="quest-node"><Icon name="check"/></span><div><strong>{q.title}</strong><p>Quest completed · reward earned once</p></div><span className="positive">+{q.xp} XP · +{q.coins} game coins</span></div>)}<p className="muted">There are no on-chain transactions in this journal. Progress is stored in this browser only.</p></section>}
      {view === 'rules' && <section className="panel settings-panel"><span className="eyebrow">SAFE BY DEFAULT</span><h2>Research first. Permission always.</h2><div className="guardrail"><Icon name="shield"/><div><strong>Read-only wallet access</strong><p>Only public addresses, networks, and native balances are requested. We never ask for your seed phrase or private key.</p></div><span className="mini-tag">ALWAYS ON</span></div><div className="guardrail"><Icon name="lock"/><div><strong>No autonomous transactions</strong><p>Sending, swapping, bridging, and signing are disabled. Game progress does not authorize spending.</p></div><span className="mini-tag">LOCKED</span></div><form onSubmit={saveLimit}><label htmlFor="limit">Personal research budget (USD)</label><p className="muted">A planning preference for this browser, not an on-chain spending control. Only consider funds you can afford to lose.</p><div className="budget-input"><span>$</span><input id="limit" type="number" min="1" max="100000" step="0.01" required value={limitDraft} onChange={e => setLimitDraft(e.target.value)}/><button className="button primary" type="submit">Save preference</button></div><small className="muted">Saved preference: {money(limit)} · No funds will move.</small></form></section>}
      <footer className="page-footer"><span>faewheel <span>·</span> An adventure in understanding.</span><span>No guaranteed earnings. Your keys stay yours.</span></footer></main>
    </div>{selected && <Detail asset={selected} onClose={() => setSelected(null)} saved={watchlist.includes(selected.id)} onSave={() => toggleWatch(selected.id)}/>}<div className={`toast ${notice ? 'visible' : ''}`} role="status">{notice}</div>
  </div>
}
