/* global React, ReactDOM */
const { useState } = React;

const STAGES = [
  { id: "found", label: "Found it", color: "var(--tx-3)" },
  { id: "interested", label: "Interested", color: "var(--accent)" },
  { id: "in_progress", label: "In progress", color: "var(--warn)" },
  { id: "submitted", label: "Submitted", color: "oklch(0.72 0.13 230)" },
  { id: "response", label: "Got response", color: "var(--good)" },
];

const NAV = [
  { id: "board", label: "Board", icon: "▦" },
  { id: "calendar", label: "Calendar", icon: "◷" },
  { id: "gallery", label: "Gallery", icon: "▧" },
  { id: "discover", label: "Discover", icon: "✦", group: "ai" },
  { id: "assistant", label: "Assistant", icon: "◌", group: "ai" },
];

const TITLES = {
  board: ["Pipeline", "0 tracked · Drag opportunities between stages"],
  calendar: ["Timeline", "No deadlines yet"],
  gallery: ["All opportunities", "Your tracked library is empty"],
  discover: ["Discover", "Suggested opportunities will appear here"],
  assistant: ["Assistant", "Ask Coda to find, organize, or draft"],
};

function NavItem({ item, active, onClick }) {
  return (
    <button className={"nav-item row gap10 between" + (active ? " active" : "")} onClick={onClick}>
      <span className="row gap10">
        <span className="nav-icon">{item.icon}</span>
        <span>{item.label}</span>
      </span>
    </button>
  );
}

function Sidebar({ view, setView }) {
  const tracker = NAV.filter((n) => !n.group);
  const ai = NAV.filter((n) => n.group === "ai");

  return (
    <aside className="sidebar col">
      <div className="logo">C<span className="logo-mark">○</span>da</div>

      <div className="label" style={{ padding: "0 8px 8px" }}>Tracker</div>
      <div className="col gap6">
        {tracker.map((item) => <NavItem key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />)}
      </div>

      <div className="hr" />

      <div className="col gap6">
        {ai.map((item) => <NavItem key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />)}
      </div>

      <div className="grow" />

      <div className="row gap10" style={{ padding: "6px 6px 0" }}>
        <span className="skeleton-avatar" />
        <div className="col grow" style={{ gap: 5 }}>
          <span className="skeleton-line" style={{ width: 84 }} />
          <span className="skeleton-line" style={{ width: 46, height: 7, background: "var(--surface-2)" }} />
        </div>
        <span className="nav-icon">⚙</span>
      </div>
    </aside>
  );
}

function Topbar({ view }) {
  const [title, subtitle] = TITLES[view];
  return (
    <header className="topbar row between">
      <div className="col">
        <div className="title">{title}</div>
        <div className="subtitle">{subtitle}</div>
      </div>
      <div className="row gap10">
        <div className="search row gap8">
          <span className="nav-icon">⌕</span>
          <input placeholder="Search…" />
        </div>
        <button className="btn ghost">◌</button>
        <button className="btn primary">＋ Add</button>
      </div>
    </header>
  );
}

function Board() {
  return (
    <div className="board row gap14 astart">
      {STAGES.map((stage) => (
        <section className="stage col" key={stage.id}>
          <div className="stage-head row gap8">
            <span className="stage-dot" style={{ background: stage.color, boxShadow: `0 0 10px -1px ${stage.color}` }} />
            <span className="stage-title">{stage.label}</span>
            <span className="stage-count">0</span>
          </div>
          <div className="drop-zone col gap10">
            <div className="empty-card">
              <span className="label">drop here</span>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyView({ view }) {
  const copy = {
    calendar: ["No deadlines yet", "Add an opportunity and Coda will build your timeline."],
    gallery: ["No opportunities yet", "Your tracked opportunities will appear here."],
    discover: ["Discover queue is empty", "Suggested matches will land here for your review."],
    assistant: ["Start with a question", "Coda can help find opportunities, extract requirements, and draft materials."],
  }[view];

  return (
    <div className="empty-view">
      <div className="panel">
        <h2>{copy[0]}</h2>
        <p>{copy[1]}</p>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState("board");
  return (
    <div className="app-shell row">
      <Sidebar view={view} setView={setView} />
      <main className="main col grow">
        <Topbar view={view} />
        <div className="grow" style={{ minHeight: 0 }}>
          {view === "board" ? <Board /> : <EmptyView view={view} />}
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
