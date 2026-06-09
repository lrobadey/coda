"use client";

import { useMemo, useState } from "react";
import { createClient } from "../../utils/supabase/client";

const STAGES = [
  { id: "found", label: "Discovered", color: "var(--tx-3)" },
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
];

const VIEW_TITLE = {
  board: { t: "Pipeline", s: "Drag opportunities between stages" },
  calendar: { t: "Timeline", s: "Everything by deadline" },
  gallery: { t: "All opportunities", s: "Your full tracked library" },
  discover: { t: "Discover", s: "Suggested · confirm to track" },
  assistant: { t: "Assistant", s: "Find, organize, and draft with Coda" },
};

function daysUntil(iso) {
  const day = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((day - now) / 86400000);
}

function stageLabel(id) {
  return STAGES.find((s) => s.id === id)?.label || "Discovered";
}

function Icon({ name, size = 18, stroke = "currentColor", sw = 1.9, fill = "none", style }) {
  const p = { fill, stroke, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    search: <g {...p}><circle cx="8" cy="8" r="5.2" /><path d="M12.5 12.5 L17 17" /></g>,
    plus: <g {...p}><path d="M10 4 V16 M4 10 H16" /></g>,
    x: <g {...p}><path d="M5 5 L15 15 M15 5 L5 15" /></g>,
    trash: <g {...p}><path d="M4 6 H16 M8 6 V4 H12 V6 M6 6 L7 16 H13 L14 6" /></g>,
    board: <g {...p}><rect x="3" y="4" width="4.4" height="12" rx="1" /><rect x="9.3" y="4" width="4.4" height="8" rx="1" /><rect x="15.6" y="4" width="2" height="12" rx="1" /></g>,
    cal: <g {...p}><rect x="3.2" y="4.5" width="13.6" height="12" rx="1.6" /><path d="M3.2 8 H16.8 M7 3 V6 M13 3 V6" /></g>,
    grid: <g {...p}><rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" /><rect x="11" y="3.5" width="5.5" height="5.5" rx="1" /><rect x="3.5" y="11" width="5.5" height="5.5" rx="1" /><rect x="11" y="11" width="5.5" height="5.5" rx="1" /></g>,
    compass: <g {...p}><circle cx="10" cy="10" r="7" /><path d="M13.2 6.8 L8.4 8.4 L6.8 13.2 L11.6 11.6 Z" /></g>,
    message: <g {...p}><path d="M4 4.5 H16 V13 H9 L5.5 16 V13 H4 Z" /></g>,
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
    <button onClick={onClick} className="row gap10 between"
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

function Header({ view, count, query, setQuery, onAdd }) {
  const vt = VIEW_TITLE[view];
  return (
    <header className="row between" style={{ padding: "16px 28px 14px", flex: "none", borderBottom: "1px solid var(--border)" }}>
      <div className="col" style={{ gap: 3 }}>
        <div className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{vt.t}</div>
        <div className="tx3" style={{ fontSize: 12.5 }}>{count} tracked · {vt.s}</div>
      </div>
      <div className="row gap10">
        <div className="row gap8" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", width: 180 }}>
          <Icon name="search" size={15} stroke="var(--tx-4)" />
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" style={{ border: "none", background: "transparent", padding: 0, fontSize: 13 }} />
        </div>
        <button className="btn ghost" style={{ padding: 9 }}><Icon name="bell" size={17} /></button>
        <button className="btn primary" onClick={onAdd}><Icon name="plus" size={15} stroke="#fff" /> Add</button>
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
      {opp.deadline && <div className="label" style={{ marginTop: 12 }}>Due {opp.deadline}</div>}
    </div>
  );
}

function Board({ opps, onOpen, onMove, onAdd }) {
  const [dragId, setDragId] = useState(null);
  return (
    <div className="row gap14 astart" style={{ padding: "8px 28px 28px", overflowX: "auto", height: "100%", alignItems: "stretch" }}>
      {STAGES.map((st) => {
        const items = opps.filter((o) => o.stage === st.id);
        return (
          <div key={st.id} className="col" style={{ width: 280, flex: "none" }} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragId) onMove(dragId, st.id); setDragId(null); }}>
            <div className="row gap8" style={{ padding: "2px 6px 12px", flex: "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, flex: "none", background: st.color, boxShadow: `0 0 10px -1px ${st.color}` }} />
              <span className="disp" style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>{st.label}</span>
              <span className="mono tx4" style={{ fontSize: 12 }}>{items.length}</span>
            </div>
            <div className="card col gap10" style={{ padding: 10, flex: 1, minHeight: 140, background: "var(--bg-2)", borderColor: "var(--hairline)" }}>
              {items.map((opp) => <OppCard key={opp.id} opp={opp} onOpen={onOpen} onDragStart={() => setDragId(opp.id)} />)}
              {items.length === 0 && <div className="col center" style={{ alignItems: "center", padding: "26px 6px", gap: 8 }}><span className="label">drop here</span><button className="btn sm ghost" onClick={onAdd}><Icon name="plus" size={13} /> Add</button></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SmallEmpty({ title, body }) {
  return (
    <div className="fade" style={{ height: "100%", display: "grid", placeItems: "center", padding: 28 }}>
      <div className="card" style={{ width: "min(520px, 100%)", padding: 36, textAlign: "center" }}>
        <Icon name="search" size={26} stroke="var(--accent-bright)" />
        <div className="disp" style={{ fontSize: 18, fontWeight: 600, marginTop: 14 }}>{title}</div>
        <div className="tx3" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>{body}</div>
      </div>
    </div>
  );
}

function CalendarView({ opps, onOpen }) {
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
    <div className="fade col gap14" style={{ height: "100%", overflow: "auto", padding: "8px 28px 28px" }}>
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

function GalleryView({ opps, onOpen }) {
  if (!opps.length) return <EmptyView view="gallery" />;
  return (
    <div className="fade" style={{ height: "100%", overflow: "auto", padding: "8px 28px 28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {opps.map((opp) => (
          <div key={opp.id} className="card" onClick={() => onOpen(opp)} style={{ padding: 16, cursor: "pointer", minHeight: 150 }}>
            <div className="label">{stageLabel(opp.stage)}</div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, marginTop: 14, lineHeight: 1.2 }}>{opp.title}</div>
            {opp.org && <div className="tx3" style={{ fontSize: 13, marginTop: 8 }}>{opp.org}</div>}
            {opp.deadline && <div className="label" style={{ marginTop: 18 }}>Due {opp.deadline}</div>}
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
    <div className="fade" style={{ height: "100%", display: "grid", placeItems: "center", padding: 28 }}>
      <div className="card" style={{ width: "min(520px, 100%)", padding: 36, textAlign: "center" }}>
        <Icon name={view === "assistant" ? "message" : view === "discover" ? "compass" : "doc"} size={28} stroke="var(--accent-bright)" />
        <div className="disp" style={{ fontSize: 18, fontWeight: 600, marginTop: 14 }}>{empty[0]}</div>
        <div className="tx3" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>{empty[1]}</div>
      </div>
    </div>
  );
}

function AddDialog({ onClose, onCreate }) {
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
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10, display: "grid", placeItems: "center", background: "oklch(0.1 0.01 265 / 0.65)", padding: 20 }} onClick={onClose}>
      <form className="card col gap14" onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{ width: "min(460px, 100%)", padding: 20 }}>
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

function DetailDrawer({ opp, onClose, onUpdate, onDelete }) {
  const [form, setForm] = useState({ title: opp.title, org: opp.org || "", deadline: opp.deadline || "", stage: opp.stage || "found" });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const dirty = ["title", "org", "deadline", "stage"].some((key) => form[key] !== (opp[key] || (key === "stage" ? "found" : "")));
  const save = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onUpdate(opp.id, { ...form, title: form.title.trim() });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10, background: "oklch(0.1 0.01 265 / 0.55)" }} onClick={onClose}>
      <aside className="col" onClick={(e) => e.stopPropagation()} style={{ marginLeft: "auto", width: "min(420px, 100%)", height: "100%", background: "var(--bg)", borderLeft: "1px solid var(--border)", padding: 22, gap: 18 }}>
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

function App({ initialOpportunities = [], userId, userEmail, initialError = "" }) {
  const supabase = createClient();
  const [view, setView] = useState("board");
  const [opps, setOpps] = useState(initialOpportunities);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState(null);
  const [dataError, setDataError] = useState(initialError);

  const visibleOpps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return opps;
    return opps.filter((o) => [o.title, o.org, o.deadline].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [opps, query]);

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

  return (
    <div className="row" style={{ height: "100vh", overflow: "hidden", alignItems: "stretch" }}>
      <Sidebar view={view} setView={setView} userEmail={userEmail} />
      <main className="col grow" style={{ height: "100%", minWidth: 0 }}>
        <Header view={view} count={opps.length} query={query} setQuery={setQuery} onAdd={() => setAdding(true)} />
        {dataError && (
          <div style={{ padding: "10px 28px 0" }}>
            <div className="card tx3" style={{ padding: 12, borderColor: "var(--accent-line)", background: "var(--accent-soft)", fontSize: 13 }}>
              Database error: {dataError}
            </div>
          </div>
        )}
        <div className="grow" style={{ minHeight: 0 }}>
          {view === "board" && <Board opps={visibleOpps} onOpen={setDetail} onMove={moveOpp} onAdd={() => setAdding(true)} />}
          {view === "calendar" && (query && opps.length && !visibleOpps.length ? <SmallEmpty title="No matching deadlines" body="Clear search or try a different term." /> : <CalendarView opps={visibleOpps} onOpen={setDetail} />)}
          {view === "gallery" && (query && opps.length && !visibleOpps.length ? <SmallEmpty title="No matching opportunities" body="Clear search or try a different term." /> : <GalleryView opps={visibleOpps} onOpen={setDetail} />)}
          {(view === "discover" || view === "assistant") && <EmptyView view={view} />}
        </div>
      </main>
      {adding && <AddDialog onClose={() => setAdding(false)} onCreate={createOpp} />}
      {detail && <DetailDrawer opp={opps.find((o) => o.id === detail.id) || detail} onClose={() => setDetail(null)} onUpdate={updateOpp} onDelete={deleteOpp} />}
    </div>
  );
}

export default App;
