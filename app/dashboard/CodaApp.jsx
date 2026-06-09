"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../utils/supabase/client";

const STAGES = [
  { id: "found", label: "Saved", color: "var(--tx-3)" },
  { id: "interested", label: "Interested", color: "var(--accent)" },
  { id: "in_progress", label: "Ongoing", color: "var(--warn)" },
  { id: "submitted", label: "Submitted", color: "oklch(0.72 0.13 230)" },
  { id: "response", label: "Decision made", color: "var(--good)" },
];

const VIEWS = [
  { id: "board", label: "Board", icon: "board", group: "Tracker" },
  { id: "calendar", label: "Calendar", icon: "cal", group: "Tracker" },
  { id: "gallery", label: "Gallery", icon: "grid", group: "Tracker" },
  { id: "discover", label: "Discover", icon: "compass", group: "AI" },
  { id: "assistant", label: "Assistant", icon: "message", group: "AI" },
  { id: "artist_profile", label: "Artist Profile", icon: "user", group: "AI" },
];

const VIEW_TITLE = {
  board: { t: "Pipeline", s: "Drag opportunities between stages" },
  calendar: { t: "Timeline", s: "Everything by deadline" },
  gallery: { t: "All opportunities", s: "Your full tracked library" },
  discover: { t: "Discover", s: "Suggested · confirm to track" },
  assistant: { t: "Assistant", s: "Find, organize, and draft with Coda" },
  artist_profile: { t: "Artist Profile", s: "Tell Coda who you are as an artist" },
};

const NAV_SHORT = {
  board: "Board",
  calendar: "Calendar",
  gallery: "Gallery",
  discover: "Discover",
  assistant: "Assistant",
  artist_profile: "Profile",
};

function useIsMobile(breakpoint = 760) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
}

function daysUntil(iso) {
  const day = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((day - now) / 86400000);
}

function stageLabel(id) {
  return STAGES.find((s) => s.id === id)?.label || "Saved";
}

function Icon({ name, size = 18, stroke = "currentColor", sw = 1.9, fill = "none", style }) {
  const p = { fill, stroke, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    search: <g {...p}><circle cx="8" cy="8" r="5.2" /><path d="M12.5 12.5 L17 17" /></g>,
    plus: <g {...p}><path d="M10 4 V16 M4 10 H16" /></g>,
    x: <g {...p}><path d="M5 5 L15 15 M15 5 L5 15" /></g>,
    check: <g {...p}><path d="M4.5 10.5 L8.1 14 L15.5 6" /></g>,
    clock: <g {...p}><circle cx="10" cy="10" r="6.5" /><path d="M10 6.5 V10.3 L12.8 12" /></g>,
    trash: <g {...p}><path d="M4 6 H16 M8 6 V4 H12 V6 M6 6 L7 16 H13 L14 6" /></g>,
    board: <g {...p}><rect x="3" y="4" width="4.4" height="12" rx="1" /><rect x="9.3" y="4" width="4.4" height="8" rx="1" /><rect x="15.6" y="4" width="2" height="12" rx="1" /></g>,
    cal: <g {...p}><rect x="3.2" y="4.5" width="13.6" height="12" rx="1.6" /><path d="M3.2 8 H16.8 M7 3 V6 M13 3 V6" /></g>,
    grid: <g {...p}><rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" /><rect x="11" y="3.5" width="5.5" height="5.5" rx="1" /><rect x="3.5" y="11" width="5.5" height="5.5" rx="1" /><rect x="11" y="11" width="5.5" height="5.5" rx="1" /></g>,
    compass: <g {...p}><circle cx="10" cy="10" r="7" /><path d="M13.2 6.8 L8.4 8.4 L6.8 13.2 L11.6 11.6 Z" /></g>,
    message: <g {...p}><path d="M4 4.5 H16 V13 H9 L5.5 16 V13 H4 Z" /></g>,
    user: <g {...p}><circle cx="10" cy="7" r="3" /><path d="M4.5 16 C5.5 12.8 7.5 11.5 10 11.5 C12.5 11.5 14.5 12.8 15.5 16" /></g>,
    bell: <g {...p}><path d="M6 9 a4 4 0 0 1 8 0 c0 3 1 4 1.5 4.7 H4.5 C5 13 6 12 6 9 Z M8.5 16 a1.6 1.6 0 0 0 3 0" /></g>,
    settings: <g {...p}><circle cx="10" cy="10" r="2.4" /><path d="M10 3 V5 M10 15 V17 M3 10 H5 M15 10 H17 M5.2 5.2 L6.6 6.6 M13.4 13.4 L14.8 14.8 M14.8 5.2 L13.4 6.6 M6.6 13.4 L5.2 14.8" /></g>,
    doc: <g {...p}><path d="M5.5 3.5 H12 L15 6.5 V16.5 H5.5 Z M12 3.5 V6.5 H15 M7.5 10 H12.5 M7.5 13 H12.5" /></g>,
    sparkle: <g {...p}><path d="M10 3 C10.5 7 11 8 15 9 C11 10 10.5 11 10 15 C9.5 11 9 10 5 9 C9 8 9.5 7 10 3 Z" /></g>,
    coda: <g {...p}><circle cx="10" cy="10" r="5" /><path d="M10 2.4 V17.6 M2.4 10 H17.6" /></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 20 20" style={{ flex: "none", ...style }}>{paths[name] || null}</svg>;
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className="row gap10 between"
      style={{ width: "100%", textAlign: "left", cursor: "pointer", padding: "9px 11px", borderRadius: 10,
        background: active ? "var(--surface-2)" : "transparent",
        border: "1px solid " + (active ? "var(--border)" : "transparent"),
        color: active ? "var(--tx)" : "var(--tx-2)", transition: "background .12s, color .12s" }}>
      <span className="row gap10">
        <Icon name={icon} size={17} stroke={active ? "var(--accent-bright)" : "var(--tx-3)"} sw={1.8} />
        <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 500 }}>{label}</span>
      </span>
    </button>
  );
}

