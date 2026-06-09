/* global React, ReactDOM */
const { useState } = React;

const STAGES = [
  { id: "found", label: "Found it", color: "var(--tx-3)" },
  { id: "interested", label: "Interested", color: "var(--accent)" },
  { id: "in_progress", label: "In progress", color: "var(--warn)" },
  { id: "submitted", label: "Submitted", color: "oklch(0.72 0.13 230)" },
  { id: "response", label: "Got response", color: "var(--good)" },
];

const VIEWS = [
  { id: "board", label: "Board", icon: "board", group: "Tracker" },
  { id: "calendar", label: "Calendar", icon: "cal", group: "Tracker" },
  { id: "gallery", label: "Gallery", icon: "grid", group: "Tracker" },
  { id: "discover", label: "Discover", icon: "compass", group: "AI" },
  { id: "assistant", label: "Assistant", icon: "message", group: "AI" },
];

const VIEW_TITLE = {
  board: { t: "Pipeline", s: "Drag opportunities between stages" },
  calendar: { t: "Timeline", s: "Everything by deadline" },
  gallery: { t: "All opportunities", s: "Your full tracked library" },
  discover: { t: "Discover", s: "Suggested · confirm to track" },
  assistant: { t: "Assistant", s: "Find, organize, and draft with Coda" },
};

function Icon({ name, size = 18, stroke = "currentColor", sw = 1.9, fill = "none", style }) {
  const p = { fill, stroke, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    search: <g {...p}><circle cx="8" cy="8" r="5.2" /><path d="M12.5 12.5 L17 17" /></g>,
    plus: <g {...p}><path d="M10 4 V16 M4 10 H16" /></g>,
    board: <g {...p}><rect x="3" y="4" width="4.4" height="12" rx="1" /><rect x="9.3" y="4" width="4.4" height="8" rx="1" /><rect x="15.6" y="4" width="2" height="12" rx="1" /></g>,
    cal: <g {...p}><rect x="3.2" y="4.5" width="13.6" height="12" rx="1.6" /><path d="M3.2 8 H16.8 M7 3 V6 M13 3 V6" /></g>,
    grid: <g {...p}><rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" /><rect x="11" y="3.5" width="5.5" height="5.5" rx="1" /><rect x="3.5" y="11" width="5.5" height="5.5" rx="1" /><rect x="11" y="11" width="5.5" height="5.5" rx="1" /></g>,
    compass: <g {...p}><circle cx="10" cy="10" r="7" /><path d="M13.2 6.8 L8.4 8.4 L6.8 13.2 L11.6 11.6 Z" /></g>,
    message: <g {...p}><path d="M4 4.5 H16 V13 H9 L5.5 16 V13 H4 Z" /></g>,
    bell: <g {...p}><path d="M6 9 a4 4 0 0 1 8 0 c0 3 1 4 1.5 4.7 H4.5 C5 13 6 12 6 9 Z M8.5 16 a1.6 1.6 0 0 0 3 0" /></g>,
    settings: <g {...p}><circle cx="10" cy="10" r="2.4" /><path d="M10 3 V5 M10 15 V17 M3 10 H5 M15 10 H17 M5.2 5.2 L6.6 6.6 M13.4 13.4 L14.8 14.8 M14.8 5.2 L13.4 6.6 M6.6 13.4 L5.2 14.8" /></g>,
    doc: <g {...p}><path d="M5.5 3.5 H12 L15 6.5 V16.5 H5.5 Z M12 3.5 V6.5 H15 M7.5 10 H12.5 M7.5 13 H12.5" /></g>,
    sparkle: <g {...p}><path d="M10 3 C10.5 7 11 8 15 9 C11 10 10.5 11 10 15 C9.5 11 9 10 5 9 C9 8 9.5 7 10 3 Z" /><path d="M15.5 3.5 l0.5 1.6 1.6 0.5 -1.6 0.5 -0.5 1.6 -0.5 -1.6 -1.6 -0.5 1.6 -0.5 z" /></g>,
    coda: <g {...p}><circle cx="10" cy="10" r="5" /><path d="M10 2.4 V17.6 M2.4 10 H17.6" /></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 20 20" style={{ flex: "none", ...style }}>{paths[name] || null}</svg>;
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="row gap10 between"
      style={{ width: "100%", textAlign: "left", cursor: "pointer", padding: "9px 11px", borderRadius: 10,
        background: active ? "var(--surface-2)" : "transparent",
        border: "1px solid " + (active ? "var(--border)" : "transparent"),
        color: active ? "var(--tx)" : "var(--tx-2)", transition: "background .12s, color .12s" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-2)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <span className="row gap10">
        <Icon name={icon} size={17} stroke={active ? "var(--accent-bright)" : "var(--tx-3)"} sw={1.8} />
        <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 500 }}>{label}</span>
      </span>
    </button>
  );
}

