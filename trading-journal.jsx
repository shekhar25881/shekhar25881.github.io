import { useState, useMemo } from "react";

const INITIAL_TRADES = [];

const SETUP_TYPES = [
  "VCP (Volatility Contraction Pattern)",
  "Breakout from Base",
  "Power Trend",
  "Pocket Pivot",
  "Follow-Through Day",
  "Base on Base",
  "Cup with Handle",
  "Flat Base",
  "Other",
];

const MARKET_CONDITIONS = ["Uptrend", "Confirmed Uptrend", "Uptrend Under Pressure", "Downtrend", "Mixed"];
const TRADE_STATUS = ["Open", "Closed - Winner", "Closed - Loser", "Stopped Out", "Scratched"];
const SECTORS = ["Technology", "Healthcare", "Financials", "Energy", "Consumer Discretionary", "Industrials", "Materials", "Utilities", "Real Estate", "Communication Services", "Consumer Staples"];

const emptyTrade = {
  id: null, date: "", ticker: "", sector: "",
  setupType: "", marketCondition: "",
  entryPrice: "", stopLoss: "", target1: "", target2: "",
  shares: "", positionSize: "",
  riskReward: "", riskPercent: "",
  epsGrowth: "", revGrowth: "", rsRating: "",
  adv: "", floatShares: "",
  notes: "", status: "Open",
  exitPrice: "", exitDate: "", pnl: "", pnlPercent: "",
};

function calcRR(entry, stop, target) {
  const e = parseFloat(entry), s = parseFloat(stop), t = parseFloat(target);
  if (!e || !s || !t || e === s) return "";
  return ((t - e) / (e - s)).toFixed(2);
}

function calcRisk(entry, stop, shares) {
  const e = parseFloat(entry), s = parseFloat(stop), sh = parseFloat(shares);
  if (!e || !s || !sh) return "";
  return ((e - s) * sh).toFixed(2);
}

function calcPnl(entry, exit, shares) {
  const e = parseFloat(entry), x = parseFloat(exit), sh = parseFloat(shares);
  if (!e || !x || !sh) return "";
  return ((x - e) * sh).toFixed(2);
}