function Sidebar({ view, setView, userEmail }) {
  const tracker = VIEWS.filter((v) => v.group === "Tracker");
  const ai = VIEWS.filter((v) => v.group === "AI");
  return (
    <aside className="col" style={{ width: 240, flex: "none", borderRight: "1px solid var(--border)", background: "var(--bg)", padding: "18px 14px 14px" }}>
      <div className="row" style={{ padding: "2px 6px 24px", alignItems: "center" }}>
        <span className="disp" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", display: "inline-flex", alignItems: "center", lineHeight: 1 }}>
          C<Icon name="coda" size={18} stroke="var(--accent-bright)" sw={2} style={{ margin: "0 -0.5px" }} />da
        </span>
      </div>
      <div className="label" style={{ padding: "0 8px 8px" }}>Tracker</div>
      <div className="col" style={{ gap: 2 }}>{tracker.map((v) => <NavItem key={v.id} {...v} active={view === v.id} onClick={() => setView(v.id)} />)}</div>
      <div className="hr" style={{ margin: "14px 6px" }} />
      <div className="col" style={{ gap: 2 }}>{ai.map((v) => <NavItem key={v.id} {...v} active={view === v.id} onClick={() => setView(v.id)} />)}</div>
      <div className="grow" />
      <div className="row gap10" style={{ padding: "6px 6px 0" }}>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface-3)", border: "1px solid var(--border-2)", display: "grid", placeItems: "center" }} />
        <div className="col grow" style={{ gap: 3 }}>
          <span className="tx3" style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</span>
          <form action="/auth/signout" method="post">
            <button className="btn ghost sm" type="submit" style={{ padding: 0, background: "transparent" }}>Sign out</button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function MobileNav({ view, setView }) {
  return (
    <nav className="mobile-nav" aria-label="Primary">
      {VIEWS.map((v) => {
        const active = view === v.id;
        return (
          <button key={v.id} type="button" className="mobile-nav-item" aria-current={active ? "page" : undefined} onClick={() => setView(v.id)}>
            <span className="mobile-nav-dot" style={{ opacity: active ? 1 : 0 }} />
            <Icon name={v.icon} size={21} stroke={active ? "var(--accent-bright)" : "var(--tx-3)"} sw={active ? 2 : 1.8} />
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500, letterSpacing: "-0.01em", color: active ? "var(--tx)" : "var(--tx-3)" }}>{NAV_SHORT[v.id]}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Header({ view, count, query, setQuery, onAdd, isMobile }) {
  const vt = VIEW_TITLE[view];
  const isProfile = view === "artist_profile";
  const [searchOpen, setSearchOpen] = useState(false);

  if (isMobile) {
    return (
      <header className="col" style={{ padding: "12px 16px 10px", flex: "none", borderBottom: "1px solid var(--border)", gap: searchOpen && !isProfile ? 10 : 0, background: "var(--bg)" }}>
        <div className="row between gap10">
          <div className="row gap10" style={{ minWidth: 0 }}>
            <span style={{ width: 34, height: 34, flex: "none", borderRadius: 11, display: "grid", placeItems: "center", background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
              <Icon name="coda" size={17} stroke="var(--accent-bright)" sw={2} />
            </span>
            <div className="col" style={{ gap: 1, minWidth: 0 }}>
              <div className="disp" style={{ fontSize: 18, fontWeight: 750, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vt.t}</div>
              <div className="tx3" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{isProfile ? vt.s : `${count} tracked`}</div>
            </div>
          </div>
          <div className="row gap8" style={{ flex: "none" }}>
            {!isProfile && <button type="button" className="btn ghost" style={{ padding: 10 }} onClick={() => setSearchOpen((o) => !o)} aria-label="Search"><Icon name="search" size={18} /></button>}
            {!isProfile && <button type="button" className="btn primary" style={{ padding: 10 }} onClick={onAdd} aria-label="Add opportunity"><Icon name="plus" size={17} stroke="#fff" /></button>}
          </div>
        </div>
        {!isProfile && searchOpen && (
          <div className="row gap8 fade" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
            <Icon name="search" size={16} stroke="var(--tx-4)" />
            <input className="input" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search opportunities…" style={{ border: "none", background: "transparent", padding: 0 }} />
            {query && <button type="button" className="btn ghost" style={{ padding: 2 }} onClick={() => setQuery("")} aria-label="Clear search"><Icon name="x" size={14} /></button>}
          </div>
        )}
      </header>
    );
  }

  return (
    <header className="row between" style={{ padding: "16px 28px 14px", flex: "none", borderBottom: "1px solid var(--border)" }}>
      <div className="col" style={{ gap: 3 }}>
        <div className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{vt.t}</div>
        <div className="tx3" style={{ fontSize: 12.5 }}>{isProfile ? vt.s : `${count} ${view === "discover" ? "suggested" : "tracked"} · ${vt.s}`}</div>
      </div>
      <div className="row gap10">
        {!isProfile && (
          <div className="row gap8" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", width: 180 }}>
            <Icon name="search" size={15} stroke="var(--tx-4)" />
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" style={{ border: "none", background: "transparent", padding: 0, fontSize: 13 }} />
          </div>
        )}
        <button className="btn ghost" style={{ padding: 9 }}><Icon name="bell" size={17} /></button>
        {!isProfile && <button className="btn primary" onClick={onAdd}><Icon name="plus" size={15} stroke="#fff" /> Add</button>}
      </div>
    </header>
  );
}

function OppCard({ opp, onOpen, onDragStart }) {
  return (
    <div className="card" draggable onDragStart={onDragStart} onClick={() => onOpen(opp)}
      style={{ padding: 14, cursor: "pointer", background: "var(--surface-2)" }}>
      <div className="disp" style={{ fontSize: 14.5, fontWeight: 650, lineHeight: 1.25 }}>{opp.title}</div>
      {opp.org && <div className="tx3" style={{ fontSize: 12.5, marginTop: 5 }}>{opp.org}</div>}
      {(opp.deadline || opp.source_url) && (
        <div className="row gap10 between" style={{ marginTop: 12 }}>
          {opp.deadline ? <span className="label">Due {opp.deadline}</span> : <span />}
          {opp.source_url && (
            <a href={opp.source_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="label" style={{ color: "var(--accent-bright)", textDecoration: "none" }}>
              Source ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Board({ opps, onOpen, onMove, onAdd, isMobile }) {
  const [dragId, setDragId] = useState(null);
  return (
    <div className={"row gap14 astart" + (isMobile ? " board-scroll" : "")} style={{ padding: isMobile ? "10px 16px 20px" : "8px 28px 28px", overflowX: "auto", height: "100%", alignItems: "stretch" }}>
      {STAGES.map((st) => {
        const items = opps.filter((o) => o.stage === st.id);
        return (
          <div key={st.id} className="col board-col" style={{ width: isMobile ? "min(84vw, 320px)" : 280, flex: "none" }} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragId) onMove(dragId, st.id); setDragId(null); }}>
            <div className="row gap8" style={{ padding: "2px 6px 12px", flex: "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, flex: "none", background: st.color, boxShadow: `0 0 10px -1px ${st.color}` }} />
              <span className="disp" style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>{st.label}</span>
              <span className="mono tx4" style={{ fontSize: 12 }}>{items.length}</span>
            </div>
            <div className="card col gap10" style={{ padding: 10, flex: 1, minHeight: 140, background: "var(--bg-2)", borderColor: "var(--hairline)", overflowY: isMobile ? "auto" : undefined }}>
              {items.map((opp) => <OppCard key={opp.id} opp={opp} onOpen={onOpen} onDragStart={() => setDragId(opp.id)} />)}
              {items.length === 0 && <div className="col center" style={{ alignItems: "center", padding: "26px 6px", gap: 8 }}><span className="label">{isMobile ? "empty" : "drop here"}</span><button className="btn sm ghost" onClick={onAdd}><Icon name="plus" size={13} /> Add</button></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SmallEmpty({ title, body }) {
  return (
    <div style={{ height: "100%", display: "grid", placeItems: "center", padding: 28 }}>
      <div className="card" style={{ width: "min(520px, 100%)", padding: 36, textAlign: "center" }}>
        <Icon name="search" size={26} stroke="var(--accent-bright)" />
        <div className="disp" style={{ fontSize: 18, fontWeight: 600, marginTop: 14 }}>{title}</div>
        <div className="tx3" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>{body}</div>
      </div>
    </div>
  );
}

function CalendarView({ opps, onOpen, isMobile }) {
  const dated = [...opps].filter((o) => o.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline));
  if (opps.length && !dated.length) return <EmptyView view="calendar" />;
  if (!dated.length) return <EmptyView view="calendar" />;

  const buckets = [
    { id: "overdue", label: "Overdue", test: (n) => n < 0 },
    { id: "week", label: "This week", test: (n) => n >= 0 && n <= 7 },
    { id: "month", label: "This month", test: (n) => n > 7 && n <= 30 },
    { id: "later", label: "Later", test: (n) => n > 30 },
  ];

  return (
    <div className="col gap14" style={{ height: "100%", overflow: "auto", padding: isMobile ? "10px 16px 24px" : "8px 28px 28px" }}>
      {buckets.map((bucket) => {
        const items = dated.filter((o) => bucket.test(daysUntil(o.deadline)));
        if (!items.length) return null;
        return (
          <section key={bucket.id} className="card" style={{ padding: 16 }}>
            <div className="row gap8" style={{ marginBottom: 12 }}>
              <div className="disp" style={{ fontSize: 15, fontWeight: 700 }}>{bucket.label}</div>
              <span className="mono tx4" style={{ fontSize: 12 }}>{items.length}</span>
            </div>
            <div className="col gap8">
              {items.map((opp) => (
                <button key={opp.id} onClick={() => onOpen(opp)} className="row between"
                  style={{ cursor: "pointer", textAlign: "left", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--tx)" }}>
                  <span className="col" style={{ gap: 4 }}>
                    <span className="disp" style={{ fontWeight: 650 }}>{opp.title}</span>
                    <span className="tx3" style={{ fontSize: 12.5 }}>{opp.org || stageLabel(opp.stage)}</span>
                  </span>
                  <span className="label">{opp.deadline}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GalleryView({ opps, onOpen, isMobile }) {
  if (!opps.length) return <EmptyView view="gallery" />;
  return (
    <div style={{ height: "100%", overflow: "auto", padding: isMobile ? "10px 16px 24px" : "8px 28px 28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))", gap: isMobile ? 12 : 14 }}>
        {opps.map((opp) => (
          <div key={opp.id} className="card" onClick={() => onOpen(opp)} style={{ padding: 16, cursor: "pointer", minHeight: 150 }}>
            <div className="label">{stageLabel(opp.stage)}</div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, marginTop: 14, lineHeight: 1.2 }}>{opp.title}</div>
            {opp.org && <div className="tx3" style={{ fontSize: 13, marginTop: 8 }}>{opp.org}</div>}
            {(opp.deadline || opp.source_url) && (
              <div className="row gap10 between" style={{ marginTop: 18 }}>
                {opp.deadline ? <span className="label">Due {opp.deadline}</span> : <span />}
                {opp.source_url && (
                  <a href={opp.source_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="label" style={{ color: "var(--accent-bright)", textDecoration: "none" }}>
                    Source ↗
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscoverView({ opps, onConfirm, onDismiss, isMobile }) {
  if (!opps.length) return <EmptyView view="discover" />;
  return (
    <div style={{ height: "100%", overflow: "auto", padding: isMobile ? "10px 16px 24px" : "8px 28px 28px" }}>
      <div className="col gap10" style={{ width: "min(680px, 100%)" }}>
        {opps.map((opp) => (
          <div key={opp.id} className="card row gap14 between" style={{ padding: 16, alignItems: "flex-start" }}>
            <div className="col grow" style={{ gap: 5, minWidth: 0 }}>
              <div className="row gap8">
                <Icon name="compass" size={15} stroke="var(--accent-bright)" />
                <span className="disp" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{opp.title}</span>
              </div>
              {opp.org && <div className="tx3" style={{ fontSize: 12.5 }}>{opp.org}</div>}
              {opp.notes && <div className="tx3" style={{ fontSize: 12.5, lineHeight: 1.4 }}>{opp.notes}</div>}
              <div className="row gap10" style={{ marginTop: 4, flexWrap: "wrap" }}>
                {opp.deadline && <span className="label">Due {opp.deadline}</span>}
                {opp.source_url && (
                  <a href={opp.source_url} target="_blank" rel="noreferrer" className="label" style={{ color: "var(--accent-bright)", textDecoration: "none" }}>
                    Source ↗
                  </a>
                )}
              </div>
            </div>
            <div className="row gap8" style={{ flex: "none" }}>
              <button className="btn ghost sm" onClick={() => onDismiss(opp.id)}><Icon name="x" size={13} /> Dismiss</button>
              <button className="btn primary sm" onClick={() => onConfirm(opp.id)}><Icon name="check" size={13} stroke="#fff" /> Track</button>
            </div>
          </div>
        ))}
      </div>
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
    <div style={{ height: "100%", display: "grid", placeItems: "center", padding: 28 }}>
      <div className="card" style={{ width: "min(520px, 100%)", padding: 36, textAlign: "center" }}>
        <Icon name={view === "assistant" ? "message" : view === "discover" ? "compass" : "doc"} size={28} stroke="var(--accent-bright)" />
        <div className="disp" style={{ fontSize: 18, fontWeight: 600, marginTop: 14 }}>{empty[0]}</div>
        <div className="tx3" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>{empty[1]}</div>
      </div>
    </div>
  );
}

function renderInlineMarkdown(text) {
  const parts = [];
  const pattern = /(\[[^\]]+\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));

    if (match[2]) {
      parts.push(
        <a key={parts.length} href={match[2]} target="_blank" rel="noreferrer" style={{ color: "var(--accent-bright)", textDecoration: "none", borderBottom: "1px solid var(--accent-line)" }}>
          {match[1].slice(1, match[1].indexOf("]"))}
        </a>
      );
    } else if (match[3]) {
      parts.push(<code key={parts.length} style={{ padding: "1px 5px", borderRadius: 6, background: "var(--bg-2)", border: "1px solid var(--hairline)", fontSize: "0.92em" }}>{match[3]}</code>);
    } else if (match[4]) {
      parts.push(<strong key={parts.length} style={{ color: "var(--tx)", fontWeight: 750 }}>{match[4]}</strong>);
    } else if (match[5]) {
      parts.push(<em key={parts.length}>{match[5]}</em>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function MarkdownText({ text }) {
  const lines = String(text || "").split("\n");
  const blocks = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (!line.trim()) {
      blocks.push(<div key={blocks.length} style={{ height: 6 }} />);
      continue;
    }

    if (line.trim().startsWith("```")) {
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      blocks.push(
        <pre key={blocks.length} style={{ margin: "6px 0", padding: 12, overflow: "auto", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--hairline)", whiteSpace: "pre-wrap" }}>
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push(
        <div key={blocks.length} className="disp" style={{ fontSize: heading[1].length === 1 ? 17 : 15, fontWeight: 750, marginTop: 4 }}>
          {renderInlineMarkdown(heading[2])}
        </div>
      );
      continue;
    }

    const listMatch = line.match(/^\s*([-*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]);
      const items = [listMatch[2]];
      while (i + 1 < lines.length) {
        const next = lines[i + 1].match(/^\s*([-*]|\d+\.)\s+(.+)$/);
        if (!next || /\d+\./.test(next[1]) !== ordered) break;
        items.push(next[2]);
        i += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={blocks.length} style={{ margin: "4px 0", paddingLeft: 20 }}>
          {items.map((item, index) => <li key={index} style={{ margin: "3px 0" }}>{renderInlineMarkdown(item)}</li>)}
        </ListTag>
      );
      continue;
    }

    blocks.push(<div key={blocks.length}>{renderInlineMarkdown(line)}</div>);
  }

  return <div style={{ display: "grid", gap: 2 }}>{blocks}</div>;
}

function ReasoningSummaryCard({ summary, active }) {
  const [expanded, setExpanded] = useState(true);
  const text = summary?.trim() || "Coda is gathering its thoughts…";
  const showText = active || expanded;

  return (
    <div className="fade" style={{
      width: "min(540px, 100%)",
      padding: 1,
      borderRadius: 15,
      background: active
        ? "linear-gradient(135deg, color-mix(in oklch, var(--accent-bright) 38%, transparent), var(--hairline), transparent)"
        : "var(--hairline)",
      opacity: active ? 1 : .86,
    }}>
      <div className="col" style={{
        gap: showText ? 7 : 0,
        padding: "10px 12px",
        borderRadius: 14,
        background: "linear-gradient(180deg, color-mix(in oklch, var(--surface-2) 88%, transparent), var(--bg-2))",
        border: "1px solid var(--hairline)",
        borderLeft: "3px solid var(--accent-bright)",
      }}>
        <div className="row gap8 between">
          <span className="row gap8" style={{ color: active ? "var(--accent-bright)" : "var(--tx-3)" }}>
            <Icon name="sparkle" size={14} stroke="currentColor" sw={2} />
            <span className="disp" style={{ fontSize: 12.5, fontWeight: 750 }}>
              {active ? "Coda is thinking…" : "Coda’s thinking"}
            </span>
          </span>
          {!active && summary?.trim() && (
            <button type="button" className="btn ghost sm" onClick={() => setExpanded((v) => !v)} style={{ padding: "2px 6px", fontSize: 11.5 }}>
              {expanded ? "Hide" : "Show"}
            </button>
          )}
        </div>
        {showText && (
          <div className="tx3" style={{
            fontSize: 12.8,
            lineHeight: 1.45,
            fontStyle: "italic",
          }}>
            <MarkdownText text={text} />
          </div>
        )}
      </div>
    </div>
  );
}

function toolAccent(status) {
  if (status === "completed") return "var(--good)";
  if (status === "waiting") return "var(--warn)";
  return "var(--accent-bright)";
}

function ToolActivityRow({ tool }) {
  const done = tool.status === "completed";
  const waiting = tool.status === "waiting";
  const running = !done && !waiting;
  const accent = toolAccent(tool.status);
  const icon = done ? "check" : waiting ? "clock" : tool.icon || "sparkle";
  const detail = tool.result || tool.action || tool.message;

  return (
    <div className="row gap8 fade" style={{ alignItems: "flex-start", padding: "5px 0" }}>
      <span style={{
        width: 20,
        height: 20,
        borderRadius: 7,
        display: "grid",
        placeItems: "center",
        flex: "none",
        marginTop: 1,
        color: accent,
        background: `color-mix(in oklch, ${accent} 14%, transparent)`,
      }}>
        <Icon name={icon} size={12} stroke={accent} sw={2.2} />
      </span>
      <span className="col grow" style={{ gap: 1, minWidth: 0 }}>
        <span className="disp" style={{ fontSize: 12.5, fontWeight: 700, color: running ? "var(--tx)" : "var(--tx-2)" }}>
          {tool.label || "Coda tool"}
          {running && <span className="tx3" style={{ fontWeight: 500 }}> — {tool.message || "running…"}</span>}
        </span>
        {detail && (done || waiting) && (
          <span className="tx3" style={{ fontSize: 12, lineHeight: 1.4, overflowWrap: "anywhere" }}>{detail}</span>
        )}
      </span>
    </div>
  );
}

function ToolActivityCard({ tools }) {
  const [expanded, setExpanded] = useState(false);
  const active = tools.some((tool) => tool.status !== "completed");
  const runningTool = tools.find((tool) => tool.status !== "completed" && tool.status !== "waiting");
  const accent = active ? "var(--accent-bright)" : "var(--good)";
  const count = tools.length;
  const headline = active
    ? (runningTool ? `${runningTool.label || "Coda tool"} — ${runningTool.message || "running…"}` : "Waiting for confirmation…")
    : `${count} step${count === 1 ? "" : "s"} completed`;
  const showRows = active || expanded;

  return (
    <div className="fade" style={{
      width: "min(540px, 100%)",
      padding: 1,
      borderRadius: 15,
      background: active
        ? `linear-gradient(135deg, color-mix(in oklch, ${accent} 38%, transparent), var(--hairline), transparent)`
        : "var(--hairline)",
      opacity: active ? 1 : .86,
    }}>
      <div className="col" style={{
        gap: showRows ? 6 : 0,
        padding: "10px 12px",
        borderRadius: 14,
        background: "linear-gradient(180deg, color-mix(in oklch, var(--surface-2) 88%, transparent), var(--bg-2))",
        border: "1px solid var(--hairline)",
        borderLeft: `3px solid ${accent}`,
      }}>
        <div className="row gap8 between">
          <span className="row gap8" style={{ color: active ? accent : "var(--tx-3)", minWidth: 0 }}>
            <Icon name={active ? "sparkle" : "check"} size={14} stroke="currentColor" sw={2} />
            <span className="disp" style={{ fontSize: 12.5, fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {headline}
            </span>
          </span>
          {!active && (
            <button type="button" className="btn ghost sm" onClick={() => setExpanded((v) => !v)} style={{ padding: "2px 6px", fontSize: 11.5, flex: "none" }}>
              {expanded ? "Hide" : "Show"}
            </button>
          )}
        </div>
        {showRows && (
          <div className="col" style={{ borderTop: "1px solid var(--hairline)", paddingTop: 4 }}>
            {tools.map((tool) => <ToolActivityRow key={tool.id || `${tool.name}-${tool.status}`} tool={tool} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function AssistantView({ messages, pending, status, onSend, isMobile }) {
  const [input, setInput] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    await onSend(text);
  };

  return (
    <div className="col" style={{ height: "100%", padding: isMobile ? "10px 12px 12px" : "8px 28px 28px", gap: 14 }}>
      <div className="card col grow" style={{ minHeight: 0, overflow: "hidden", background: "var(--bg-2)" }}>
        <div className="col grow" style={{ gap: 12, overflow: "auto", padding: isMobile ? 14 : 18 }}>
          {!messages.length && (
            <div className="card" style={{ padding: 18, background: "var(--surface-2)" }}>
              <div className="row gap8"><Icon name="sparkle" size={17} stroke="var(--accent-bright)" /><div className="disp" style={{ fontWeight: 700 }}>Coda is ready</div></div>
              <div className="tx3" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.45 }}>
                Ask it to add, find, update, move, summarize, or delete opportunities. It uses your signed-in session and the same database rules as the app.
              </div>
              <div className="row gap8" style={{ flexWrap: "wrap", marginTop: 14 }}>
                {[
                  "Show my upcoming deadlines",
                  "Add a new internship opportunity",
                  "Move an opportunity to submitted",
                ].map((prompt) => (
                  <button key={prompt} type="button" className="btn sm ghost" disabled={pending} onClick={() => onSend(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message) => {
            const isUser = message.role === "user";
            const hasTools = !isUser && Array.isArray(message.tools) && message.tools.length > 0;
            const hasReasoning = !isUser && (message.thinking || message.reasoningSummary);
            const showBubble = isUser || message.content || message.error || (!hasTools && !hasReasoning);

            return (
              <div key={message.id} className="col" style={{ alignItems: isUser ? "flex-end" : "flex-start" }}>
                <div className="col gap8" style={{ alignItems: isUser ? "flex-end" : "flex-start", maxWidth: "min(680px, 88%)" }}>
                  {hasReasoning && <ReasoningSummaryCard summary={message.reasoningSummary} active={Boolean(message.thinking)} />}
                  {hasTools && <ToolActivityCard tools={message.tools} />}
                  {showBubble && (
                    <div className="card fade" style={{
                      padding: "12px 14px",
                      background: isUser ? "var(--accent)" : message.error ? "var(--accent-soft)" : "var(--surface-2)",
                      borderColor: message.error ? "var(--accent-line)" : "var(--border)",
                      color: isUser ? "#fff" : "var(--tx)",
                      whiteSpace: isUser || message.error ? "pre-wrap" : "normal",
                      lineHeight: 1.45,
                      fontSize: 14,
                    }}>
                      {!isUser && !message.error ? <MarkdownText text={message.content} /> : message.content}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {pending && (
            <div className="row gap8 tx3" style={{ fontSize: 13, padding: "2px 4px" }}>
              <Icon name="sparkle" size={15} stroke="var(--accent-bright)" /> {status || "Coda is working…"}
            </div>
          )}
        </div>
        <form onSubmit={submit} className="row gap10" style={{ padding: 14, borderTop: "1px solid var(--border)" }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message to Coda…"
            disabled={pending}
            autoFocus
          />
          <button className="btn primary" disabled={pending || !input.trim()} style={{ opacity: pending || !input.trim() ? .6 : 1 }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function calculateAge(birthdate) {
  if (!birthdate) return null;
  const born = new Date(birthdate + "T00:00:00");
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const hadBirthday = today.getMonth() > born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hadBirthday) age -= 1;
  return age >= 0 ? age : null;
}

function ArtistProfileView({ profile, onSave, isMobile, userEmail }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    discipline: profile?.discipline || "",
    birthdate: profile?.birthdate || "",
    bio: profile?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const words = wordCount(form.bio);
  const age = calculateAge(form.birthdate);
  const set = (key, value) => {
    if (key === "bio" && wordCount(value) > 150) return;
    setForm((f) => ({ ...f, [key]: value }));
  };
  const submit = async (e) => {
    e.preventDefault();
    if (saving || words > 150) return;
    setSaving(true);
    await onSave({
      full_name: form.full_name.trim(),
      discipline: form.discipline.trim(),
      birthdate: form.birthdate || null,
      bio: form.bio.trim(),
    });
    setSaving(false);
  };

  return (
    <div className="col gap14" style={{ height: "100%", overflow: "auto", padding: isMobile ? "10px 16px 24px" : "8px 28px 28px" }}>
      <form onSubmit={submit} className="card col gap14" style={{ width: "min(720px, 100%)", padding: isMobile ? 18 : 20, background: "linear-gradient(180deg, var(--surface), var(--bg-2))" }}>
        <div className="row gap10" style={{ alignItems: "flex-start" }}>
          <span style={{ width: 38, height: 38, borderRadius: 14, display: "grid", placeItems: "center", background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
            <Icon name="user" size={18} stroke="var(--accent-bright)" />
          </span>
          <div className="col" style={{ gap: 5 }}>
            <div className="disp" style={{ fontSize: 18, fontWeight: 750 }}>Your artist identity</div>
            <div className="tx3" style={{ fontSize: 13, lineHeight: 1.4 }}>This helps Coda tailor opportunities, drafts, and recommendations.</div>
          </div>
        </div>

        <div className="hr" />

        <div className="col gap8">
          <div className="label">Full name</div>
          <input className="input" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Your full name" />
        </div>
        <div className="col gap8">
          <div className="label">Discipline</div>
          <input className="input" value={form.discipline} onChange={(e) => set("discipline", e.target.value)} placeholder="Painter, dancer, filmmaker…" />
        </div>
        <div className="col gap8">
          <div className="row between">
            <div className="label">Birthdate</div>
            {age !== null && <div className="tx3" style={{ fontSize: 12.5 }}>Age {age}</div>}
          </div>
          <input className="input" type="date" value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} max={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="col gap8">
          <div className="row between">
            <div className="label">Bio</div>
            <div className={words > 150 ? "" : "tx3"} style={{ fontSize: 12.5, color: words > 150 ? "var(--warn)" : undefined }}>{words} / 150 words</div>
          </div>
          <textarea className="input" value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A short artist bio…" rows={7} style={{ resize: "vertical", lineHeight: 1.45 }} />
        </div>

        <div className="row between gap10" style={{ marginTop: 4 }}>
          <div className="tx3" style={{ fontSize: 12.5 }}>Saved privately to your account.</div>
          <button className="btn primary" disabled={saving || words > 150} style={{ opacity: saving || words > 150 ? .6 : 1 }}>
            <Icon name="check" size={15} stroke="#fff" /> {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>

      {isMobile && (
        <div className="card row between gap10" style={{ width: "min(720px, 100%)", padding: 16 }}>
          <div className="row gap10" style={{ minWidth: 0 }}>
            <span style={{ width: 34, height: 34, flex: "none", borderRadius: "50%", background: "var(--surface-3)", border: "1px solid var(--border-2)" }} />
            <div className="col" style={{ gap: 2, minWidth: 0 }}>
              <span className="label" style={{ letterSpacing: "0.08em" }}>Signed in</span>
              <span className="tx3" style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</span>
            </div>
          </div>
          <form action="/auth/signout" method="post" style={{ flex: "none" }}>
            <button className="btn sm" type="submit">Sign out</button>
          </form>
        </div>
      )}
    </div>
  );
}

function AddDialog({ onClose, onCreate, isMobile }) {
  const [form, setForm] = useState({ title: "", org: "", deadline: "", stage: "found" });
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || saving) return;
    setSaving(true);
    await onCreate({ ...form, title: form.title.trim() });
    setSaving(false);
  };
  const overlayStyle = { position: "fixed", inset: 0, zIndex: 30, display: "grid", placeItems: isMobile ? "end stretch" : "center", background: "oklch(0.1 0.01 265 / 0.65)", padding: isMobile ? 0 : 20 };
  const formStyle = isMobile
    ? { width: "100%", padding: "8px 18px calc(20px + env(safe-area-inset-bottom))", borderRadius: "22px 22px 0 0", maxHeight: "92dvh", overflowY: "auto" }
    : { width: "min(460px, 100%)", padding: 20 };
  return (
    <div style={overlayStyle} onClick={onClose}>
      <form className={"card col gap14 " + (isMobile ? "sheet-up" : "fade")} onSubmit={submit} onClick={(e) => e.stopPropagation()} style={formStyle}>
        {isMobile && <div className="sheet-grabber" />}
        <div className="row between"><div className="disp" style={{ fontSize: 18, fontWeight: 700 }}>Add opportunity</div><button type="button" className="btn ghost" style={{ padding: 7 }} onClick={onClose}><Icon name="x" size={15} /></button></div>
        <input className="input" autoFocus placeholder="Title" value={form.title} onChange={(e) => set("title", e.target.value)} />
        <input className="input" placeholder="Organization / source" value={form.org} onChange={(e) => set("org", e.target.value)} />
        <input className="input" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
        <select className="input" value={form.stage} onChange={(e) => set("stage", e.target.value)}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        <button className="btn primary" disabled={saving} style={{ justifyContent: "center", opacity: saving ? .65 : 1 }}><Icon name="plus" size={15} stroke="#fff" /> {saving ? "Saving…" : "Add opportunity"}</button>
      </form>
    </div>
  );
}

function DetailDrawer({ opp, onClose, onUpdate, onDelete, isMobile }) {
  const [form, setForm] = useState({ title: opp.title, org: opp.org || "", deadline: opp.deadline || "", stage: opp.stage || "found", source_url: opp.source_url || "" });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const dirty = ["title", "org", "deadline", "stage", "source_url"].some((key) => form[key] !== (opp[key] || (key === "stage" ? "found" : "")));
  const save = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onUpdate(opp.id, { ...form, title: form.title.trim() });
  };

  const overlayStyle = { position: "fixed", inset: 0, zIndex: 30, background: "oklch(0.1 0.01 265 / 0.55)", display: isMobile ? "grid" : undefined, placeItems: isMobile ? "end stretch" : undefined };
  const asideStyle = isMobile
    ? { width: "100%", maxHeight: "92dvh", overflowY: "auto", background: "var(--bg)", borderTop: "1px solid var(--border)", borderRadius: "22px 22px 0 0", padding: "8px 18px calc(18px + env(safe-area-inset-bottom))", gap: 16 }
    : { marginLeft: "auto", width: "min(420px, 100%)", height: "100%", background: "var(--bg)", borderLeft: "1px solid var(--border)", padding: 22, gap: 18 };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <aside className={"col" + (isMobile ? " sheet-up" : "")} onClick={(e) => e.stopPropagation()} style={asideStyle}>
        {isMobile && <div className="sheet-grabber" />}
        <form className="col gap14 grow" onSubmit={save}>
          <div className="row between">
            <div className="disp" style={{ fontSize: 20, fontWeight: 750 }}>Edit opportunity</div>
            <button type="button" className="btn ghost" style={{ padding: 7 }} onClick={onClose}><Icon name="x" size={15} /></button>
          </div>

          <div className="col gap8">
            <div className="label">Title</div>
            <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="col gap8">
            <div className="label">Organization / source</div>
            <input className="input" value={form.org} onChange={(e) => set("org", e.target.value)} />
          </div>
          <div className="col gap8">
            <div className="label">Deadline</div>
            <input className="input" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
          </div>
          <div className="col gap8">
            <div className="label">Stage</div>
            <select className="input" value={form.stage} onChange={(e) => set("stage", e.target.value)}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          </div>
          <div className="col gap8">
            <div className="row between">
              <div className="label">Source URL</div>
              {form.source_url.trim() && (
                <a href={form.source_url.trim()} target="_blank" rel="noreferrer" className="label" style={{ color: "var(--accent-bright)", textDecoration: "none" }}>
                  Open ↗
                </a>
              )}
            </div>
            <input className="input" type="url" placeholder="https://…" value={form.source_url} onChange={(e) => set("source_url", e.target.value)} />
          </div>

          <div className="grow" />
          <div className="row between gap10">
            <button type="button" className="btn ghost" onClick={() => onDelete(opp.id)}><Icon name="trash" size={15} /> Delete</button>
            <button className="btn primary" disabled={!dirty || !form.title.trim()} style={{ opacity: !dirty || !form.title.trim() ? .55 : 1 }}>Save changes</button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function App({ initialOpportunities = [], initialArtistProfile = null, userId, userEmail, initialError = "" }) {
  const supabase = createClient();
  const isMobile = useIsMobile();
  const [view, setView] = useState("board");
  const [opps, setOpps] = useState(initialOpportunities);
  const [artistProfile, setArtistProfile] = useState(initialArtistProfile);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState(null);
  const [dataError, setDataError] = useState(initialError);
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantHistory, setAssistantHistory] = useState([]);
  const [assistantPending, setAssistantPending] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("");

  const trackedOpps = useMemo(() => opps.filter((o) => o.status !== "suggested"), [opps]);
  const suggestedOpps = useMemo(() => opps.filter((o) => o.status === "suggested"), [opps]);

  const visibleOpps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trackedOpps;
    return trackedOpps.filter((o) => [o.title, o.org, o.deadline].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [trackedOpps, query]);

  const createOpp = async (opp) => {
    setDataError("");
    const payload = {
      title: opp.title,
      org: opp.org || null,
      deadline: opp.deadline || null,
      stage: opp.stage || "found",
      user_id: userId,
    };

    const { data, error } = await supabase
      .from("opportunities")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setDataError(error.message);
      return;
    }

    setOpps((list) => [...list, data]);
    setAdding(false);
    setView("board");
  };

  const moveOpp = async (id, stage) => {
    const previous = opps;
    setOpps((list) => list.map((o) => o.id === id ? { ...o, stage } : o));
    setDataError("");

    const { error } = await supabase
      .from("opportunities")
      .update({ stage, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setOpps(previous);
      setDataError(error.message);
    }
  };

  const updateOpp = async (id, edits) => {
    setDataError("");
    const payload = {
      ...edits,
      org: edits.org || null,
      deadline: edits.deadline || null,
      source_url: edits.source_url?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("opportunities")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      setDataError(error.message);
      return;
    }

    setOpps((list) => list.map((o) => o.id === id ? data : o));
    setDetail(null);
  };

  const deleteOpp = async (id) => {
    const previous = opps;
    setOpps((list) => list.filter((o) => o.id !== id));
    setDetail(null);
    setDataError("");

    const { error } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", id);

    if (error) {
      setOpps(previous);
      setDataError(error.message);
    }
  };

  const confirmOpp = async (id) => {
    const previous = opps;
    setOpps((list) => list.map((o) => o.id === id ? { ...o, status: "tracked" } : o));
    setDataError("");

    const { error } = await supabase
      .from("opportunities")
      .update({ status: "tracked", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setOpps(previous);
      setDataError(error.message);
    }
  };

  const saveArtistProfile = async (profile) => {
    setDataError("");
    const payload = { ...profile, user_id: userId, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from("artist_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      setDataError(error.message);
      return;
    }

    setArtistProfile(data);
  };

  const sendAssistantMessage = async (message) => {
    const userMessage = { id: crypto.randomUUID(), role: "user", content: message };
    const assistantId = crypto.randomUUID();
    let streamedText = "";

    const updateAssistantMessage = (edits) => {
      setAssistantMessages((list) => list.map((item) => item.id === assistantId ? { ...item, ...edits } : item));
    };

    const appendAssistantText = (text) => {
      streamedText += text;
      setAssistantMessages((list) => list.map((item) => (
        item.id === assistantId ? { ...item, content: `${item.content || ""}${text}` } : item
      )));
    };

    const upsertToolCall = (tool) => {
      setAssistantMessages((list) => list.map((item) => {
        if (item.id !== assistantId) return item;

        const tools = Array.isArray(item.tools) ? item.tools : [];
        const index = tools.findIndex((existing) => existing.id === tool.id);
        const nextTool = { ...tool, updatedAt: Date.now() };

        if (index === -1) return { ...item, tools: [...tools, nextTool] };

        return {
          ...item,
          tools: tools.map((existing, existingIndex) => existingIndex === index ? { ...existing, ...nextTool } : existing),
        };
      }));
    };

    const handleStreamEvent = (event) => {
      if (event.type === "delta" && event.text) {
        appendAssistantText(String(event.text));
        return;
      }

      if (event.type === "reasoning_delta" && event.text) {
        setAssistantMessages((list) => list.map((item) => (
          item.id === assistantId ? { ...item, reasoningSummary: `${item.reasoningSummary || ""}${String(event.text)}`, thinking: true } : item
        )));
        return;
      }

      if (event.type === "reasoning_done") {
        setAssistantMessages((list) => list.map((item) => (
          item.id === assistantId ? { ...item, reasoningSummary: String(event.text || item.reasoningSummary || "") } : item
        )));
        return;
      }

      if (event.type === "tool") {
        upsertToolCall(event);
        if (event.message) setAssistantStatus(String(event.message));
        return;
      }

      if (event.type === "status" && event.message) {
        setAssistantStatus(String(event.message));
        return;
      }

      if (event.type === "final") {
        setAssistantHistory(event.history || []);
        if (Array.isArray(event.opportunities)) setOpps(event.opportunities);
        if (!streamedText.trim()) updateAssistantMessage({ content: String(event.output || "Done.") });
        updateAssistantMessage({ thinking: false });
        setAssistantStatus("");
        return;
      }

      if (event.type === "error") {
        throw new Error(event.error || "Assistant failed.");
      }
    };

    setAssistantMessages((list) => [...list, userMessage, { id: assistantId, role: "assistant", content: "", reasoningSummary: "", thinking: true }]);
    setAssistantPending(true);
    setAssistantStatus("Coda is thinking…");
    setDataError("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: assistantHistory }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        let errorMessage = "Assistant failed.";
        if (contentType.includes("application/json")) {
          const payload = await response.json();
          errorMessage = payload?.error || errorMessage;
        } else {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (!response.body) throw new Error("Assistant response did not include a stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processStreamBuffer = (flush = false) => {
        const lines = buffer.split("\n");
        buffer = flush ? "" : lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          handleStreamEvent(JSON.parse(trimmed));
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        processStreamBuffer(false);
      }

      buffer += decoder.decode();
      processStreamBuffer(true);
    } catch (error) {
      updateAssistantMessage({
        content: error.message || "Assistant failed.",
        error: true,
        thinking: false,
      });
    } finally {
      setAssistantPending(false);
      setAssistantStatus("");
    }
  };

  return (
    <div className={isMobile ? "col" : "row"} style={{ height: "100dvh", overflow: "hidden", alignItems: "stretch" }}>
      {!isMobile && <Sidebar view={view} setView={setView} userEmail={userEmail} />}
      <main className="col grow" style={{ height: "100%", minWidth: 0, minHeight: 0 }}>
        <Header view={view} count={view === "discover" ? suggestedOpps.length : trackedOpps.length} query={query} setQuery={setQuery} onAdd={() => setAdding(true)} isMobile={isMobile} />
        {dataError && (
          <div style={{ padding: isMobile ? "10px 16px 0" : "10px 28px 0" }}>
            <div className="card tx3" style={{ padding: 12, borderColor: "var(--accent-line)", background: "var(--accent-soft)", fontSize: 13 }}>
              Database error: {dataError}
            </div>
          </div>
        )}
        <div className="grow" style={{ minHeight: 0 }}>
          {view === "board" && <Board opps={visibleOpps} onOpen={setDetail} onMove={moveOpp} onAdd={() => setAdding(true)} isMobile={isMobile} />}
          {view === "calendar" && (query && opps.length && !visibleOpps.length ? <SmallEmpty title="No matching deadlines" body="Clear search or try a different term." /> : <CalendarView opps={visibleOpps} onOpen={setDetail} isMobile={isMobile} />)}
          {view === "gallery" && (query && opps.length && !visibleOpps.length ? <SmallEmpty title="No matching opportunities" body="Clear search or try a different term." /> : <GalleryView opps={visibleOpps} onOpen={setDetail} isMobile={isMobile} />)}
          {view === "discover" && <DiscoverView opps={suggestedOpps} onConfirm={confirmOpp} onDismiss={deleteOpp} isMobile={isMobile} />}
          {view === "assistant" && <AssistantView messages={assistantMessages} pending={assistantPending} status={assistantStatus} onSend={sendAssistantMessage} isMobile={isMobile} />}
          {view === "artist_profile" && <ArtistProfileView profile={artistProfile} onSave={saveArtistProfile} isMobile={isMobile} userEmail={userEmail} />}
        </div>
      </main>
      {isMobile && <MobileNav view={view} setView={setView} />}
      {adding && <AddDialog onClose={() => setAdding(false)} onCreate={createOpp} isMobile={isMobile} />}
      {detail && <DetailDrawer opp={opps.find((o) => o.id === detail.id) || detail} onClose={() => setDetail(null)} onUpdate={updateOpp} onDelete={deleteOpp} isMobile={isMobile} />}
    </div>
  );
}

export default App;
