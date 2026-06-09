import { login, signup } from "./actions";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const message = params?.message;

  return (
    <main className="col center" style={{ minHeight: "100vh", alignItems: "center", padding: 24, position: "relative", zIndex: 1 }}>
      <form className="card col gap14 fade" style={{ width: "min(420px, 100%)", padding: 24 }}>
        <div className="col" style={{ gap: 6, marginBottom: 6 }}>
          <div className="disp" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em" }}>Coda</div>
          <div className="tx3" style={{ fontSize: 14 }}>Sign in to save your opportunity pipeline.</div>
        </div>

        {error && (
          <div className="card" style={{ padding: 11, borderColor: "var(--accent-line)", background: "var(--accent-soft)", fontSize: 13 }}>
            {error}
          </div>
        )}

        {message && (
          <div className="card tx3" style={{ padding: 11, borderColor: "var(--border-2)", background: "var(--surface-2)", fontSize: 13 }}>
            {message}
          </div>
        )}

        <div className="col gap8">
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="col gap8">
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" minLength={6} required />
        </div>

        <div className="row gap10" style={{ marginTop: 4 }}>
          <button className="btn primary grow" style={{ justifyContent: "center" }} formAction={login}>Log in</button>
          <button className="btn ghost grow" style={{ justifyContent: "center" }} formAction={signup}>Sign up</button>
        </div>
      </form>
    </main>
  );
}