function Sidebar({ view, setView }) {
  const tracker = VIEWS.filter((v) => v.group === "Tracker");
  const ai = VIEWS.filter((v) => v.group === "AI");
  return (
    <aside className="col" style={{ width: 240, flex: "none", borderRight: "1px solid var(--border)",
      background: "var(--bg)", padding: "18px 14px 14px" }}>
      <div className="row" style={{ padding: "2px 6px 24px", alignItems: "center" }}>
        <span className="disp" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em",
          display: "inline-flex", alignItems: "center", lineHeight: 1 }}>
          C<Icon name="coda" size={18} stroke="var(--accent-bright)" sw={2} style={{ margin: "0 -0.5px" }} />da
        </span>
      </div>

      <div className="label" style={{ padding: "0 8px 8px" }}>Tracker</div>
      <div className="col gap2" style={{ gap: 2 }}>
        {tracker.map((v) => <NavItem key={v.id} {...v} active={view === v.id} onClick={() => setView(v.id)} />)}
      </div>

      <div className="hr" style={{ margin: "14px 6px" }} />

      <div className="col gap2" style={{ gap: 2 }}>
        {ai.map((v) => <NavItem key={v.id} {...v} active={view === v.id} onClick={() => setView(v.id)} />)}
      </div>

      <div className="grow" />

      <div className="row gap10" style={{ padding: "6px 6px 0" }}>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface-3)", border: "1px solid var(--border-2)", display: "grid", placeItems: "center" }} />
        <div className="col grow" style={{ gap: 5 }}>
          <span style={{ width: 84, height: 9, borderRadius: 6, background: "var(--surface-3)", display: "block" }} />
          <span style={{ width: 46, height: 7, borderRadius: 6, background: "var(--surface-2)", display: "block" }} />
        </div>
        <Icon name="settings" size={16} stroke="var(--tx-4)" />
      </div>
    </aside>
  );
}

function Header({ view }) {
  const vt = VIEW_TITLE[view];
  return (
    <header className="row between" style={{ padding: "16px 28px 14px", flex: "none", borderBottom: "1px solid var(--border)" }}>
      <div className="col" style={{ gap: 3 }}>
        <div className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{vt.t}</div>
        <div className="tx3" style={{ fontSize: 12.5 }}>0 tracked · {vt.s}</div>
      </div>
      <div className="row gap10">
        <div className="row gap8" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", width: 180 }}>
          <Icon name="search" size={15} stroke="var(--tx-4)" />
          <input className="input" placeholder="Search…" style={{ border: "none", background: "transparent", padding: 0, fontSize: 13 }} />
        </div>
        <button className="btn ghost" style={{ padding: 9 }}><Icon name="bell" size={17} /></button>
        <button className="btn primary"><Icon name="plus" size={15} stroke="#fff" /> Add</button>
      </div>
    </header>
  );
}

function Board() {
  return (
    <div className="row gap14 astart" style={{ padding: "8px 28px 28px", overflowX: "auto", height: "100%", alignItems: "stretch" }}>
      {STAGES.map((st) => (
        <div key={st.id} className="col" style={{ width: 280, flex: "none" }}>
          <div className="row gap8" style={{ padding: "2px 6px 12px", flex: "none" }}>
            <span style={{ width: 8, height: 8, borderRadius: 3, flex: "none", background: st.color, boxShadow: `0 0 10px -1px ${st.color}` }} />
            <span className="disp" style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>{st.label}</span>
            <span className="mono tx4" style={{ fontSize: 12 }}>0</span>
          </div>
          <div className="card col gap10" style={{ padding: 10, flex: 1, minHeight: 140, background: "var(--bg-2)", borderColor: "var(--hairline)" }}>
            <div className="col center" style={{ alignItems: "center", padding: "26px 6px", gap: 8 }}>
              <span className="label">drop here</span>
              <button className="btn sm ghost"><Icon name="plus" size={13} /> Add</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyView({ view }) {
  const empty = {
    calendar: ["No deadlines yet", "Add an opportunity and Coda will build your timeline."],
    gallery: ["No opportunities yet", "Your tracked library will appear here."],
    discover: ["Discover queue is empty", "Suggested matches will land here for review."],
    assistant: ["Ask Coda anything", "Search for opportunities, extract requirements, or draft materials."],
  }[view];
  return (
    <div className="fade" style={{ height: "100%", display: "grid", placeItems: "center", padding: 28 }}>
      <div className="card" style={{ width: "min(520px, 100%)", padding: 36, textAlign: "center" }}>
        <Icon name={view === "assistant" ? "message" : view === "discover" ? "sparkle" : "doc"} size={28} stroke="var(--accent-bright)" />
        <div className="disp" style={{ fontSize: 18, fontWeight: 600, marginTop: 14 }}>{empty[0]}</div>
        <div className="tx3" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>{empty[1]}</div>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState("board");
  return (
    <div className="row" style={{ height: "100vh", overflow: "hidden", alignItems: "stretch" }}>
      <Sidebar view={view} setView={setView} />
      <main className="col grow" style={{ height: "100%", minWidth: 0 }}>
        <Header view={view} />
        <div className="grow" style={{ minHeight: 0 }}>
          {view === "board" ? <Board /> : <EmptyView view={view} />}
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
