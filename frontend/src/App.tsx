import { useEffect, useState, type FormEvent } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  FileCheck2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings2,
  ShieldCheck,
  UserRound,
  X,
  LoaderCircle,
  KeyRound,
} from "lucide-react";
import { Registration } from "./Registration";
import { SessionProvider, useSession, request, ApiError } from "./session";
import { HomePage } from "./HomePage";
import {
  Catalog,
  MyProperties,
  ListingEditor,
  PropertyPage,
  AdminProperties,
} from "./Listings";
import { MyViewings, ReceivedRequestsPage } from "./Viewings";
import { DashboardOverview } from "./Dashboard";
import {
  AuthLayout,
  Brand,
  Loading,
  Modal,
  Notice,
  PageHeading,
  PasswordInput,
  roleLabels,
} from "./ui";

export function Login() {
  const { client, profile, loading, error: connectionError } = useSession();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/nepremicnine/")
      ? location.state.from
      : "/";
  if (profile) return <Navigate to={returnTo} replace />;
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
      else navigate(returnTo);
    } catch {
      setError("Prijava trenutno ni na voljo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout mode="login">
      <span className="auth-welcome-icon">
        <KeyRound size={25} strokeWidth={1.4} />
      </span>
      <p className="eyebrow">DOBRODOŠLI NAZAJ</p>
      <h1>
        Prijavite se v Domoro<span className="sage-period">.</span>
      </h1>
      <p className="auth-description">
        Vaši prostori. Vaši načrti. Vse na enem mestu.
      </p>
      <form onSubmit={submit} className="stack">
        <div className="field">
          <label htmlFor="login-email">E-poštni naslov</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vas@naslov.si"
            required
            disabled={busy}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Geslo</label>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            placeholder="Vnesite svoje geslo"
            required
            disabled={busy}
          />
        </div>
        {(error || connectionError) && (
          <Notice tone="error">{error || connectionError}</Notice>
        )}
        <button
          className="button button-primary button-full"
          disabled={!client || busy || loading}
        >
          {busy ? (
            <>
              <LoaderCircle className="spin" size={18} />
              Prijavljanje …
            </>
          ) : (
            <>
              Prijava <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      <p className="auth-switch">
        Še nimate računa? <Link to="/registracija">Ustvarite račun</Link>
      </p>
    </AuthLayout>
  );
}
export function ProfilePage() {
  const { profile, session, reload, loading } = useSession();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  if (loading) return <Loading />;
  if (!profile || !session) return <Navigate to="/prijava" replace />;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    setFields({});
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
      setError((e as Error).message);
      if (e instanceof ApiError) setFields(e.fields);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="NASTAVITVE RAČUNA"
        title="Vaš profil"
        description="Majhne spremembe, da ostanemo povezani."
      />
      <div className="profile-layout">
        <aside className="profile-summary panel">
          <div className="profile-avatar">
            {profile.firstName.slice(0, 1)}
            {profile.lastName.slice(0, 1)}
          </div>
          <h2>
            {profile.firstName} {profile.lastName}
          </h2>
          <p>@{profile.username}</p>
          <span className="role-tag">
            <UserRound size={13} />
            {roleLabels[profile.role]}
          </span>
          <div className="profile-privacy">
            <ShieldCheck size={22} />
            <p>Vaši kontaktni podatki so del vašega zasebnega profila.</p>
          </div>
        </aside>
        <section className="panel profile-form">
          <div className="section-heading">
            <span className="section-icon">
              <UserRound size={21} />
            </span>
            <div>
              <h2>Osebni podatki</h2>
              <p>Posodobite podatke svojega računa.</p>
            </div>
          </div>
          <form onSubmit={save}>
            <div className="form-grid">
              {(
                [
                  ["firstName", "Ime"],
                  ["lastName", "Priimek"],
                  ["username", "Uporabniško ime"],
                  ["phoneNumber", "Telefonska številka"],
                ] as const
              ).map(([name, label]) => (
                <div className="field" key={name}>
                  <label htmlFor={name}>{label}</label>
                  <input
                    id={name}
                    name={name}
                    defaultValue={profile[name]}
                    required
                    maxLength={
                      name === "username"
                        ? 64
                        : name === "phoneNumber"
                          ? 40
                          : 100
                    }
                    disabled={busy}
                    aria-invalid={!!fields[name]}
                  />
                  {fields[name] && (
                    <p className="field-error">{fields[name]}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="readonly-role">
              <ShieldCheck size={18} />
              <div>
                <strong>Vloga računa</strong>
                <span>
                  {roleLabels[profile.role]} · vloge ni mogoče spreminjati v
                  profilu.
                </span>
              </div>
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            {message && <Notice tone="success">{message}</Notice>}
            <div className="form-footer">
              <span>Spremembe veljajo samo za vaš račun.</span>
              <button className="button button-primary" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Check size={17} />
                )}
                Shrani spremembe
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
export function publishAction(
  profile: ReturnType<typeof useSession>["profile"],
) {
  return profile?.role === "ADVERTISER"
    ? { to: "/moji-oglasi", label: "Objavi oglas" }
    : profile?.role === "ADMIN"
      ? { to: "/pregled", label: "Pregled oglasov" }
      : profile
        ? { to: "/nepremicnine", label: "Raziščite ponudbo" }
        : { to: "/registracija?role=ADVERTISER", label: "Objavi oglas" };
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Brand />
          <p>
            Vsak dom ima svojo zgodbo.
            <br />
            Poiščite prostor za svojo.
          </p>
        </div>
        <div className="footer-column">
          <span>RAZIŠČITE</span>
          <Link to="/nepremicnine">Nepremičnine</Link>
          <Link to="/nepremicnine?listingType=SALE">Nakup</Link>
          <Link to="/nepremicnine?listingType=RENT">Najem</Link>
        </div>
        <div className="footer-column">
          <span>VAŠ PROSTOR</span>
          <Link to="/racun">Moj račun</Link>
          <Link to="/moji-ogledi">Moji ogledi</Link>
          <Link to="/registracija?role=ADVERTISER">Za oglaševalce</Link>
        </div>
        <div className="footer-note">
          <span className="leaf-mark">⌁</span>
          <p>
            Manj iskanja.
            <br />
            <strong>Več občutka doma.</strong>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© Domora. Prostor za nove začetke.</span>
        <span>Premišljeno. Preprosto. Po vaše.</span>
      </div>
    </footer>
  );
}
function Shell() {
  const { profile, client, session, loading, error } = useSession();
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const workspace =
    /^\/(racun|profil|moji-oglasi|oglasi|moji-ogledi|pregled|prejete-zahteve)(\/|$)/.test(
      location.pathname,
    );
  const authPage =
    location.pathname === "/prijava" || location.pathname === "/registracija";
  const role = profile?.role;
  const publish = publishAction(profile);
  const workspaceLinks = [
    { to: "/racun", label: "Pregled", Icon: LayoutDashboard },
    ...(role === "ADVERTISER"
      ? [
          { to: "/moji-oglasi", label: "Moji oglasi", Icon: Home },
          {
            to: "/prejete-zahteve",
            label: "Prejete zahteve",
            Icon: CalendarDays,
          },
        ]
      : []),
    ...(role === "ADMIN"
      ? [{ to: "/pregled", label: "Pregled oglasov", Icon: FileCheck2 }]
      : [{ to: "/moji-ogledi", label: "Moji ogledi", Icon: CalendarDays }]),
    { to: "/profil", label: "Moj profil", Icon: Settings2 },
  ];
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
    const titles: Record<string, string> = {
      "/": "Prostor za nove začetke",
      "/nepremicnine": "Nepremičnine",
      "/prijava": "Prijava",
      "/registracija": "Ustvarite račun",
      "/racun": "Moj račun",
      "/moji-oglasi": "Moji oglasi",
      "/moji-ogledi": "Moji ogledi",
      "/pregled": "Pregled oglasov",
      "/profil": "Moj profil",
      "/prejete-zahteve": "Prejete zahteve",
    };
    document.title = `${titles[location.pathname] || (location.pathname.endsWith("/uredi") ? "Urejanje oglasa" : "Podrobnosti oglasa")} | Domora`;
  }, [location.pathname]);
  async function logout() {
    setSignOutError("");
    try {
      const response = await client?.auth.signOut({ scope: "local" });
      if (response?.error)
        setSignOutError("Odjava ni uspela. Poskusite znova.");
    } catch {
      setSignOutError("Odjava ni uspela. Poskusite znova.");
    }
  }
  const routes = (
    <Routes>
      <Route path="/registracija" element={<Registration />} />
      <Route path="/prijava" element={<Login />} />
      <Route
        path="/"
        element={
          location.search ? (
            <Navigate to={`/nepremicnine${location.search}`} replace />
          ) : (
            <HomePage />
          )
        }
      />
      <Route path="/nepremicnine" element={<Catalog />} />
      <Route path="/nepremicnine/:id" element={<PropertyPage />} />
      <Route path="/racun" element={<DashboardOverview />} />
      <Route path="/moji-oglasi" element={<MyProperties />} />
      <Route path="/oglasi/:id/uredi" element={<ListingEditor />} />
      <Route path="/pregled" element={<AdminProperties />} />
      <Route path="/pregled/:id" element={<PropertyPage review />} />
      <Route path="/moji-ogledi" element={<MyViewings />} />
      <Route path="/prejete-zahteve" element={<ReceivedRequestsPage />} />
      <Route path="/profil" element={<ProfilePage />} />
      <Route
        path="*"
        element={
          <div className="content-width not-found">
            <p className="eyebrow">404 · IZVEN ZAČRTANE POTI</p>
            <h1>Ta prostor še ne obstaja.</h1>
            <p>Naj vas odpeljemo nazaj do ponudbe?</p>
            <Link className="button button-primary" to="/nepremicnine">
              Raziščite nepremičnine <ArrowRight size={17} />
            </Link>
          </div>
        }
      />
    </Routes>
  );
  if (authPage) return routes;
  const navLinks = workspace
    ? workspaceLinks
    : [
        { to: "/nepremicnine", label: "Nepremičnine", Icon: Home },
        { to: "/nepremicnine?listingType=SALE", label: "Nakup", Icon: Home },
        { to: "/nepremicnine?listingType=RENT", label: "Najem", Icon: Home },
      ];
  return (
    <>
      <a className="skip-link" href="#main-content">
        Preskoči na vsebino
      </a>
      {workspace ? (
        <div className="workspace">
          <aside className="workspace-sidebar">
            <Brand />
            <div className="sidebar-label">VAŠ PROSTOR</div>
            <nav aria-label="Glavna navigacija">
              {workspaceLinks.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    isActive ? "sidebar-link active" : "sidebar-link"
                  }
                >
                  <Icon size={19} strokeWidth={1.6} />
                  {label}
                  <ChevronRight className="nav-chevron" size={15} />
                </NavLink>
              ))}
            </nav>
            <div className="sidebar-help">
              <span className="eyebrow">DOM, PO VAŠE</span>
              <p>
                Vaš naslednji korak
                <br />
                je lahko nov začetek.
              </p>
              <Link to="/nepremicnine">
                Raziščite ponudbo <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="sidebar-bottom">
              <Link to="/nepremicnine" className="sidebar-link">
                <ArrowLeft size={17} />
                Nazaj na ponudbo
              </Link>
              {session && (
                <button className="sidebar-link" onClick={logout}>
                  <LogOut size={17} />
                  Odjava
                </button>
              )}
              <div className="sidebar-person">
                <span className="avatar">
                  {profile?.firstName.slice(0, 1) || "D"}
                </span>
                <div>
                  <strong>
                    {profile
                      ? `${profile.firstName} ${profile.lastName}`
                      : "Vaš račun"}
                  </strong>
                  <span>
                    {profile ? roleLabels[profile.role] : "Prijava v račun"}
                  </span>
                </div>
              </div>
            </div>
          </aside>
          <div className="workspace-body">
            <header className="workspace-topbar">
              <button
                className="icon-button workspace-mobile-menu"
                aria-label="Odpri navigacijo"
                onClick={() => setMobile(true)}
              >
                <Menu size={22} />
              </button>
              <div>
                <span className="topbar-crumb">
                  Moj račun <ChevronRight size={13} />{" "}
                  <strong>
                    {workspaceLinks.find((l) => l.to === location.pathname)
                      ?.label || "Upravljanje oglasa"}
                  </strong>
                </span>
              </div>
              <div className="topbar-actions">
                <Link to="/nepremicnine" className="text-link">
                  Na ponudbo <ArrowUpRight size={15} />
                </Link>
                {session && (
                  <button
                    className="icon-button workspace-mobile-menu"
                    aria-label="Odjava"
                    onClick={logout}
                  >
                    <LogOut size={18} />
                  </button>
                )}
                <span className="avatar avatar-small">
                  {profile?.firstName.slice(0, 1) || "D"}
                </span>
              </div>
            </header>
            <main id="main-content" className="workspace-content">
              {(error || signOutError) && (
                <Notice tone="error">{error || signOutError}</Notice>
              )}
              {routes}
            </main>
            <div className="workspace-footer">
              Domora · Vaš prostor, pregledno urejen.
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className="public-header">
            <div className="header-inner">
              <Brand />
              <nav className="public-nav" aria-label="Glavna navigacija">
                <NavLink to="/nepremicnine">Nepremičnine</NavLink>
                <Link to="/nepremicnine?listingType=SALE">Nakup</Link>
                <Link to="/nepremicnine?listingType=RENT">Najem</Link>
              </nav>
              <div className="header-actions">
                {profile ? (
                  <>
                    <Link className="account-pill" to="/racun">
                      <span className="avatar avatar-small">
                        {profile.firstName.slice(0, 1)}
                      </span>
                      <span>Moj račun</span>
                    </Link>
                    <button
                      className="icon-button logout-button"
                      aria-label="Odjava"
                      onClick={logout}
                    >
                      <LogOut size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="header-login" to="/prijava">
                      <UserRound size={17} />
                      Prijava
                    </Link>
                    <Link
                      className="button button-sage header-publish"
                      to={publish.to}
                    >
                      <Plus size={16} /> {publish.label}
                    </Link>
                  </>
                )}
                <button
                  className="icon-button mobile-menu-button"
                  aria-label="Odpri navigacijo"
                  onClick={() => setMobile(true)}
                >
                  <Menu size={22} />
                </button>
              </div>
            </div>
          </header>
          <main id="main-content">
            {(error || signOutError) && (
              <div className="content-width">
                <Notice tone="error">{error || signOutError}</Notice>
              </div>
            )}
            {routes}
          </main>
          <Footer />
        </>
      )}
      <Modal
        open={mobile}
        onClose={() => setMobile(false)}
        title={workspace ? "Vaš prostor" : "Raziščite Domoro"}
        className="mobile-nav-dialog"
      >
        <nav className="mobile-navigation">
          {navLinks.map(({ to, label, Icon }) => (
            <Link key={to} to={to} onClick={() => setMobile(false)}>
              <Icon size={20} />
              {label}
              <ArrowUpRight size={17} />
            </Link>
          ))}
          {!profile && (
            <>
              <Link to="/prijava" onClick={() => setMobile(false)}>
                <UserRound size={20} />
                Prijava
              </Link>
              <Link to="/registracija" onClick={() => setMobile(false)}>
                <Plus size={20} />
                Ustvarite račun
              </Link>
            </>
          )}
          {profile && (
            <Link to="/racun" onClick={() => setMobile(false)}>
              <LayoutDashboard size={20} />
              Moj račun
            </Link>
          )}
        </nav>
      </Modal>
    </>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Shell />
      </SessionProvider>
    </BrowserRouter>
  );
}
