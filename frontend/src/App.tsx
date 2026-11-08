import { useState, type FormEvent } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { Registration } from "./Registration";
import { SessionProvider, useSession, request } from "./session";
import "./app.css";

export function Login() {
  const { client, profile, loading, error: connectionError } = useSession();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  if (profile) return <Navigate to="/" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const { error } = await client.auth.signInWithPassword({
        email: String(data.get("email")).trim(),
        password: String(data.get("password")),
      });
      if (error)
        setError(
          error.code === "email_not_confirmed"
            ? "Najprej potrdite e-poštni naslov."
            : "Prijava ni uspela. Preverite e-poštni naslov in geslo.",
        );
      else navigate("/");
    } catch {
      setError("Prijava trenutno ni na voljo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-card">
      <span className="eyebrow">DOBRODOŠLI NAZAJ</span>
      <h1>Prijavite se v Domoro</h1>
      <p>Vaši oglasi, termini in novi začetki na enem mestu.</p>
      <form onSubmit={submit} className="stack">
        <label>
          E-poštni naslov
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Geslo
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {(error || connectionError) && (
          <p role="alert" className="field-error">
            {error || connectionError}
          </p>
        )}
        <button disabled={!client || busy || loading}>
          {busy ? "Prijavljanje …" : "Prijava"}
        </button>
      </form>
      <p>
        Še nimate računa? <Link to="/registracija">Ustvarite račun</Link>
      </p>
    </section>
  );
}
function ProfilePage() {
  const { profile, session, reload, loading } = useSession();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) return <p role="status">Nalaganje …</p>;
  if (!profile || !session) return <Navigate to="/prijava" replace />;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await request("/profile", session!.access_token, {
        method: "PATCH",
        body: JSON.stringify(
          Object.fromEntries(new FormData(event.currentTarget)),
        ),
      });
      await reload();
      setMessage("Profil je posodobljen.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-card">
      <span className="eyebrow">MOJ RAČUN</span>
      <h1>Vaš profil</h1>
      <p>
        Vloga:{" "}
        {profile.role === "SEEKER"
          ? "Iskalec"
          : profile.role === "ADVERTISER"
            ? "Oglaševalec"
            : "Administrator"}
      </p>
      <form onSubmit={save} className="stack">
        {(
          [
            ["firstName", "Ime"],
            ["lastName", "Priimek"],
            ["username", "Uporabniško ime"],
            ["phoneNumber", "Telefonska številka"],
          ] as const
        ).map(([name, label]) => (
          <label key={name}>
            {label}
            <input
              name={name}
              defaultValue={profile[name]}
              required
              maxLength={
                name === "username" ? 64 : name === "phoneNumber" ? 40 : 100
              }
            />
          </label>
        ))}
        <button disabled={busy}>Shrani spremembe</button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
function Shell() {
  const { profile, client, loading, error } = useSession();
  return (
    <div className="application">
      <header className="app-header">
        <Link to="/" className="brand">
          domora<span className="brand-dot">.</span>
        </Link>
        <nav aria-label="Glavna navigacija">
          <Link to="/">Nepremičnine</Link>
          {profile ? (
            <>
              <Link to="/profil">{profile.firstName}</Link>
              <button
                className="text-button"
                onClick={() => client?.auth.signOut()}
              >
                Odjava
              </button>
            </>
          ) : (
            <>
              <Link to="/prijava">Prijava</Link>
              <Link to="/registracija">Registracija</Link>
            </>
          )}
        </nav>
      </header>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <Routes>
        <Route path="/prijava" element={<Login />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route
          path="/"
          element={
            <section className="hero">
              <span className="eyebrow">VAŠ NASLEDNJI KORAK</span>
              <h1>Prostor za vaše načrte.</h1>
              <p>
                {loading
                  ? "Nalaganje …"
                  : profile
                    ? `Dobrodošli, ${profile.firstName}.`
                    : "Poiščite svoj naslednji dom."}
              </p>
            </section>
          }
        />
        <Route
          path="*"
          element={
            <p>
              Stran ne obstaja. <Link to="/">Domov</Link>
            </p>
          }
        />
      </Routes>
    </div>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/registracija"
          element={
            <>
              <Registration />
              <p className="registration-login">
                Že imate račun? <Link to="/prijava">Prijavite se</Link> ·{" "}
                <Link to="/">Domov</Link>
              </p>
            </>
          }
        />
        <Route
          path="*"
          element={
            <SessionProvider>
              <Shell />
            </SessionProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