export default function TradingJournal() {
  const [trades, setTrades] = useState(INITIAL_TRADES);
  const [form, setForm] = useState(emptyTrade);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("dashboard"); // dashboard | log | add | detail
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-calc R:R
      if (["entryPrice", "stopLoss", "target1"].includes(field)) {
        next.riskReward = calcRR(next.entryPrice, next.stopLoss, next.target1);
      }
      if (["entryPrice", "stopLoss", "shares"].includes(field)) {
        const r = calcRisk(next.entryPrice, next.stopLoss, next.shares);
        next.positionSize = r;
        // risk %
        const totalPortfolio = 100000; // placeholder
        if (r) next.riskPercent = ((parseFloat(r) / totalPortfolio) * 100).toFixed(2);
      }
      if (["entryPrice", "exitPrice", "shares"].includes(field)) {
        next.pnl = calcPnl(next.entryPrice, next.exitPrice, next.shares);
        const e = parseFloat(next.entryPrice), x = parseFloat(next.exitPrice);
        if (e && x) next.pnlPercent = (((x - e) / e) * 100).toFixed(2);
      }
      return next;
    });
  };

  const saveTrade = () => {
    if (!form.ticker || !form.date) return;
    if (editing !== null) {
      setTrades(t => t.map(tr => tr.id === editing ? { ...form, id: editing } : tr));
      setEditing(null);
    } else {
      setTrades(t => [...t, { ...form, id: Date.now() }]);
    }
    setForm(emptyTrade);
    setView("log");
  };

  const deleteTrade = (id) => setTrades(t => t.filter(tr => tr.id !== id));

  const editTrade = (trade) => {
    setForm(trade);
    setEditing(trade.id);
    setView("add");
  };

  const stats = useMemo(() => {
    const closed = trades.filter(t => t.status !== "Open" && t.pnl);
    const winners = closed.filter(t => parseFloat(t.pnl) > 0);
    const losers = closed.filter(t => parseFloat(t.pnl) <= 0);
    const totalPnl = closed.reduce((s, t) => s + parseFloat(t.pnl || 0), 0);
    const winRate = closed.length ? ((winners.length / closed.length) * 100).toFixed(1) : 0;
    const avgWin = winners.length ? (winners.reduce((s, t) => s + parseFloat(t.pnl), 0) / winners.length).toFixed(2) : 0;
    const avgLoss = losers.length ? (losers.reduce((s, t) => s + parseFloat(t.pnl), 0) / losers.length).toFixed(2) : 0;
    const expectancy = closed.length ? ((winners.length / closed.length * parseFloat(avgWin)) + (losers.length / closed.length * parseFloat(avgLoss))).toFixed(2) : 0;
    return { totalPnl, winRate, avgWin, avgLoss, expectancy, totalTrades: trades.length, closedTrades: closed.length };
  }, [trades]);

  const filteredTrades = filterStatus === "All" ? trades : trades.filter(t => t.status === filterStatus);

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", background: "#0a0b0e", minHeight: "100vh", color: "#e8e4d9" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0b0e; } ::-webkit-scrollbar-thumb { background: #2a2d35; }
        input, select, textarea { background: #111318; border: 1px solid #1e2128; color: #e8e4d9; padding: 8px 12px; font-family: inherit; font-size: 12px; border-radius: 2px; width: 100%; outline: none; transition: border-color .2s; }
        input:focus, select:focus, textarea:focus { border-color: #c9a84c; }
        select option { background: #111318; }
        .btn { cursor: pointer; border: none; font-family: "'Bebas Neue', sans-serif"; letter-spacing: 1px; transition: all .15s; }
        .btn-primary { background: #c9a84c; color: #0a0b0e; padding: 9px 20px; font-size: 13px; font-weight: 600; }
        .btn-primary:hover { background: #e0c060; }
        .btn-ghost { background: transparent; color: #c9a84c; padding: 9px 20px; font-size: 12px; border: 1px solid #c9a84c22; }
        .btn-ghost:hover { border-color: #c9a84c; background: #c9a84c11; }
        .btn-danger { background: transparent; color: #e05555; padding: 6px 12px; font-size: 11px; border: 1px solid #e0555522; }
        .btn-danger:hover { background: #e0555511; border-color: #e05555; }
        .card { background: #111318; border: 1px solid #1e2128; border-radius: 3px; padding: 20px; }
        .label { font-size: 10px; color: #5a5f6e; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 5px; }
        .tag { display: inline-block; padding: 3px 8px; font-size: 10px; border-radius: 2px; letter-spacing: .8px; }
        .tag-open { background: #1a2a1a; color: #4caf50; border: 1px solid #4caf5033; }
        .tag-win { background: #1a2a1a; color: #4caf50; border: 1px solid #4caf5033; }
        .tag-loss { background: #2a1a1a; color: #e05555; border: 1px solid #e0555533; }
        .tag-stopped { background: #2a1a1a; color: #e05555; border: 1px solid #e0555533; }
        .tag-scratched { background: #2a1e10; color: #c9a84c; border: 1px solid #c9a84c33; }
        .row { display: flex; gap: 12px; flex-wrap: wrap; }
        .col { flex: 1; min-width: 140px; }
        .col2 { flex: 2; min-width: 200px; }
        .stat-card { background: #111318; border: 1px solid #1e2128; padding: 18px 22px; border-radius: 3px; }
        .divider { border: none; border-top: 1px solid #1e2128; margin: 20px 0; }
        .trade-row { display: grid; grid-template-columns: 90px 80px 1fr 110px 80px 80px 80px 80px 90px 90px; gap: 1px; background: #1e2128; padding: 0; border-bottom: 1px solid #1e2128; }
        .trade-row > div { background: #0d0e12; padding: 10px 12px; font-size: 11px; display: flex; align-items: center; }
        .trade-row:hover > div { background: #111318; }
        .trade-head { color: #5a5f6e; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }
        .pnl-pos { color: #4caf50; }
        .pnl-neg { color: #e05555; }
        .section-title { font-family: 'Bebas Neue', cursive; font-size: 22px; letter-spacing: 2px; color: #c9a84c; margin-bottom: 16px; }
        .nav-item { cursor: pointer; padding: 10px 16px; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #5a5f6e; transition: color .15s; border-bottom: 2px solid transparent; }
        .nav-item:hover { color: #c9a84c; }
        .nav-item.active { color: #c9a84c; border-bottom-color: #c9a84c; }
        .minervini-badge { font-family: 'Bebas Neue', cursive; font-size: 11px; letter-spacing: 3px; color: #c9a84c55; padding: 4px 8px; border: 1px solid #c9a84c22; }
        textarea { resize: vertical; min-height: 70px; }
        .form-section { margin-bottom: 22px; }
        .form-section-title { font-size: 10px; color: #c9a84c88; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #1e2128; }
        @media (max-width: 700px) { .trade-row { grid-template-columns: 80px 70px 1fr 80px 70px; } }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e2128", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, letterSpacing: 4, color: "#c9a84c", lineHeight: 1 }}>TRADE JOURNAL</div>
            <div style={{ fontSize: 9, color: "#5a5f6e", letterSpacing: 3, marginTop: 2 }}>MINERVINI METHODOLOGY</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {["dashboard", "log", "add"].map(v => (
            <div key={v} className={`nav-item ${view === v ? "active" : ""}`} onClick={() => { setView(v); if (v === "add") { setForm(emptyTrade); setEditing(null); } }}>
              {v === "add" ? "+ New Trade" : v.charAt(0).toUpperCase() + v.slice(1)}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px", maxWidth: 1300, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <div className="section-title">Performance Dashboard</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
              {[
                { label: "Total P&L", value: `$${parseFloat(stats.totalPnl).toFixed(2)}`, color: stats.totalPnl >= 0 ? "#4caf50" : "#e05555" },
                { label: "Win Rate", value: `${stats.winRate}%`, color: "#c9a84c" },
                { label: "Avg Winner", value: `$${stats.avgWin}`, color: "#4caf50" },
                { label: "Avg Loser", value: `$${stats.avgLoss}`, color: "#e05555" },
                { label: "Expectancy", value: `$${stats.expectancy}`, color: parseFloat(stats.expectancy) >= 0 ? "#4caf50" : "#e05555" },
                { label: "Total Trades", value: stats.totalTrades, color: "#e8e4d9" },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="label">{s.label}</div>
                  <div style={{ fontSize: 24, fontFamily: "'Bebas Neue', cursive", letterSpacing: 1, color: s.color, marginTop: 4 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Minervini Principles */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="form-section-title" style={{ marginBottom: 14 }}>Minervini's SEPA Checklist</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                {[
                  "Price above 150 & 200-day MA",
                  "150-day MA above 200-day MA",
                  "200-day MA trending up ≥1 month",
                  "50-day MA above 150 & 200-day MA",
                  "Price above 50-day MA",
                  "Price at least 30% above 52-week low",
                  "Price within 25% of 52-week high",
                  "RS Rating ≥ 70 (IBD)",
                  "EPS growth ≥ 25% YoY",
                  "Revenue growth ≥ 25% YoY",
                  "VCP structure confirmed",
                  "Volume contraction on pullbacks",
                ].map((rule, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#0d0e12", borderRadius: 2, fontSize: 11, color: "#8a8f9e" }}>
                    <span style={{ color: "#c9a84c", fontSize: 10 }}>◆</span> {rule}
                  </div>
                ))}
              </div>
            </div>

            {trades.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#2a2d35" }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, letterSpacing: 4 }}>No Trades Logged</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>Click "New Trade" to begin your journal</div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setView("add")}>+ Log First Trade</button>
              </div>
            )}
          </div>
        )}

        {/* TRADE LOG */}
        {view === "log" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div className="section-title" style={{ margin: 0 }}>Trade Log</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "auto", minWidth: 150 }}>
                  <option>All</option>
                  {TRADE_STATUS.map(s => <option key={s}>{s}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => { setForm(emptyTrade); setEditing(null); setView("add"); }}>+ New Trade</button>
              </div>
            </div>

            {filteredTrades.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#2a2d35", fontSize: 13 }}>No trades found</div>
            ) : (
              <div style={{ overflow: "auto" }}>
                <div className="trade-row trade-head" style={{ background: "transparent" }}>
                  <div style={{ background: "#0a0b0e" }}>Date</div>
                  <div style={{ background: "#0a0b0e" }}>Ticker</div>
                  <div style={{ background: "#0a0b0e" }}>Setup</div>
                  <div style={{ background: "#0a0b0e" }}>Entry</div>
                  <div style={{ background: "#0a0b0e" }}>Stop</div>
                  <div style={{ background: "#0a0b0e" }}>Target</div>
                  <div style={{ background: "#0a0b0e" }}>R:R</div>
                  <div style={{ background: "#0a0b0e" }}>P&L</div>
                  <div style={{ background: "#0a0b0e" }}>Status</div>
                  <div style={{ background: "#0a0b0e" }}>Actions</div>
                </div>
                {filteredTrades.map(trade => {
                  const tagClass = trade.status === "Open" ? "tag-open" : trade.status.includes("Winner") ? "tag-win" : trade.status === "Scratched" ? "tag-scratched" : "tag-loss";
                  const pnlVal = parseFloat(trade.pnl || 0);
                  return (
                    <div className="trade-row" key={trade.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedTrade(trade); setView("detail"); }}>
                      <div>{trade.date}</div>
                      <div style={{ fontWeight: 500, color: "#c9a84c" }}>{trade.ticker}</div>
                      <div style={{ color: "#8a8f9e", fontSize: 10 }}>{trade.setupType?.split("(")[0]}</div>
                      <div>${parseFloat(trade.entryPrice || 0).toFixed(2)}</div>
                      <div style={{ color: "#e05555" }}>${parseFloat(trade.stopLoss || 0).toFixed(2)}</div>
                      <div style={{ color: "#4caf50" }}>${parseFloat(trade.target1 || 0).toFixed(2)}</div>
                      <div style={{ color: "#c9a84c" }}>{trade.riskReward ? `${trade.riskReward}R` : "—"}</div>
                      <div className={pnlVal > 0 ? "pnl-pos" : pnlVal < 0 ? "pnl-neg" : ""}>{trade.pnl ? `$${pnlVal.toFixed(2)}` : "—"}</div>
                      <div onClick={e => e.stopPropagation()}>
                        <span className={`tag ${tagClass}`}>{trade.status?.split(" - ")[1] || trade.status}</span>
                      </div>
                      <div style={{ gap: 6, display: "flex" }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 10 }} onClick={() => editTrade(trade)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => deleteTrade(trade.id)}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ADD / EDIT TRADE */}
        {view === "add" && (
          <div>
            <div className="section-title">{editing ? "Edit Trade" : "Log New Trade"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Left Column */}
              <div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="form-section-title">Trade Setup</div>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <div className="col">
                      <div className="label">Date</div>
                      <input type="date" value={form.date} onChange={e => handleChange("date", e.target.value)} />
                    </div>
                    <div className="col">
                      <div className="label">Ticker Symbol</div>
                      <input placeholder="AAPL" value={form.ticker} onChange={e => handleChange("ticker", e.target.value.toUpperCase())} />
                    </div>
                  </div>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <div className="col">
                      <div className="label">Sector</div>
                      <select value={form.sector} onChange={e => handleChange("sector", e.target.value)}>
                        <option value="">Select...</option>
                        {SECTORS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col">
                      <div className="label">Market Condition</div>
                      <select value={form.marketCondition} onChange={e => handleChange("marketCondition", e.target.value)}>
                        <option value="">Select...</option>
                        {MARKET_CONDITIONS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div className="label">Setup Type (Minervini Pattern)</div>
                    <select value={form.setupType} onChange={e => handleChange("setupType", e.target.value)}>
                      <option value="">Select...</option>
                      {SETUP_TYPES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="form-section-title">Entry & Risk Parameters</div>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <div className="col">
                      <div className="label">Entry Price ($)</div>
                      <input type="number" step="0.01" placeholder="0.00" value={form.entryPrice} onChange={e => handleChange("entryPrice", e.target.value)} />
                    </div>
                    <div className="col">
                      <div className="label">Stop Loss ($)</div>
                      <input type="number" step="0.01" placeholder="0.00" value={form.stopLoss} onChange={e => handleChange("stopLoss", e.target.value)} />
                    </div>
                  </div>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <div className="col">
                      <div className="label">Target 1 ($)</div>
                      <input type="number" step="0.01" placeholder="0.00" value={form.target1} onChange={e => handleChange("target1", e.target.value)} />
                    </div>
                    <div className="col">
                      <div className="label">Target 2 ($)</div>
                      <input type="number" step="0.01" placeholder="0.00" value={form.target2} onChange={e => handleChange("target2", e.target.value)} />
                    </div>
                  </div>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <div className="col">
                      <div className="label">Shares</div>
                      <input type="number" placeholder="0" value={form.shares} onChange={e => handleChange("shares", e.target.value)} />
                    </div>
                    <div className="col">
                      <div className="label">Risk $ (auto)</div>
                      <input readOnly value={form.positionSize ? `$${form.positionSize}` : ""} style={{ color: "#e05555" }} placeholder="Auto-calc" />
                    </div>
                  </div>
                  {/* Auto-calc display */}
                  {form.riskReward && (
                    <div style={{ background: "#0d0e12", padding: "12px 14px", borderRadius: 2, display: "flex", gap: 24 }}>
                      <div>
                        <div className="label">Risk:Reward</div>
                        <div style={{ color: "#c9a84c", fontSize: 18, fontFamily: "'Bebas Neue', cursive", letterSpacing: 1 }}>1 : {form.riskReward}R</div>
                      </div>
                      {form.riskPercent && (
                        <div>
                          <div className="label">% Risk (of $100k)</div>
                          <div style={{ color: parseFloat(form.riskPercent) > 2 ? "#e05555" : "#4caf50", fontSize: 18, fontFamily: "'Bebas Neue', cursive" }}>{form.riskPercent}%</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="form-section-title">Fundamental Criteria (SEPA)</div>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <div className="col">
                      <div className="label">EPS Growth %</div>
                      <input type="number" placeholder="≥25%" value={form.epsGrowth} onChange={e => handleChange("epsGrowth", e.target.value)} />
                    </div>
                    <div className="col">
                      <div className="label">Revenue Growth %</div>
                      <input type="number" placeholder="≥25%" value={form.revGrowth} onChange={e => handleChange("revGrowth", e.target.value)} />
                    </div>
                  </div>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <div className="col">
                      <div className="label">RS Rating (IBD)</div>
                      <input type="number" placeholder="≥70" value={form.rsRating} onChange={e => handleChange("rsRating", e.target.value)} />
                    </div>
                    <div className="col">
                      <div className="label">Avg Daily Volume</div>
                      <input placeholder="e.g. 1.2M" value={form.adv} onChange={e => handleChange("adv", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <div className="label">Float (shares)</div>
                    <input placeholder="e.g. 50M" value={form.floatShares} onChange={e => handleChange("floatShares", e.target.value)} />
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="form-section-title">Exit & Result</div>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <div className="col">
                      <div className="label">Exit Date</div>
                      <input type="date" value={form.exitDate} onChange={e => handleChange("exitDate", e.target.value)} />
                    </div>
                    <div className="col">
                      <div className="label">Exit Price ($)</div>
                      <input type="number" step="0.01" placeholder="0.00" value={form.exitPrice} onChange={e => handleChange("exitPrice", e.target.value)} />
                    </div>
                  </div>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <div className="col">
                      <div className="label">P&L $ (auto)</div>
                      <input readOnly value={form.pnl ? `$${parseFloat(form.pnl).toFixed(2)}` : ""} style={{ color: parseFloat(form.pnl) >= 0 ? "#4caf50" : "#e05555" }} placeholder="Auto-calc" />
                    </div>
                    <div className="col">
                      <div className="label">P&L % (auto)</div>
                      <input readOnly value={form.pnlPercent ? `${form.pnlPercent}%` : ""} style={{ color: parseFloat(form.pnlPercent) >= 0 ? "#4caf50" : "#e05555" }} placeholder="Auto-calc" />
                    </div>
                  </div>
                  <div>
                    <div className="label">Trade Status</div>
                    <select value={form.status} onChange={e => handleChange("status", e.target.value)}>
                      {TRADE_STATUS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="card">
                  <div className="form-section-title">Trade Notes & Thesis</div>
                  <textarea placeholder="Why did you take this trade? What was the catalyst? VCP tightness? Volume analysis? Note your reasoning, emotions, and lessons learned..." value={form.notes} onChange={e => handleChange("notes", e.target.value)} style={{ minHeight: 90 }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => { setForm(emptyTrade); setEditing(null); setView("log"); }}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTrade}>{editing ? "Update Trade" : "Save Trade"}</button>
            </div>
          </div>
        )}

        {/* TRADE DETAIL */}
        {view === "detail" && selectedTrade && (
          <div>
            <button className="btn btn-ghost" style={{ marginBottom: 20 }} onClick={() => setView("log")}>← Back to Log</button>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 40, letterSpacing: 3, color: "#c9a84c" }}>{selectedTrade.ticker}</div>
              <span className={`tag tag-${selectedTrade.status === "Open" ? "open" : selectedTrade.status.includes("Winner") ? "win" : selectedTrade.status === "Scratched" ? "scratched" : "loss"}`}>{selectedTrade.status}</span>
              <span style={{ color: "#5a5f6e", fontSize: 12 }}>{selectedTrade.date}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {[
                { label: "Entry Price", value: `$${parseFloat(selectedTrade.entryPrice || 0).toFixed(2)}`, color: "#e8e4d9" },
                { label: "Stop Loss", value: `$${parseFloat(selectedTrade.stopLoss || 0).toFixed(2)}`, color: "#e05555" },
                { label: "Target 1", value: `$${parseFloat(selectedTrade.target1 || 0).toFixed(2)}`, color: "#4caf50" },
                { label: "Risk:Reward", value: selectedTrade.riskReward ? `1:${selectedTrade.riskReward}R` : "—", color: "#c9a84c" },
                { label: "Shares", value: selectedTrade.shares || "—", color: "#e8e4d9" },
                { label: "Risk $", value: selectedTrade.positionSize ? `$${selectedTrade.positionSize}` : "—", color: "#e05555" },
                { label: "P&L", value: selectedTrade.pnl ? `$${parseFloat(selectedTrade.pnl).toFixed(2)}` : "—", color: parseFloat(selectedTrade.pnl) >= 0 ? "#4caf50" : "#e05555" },
                { label: "P&L %", value: selectedTrade.pnlPercent ? `${selectedTrade.pnlPercent}%` : "—", color: parseFloat(selectedTrade.pnlPercent) >= 0 ? "#4caf50" : "#e05555" },
                { label: "Setup", value: selectedTrade.setupType?.split("(")[0] || "—", color: "#e8e4d9" },
                { label: "EPS Growth", value: selectedTrade.epsGrowth ? `${selectedTrade.epsGrowth}%` : "—", color: parseFloat(selectedTrade.epsGrowth) >= 25 ? "#4caf50" : "#e05555" },
                { label: "Rev Growth", value: selectedTrade.revGrowth ? `${selectedTrade.revGrowth}%` : "—", color: parseFloat(selectedTrade.revGrowth) >= 25 ? "#4caf50" : "#e05555" },
                { label: "RS Rating", value: selectedTrade.rsRating || "—", color: parseFloat(selectedTrade.rsRating) >= 70 ? "#4caf50" : "#e05555" },
              ].map(item => (
                <div className="stat-card" key={item.label}>
                  <div className="label">{item.label}</div>
                  <div style={{ color: item.color, fontSize: 20, fontFamily: "'Bebas Neue', cursive", letterSpacing: 1, marginTop: 4 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {selectedTrade.notes && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="form-section-title">Trade Notes</div>
                <div style={{ fontSize: 12, color: "#8a8f9e", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selectedTrade.notes}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" onClick={() => editTrade(selectedTrade)}>Edit Trade</button>
              <button className="btn btn-danger" style={{ padding: "9px 20px" }} onClick={() => { deleteTrade(selectedTrade.id); setView("log"); }}>Delete Trade</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
