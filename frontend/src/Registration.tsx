import { useEffect, useRef, useState, type FormEvent } from "react";

type Result = { message: string; requiresEmailConfirmation: boolean };
const fields = [
  { name: "firstName", label: "Ime", autoComplete: "given-name", max: 100 },
  { name: "lastName", label: "Priimek", autoComplete: "family-name", max: 100 },
  {
    name: "username",
    label: "Uporabniško ime",
    autoComplete: "username",
    max: 64,
  },
  {
    name: "phoneNumber",
    label: "Telefonska številka",
    autoComplete: "tel",
    type: "tel",
    max: 40,
  },
  {
    name: "email",
    label: "E-poštni naslov",
    autoComplete: "email",
    type: "email",
    max: 254,
  },
  {
    name: "password",
    label: "Geslo",
    autoComplete: "new-password",
    type: "password",
    max: 128,
  },
];

function HouseIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="m5 14 11-9 11 9v13H19v-9h-6v9H5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Registration() {
  const [role, setRole] = useState("SEEKER");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.get("type") === "signup" && fragment.has("access_token")) {
      setResult({
        message:
          "E-poštni naslov je potrjen. Vaš račun je pripravljen za prijavo.",
        requiresEmailConfirmation: false,
      });
    } else if (fragment.has("error")) {
      setMessage(
        "Potrditvena povezava ni veljavna ali je potekla. Preverite zadnje prejeto sporočilo.",
      );
    }
    // US-02 will manage sessions. Never retain callback tokens in the URL.
    if (fragment.has("access_token") || fragment.has("error")) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, []);

  useEffect(() => {
    if (result) successHeading.current?.focus();
  }, [result]);
  useEffect(() => {
    if (message) errorSummary.current?.focus();
  }, [message]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (String(data.password).length < 8) {
      setErrors({ password: "Geslo mora vsebovati vsaj 8 znakov." });
      setMessage("Preverite vnesene podatke.");
      return;
    }
    setPending(true);
    setErrors({});
    setMessage("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role }),
        signal: AbortSignal.timeout(25000),
      });
      const body = await response.json();
      if (!response.ok) {
        setErrors(body.fields || {});
        setMessage(body.message || "Registracija ni uspela. Poskusite znova.");
      } else {
        form.reset();
        setResult(body);
      }
    } catch {
      setMessage(
        "Povezava s strežnikom ni uspela. Preverite povezavo in poskusite znova.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <a className="brand" href="/" aria-label="Domora – začetna stran">
          <span className="brand-mark">
            <HouseIcon />
          </span>
          domora<span className="brand-dot">.</span>
        </a>
        <span className="header-note">
          <span className="small-dot" /> Vaš naslednji korak do doma
        </span>
      </header>
      <main className="layout">
        <aside className="intro" aria-labelledby="intro-title">
          <span className="eyebrow">PROSTOR ZA NOVE ZAČETKE</span>
          <h1 id="intro-title">
            Vsak dom ima <br />
            svojo zgodbo.
            <br />
            <em>Začnite svojo.</em>
          </h1>
          <p className="intro-copy">
            Poiščite prostor zase ali pomagajte nekomu najti njegovega. Vse se
            začne z vašim računom.
          </p>
          <div className="neighborhood" aria-hidden="true">
            <div className="sun" />
            <div className="building building-one">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="building building-two">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <b />
            </div>
            <div className="building building-three">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="tree">
              <span />
            </div>
            <div className="ground" />
          </div>
          <div className="intro-footer">
            <span className="tiny-house">
              <HouseIcon />
            </span>
            <p>
              Manj iskanja.
              <br />
              <strong>Več občutka, da ste doma.</strong>
            </p>
          </div>
        </aside>
        <section className="form-panel" aria-labelledby="form-title">
          {result ? (
            <div className="success">
              <span className="success-icon" aria-hidden="true">
                ✓
              </span>
              <span className="eyebrow">DOBRODOŠLI V DOMORI</span>
              <h2 id="form-title" ref={successHeading} tabIndex={-1}>
                {result.requiresEmailConfirmation
                  ? "Preverite svoj e-poštni nabiralnik."
                  : "Vaš račun je pripravljen."}
              </h2>
              <p>{result.message}</p>
              {result.requiresEmailConfirmation && (
                <p className="muted">
                  Odprite potrditveno povezavo v sporočilu. Če ga ne najdete,
                  preverite tudi vsiljeno pošto.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="form-heading">
                <span className="eyebrow">VAŠ NOVI ZAČETEK</span>
                <h2 id="form-title">Ustvarite račun</h2>
                <p>Nekaj podatkov in korak bližje ste svojemu cilju.</p>
              </div>
              <form
                onSubmit={submit}
                aria-label="Registracija"
                aria-busy={pending}
              >
                <fieldset className="role-fieldset" disabled={pending}>
                  <legend>Kako boste uporabljali Domoro?</legend>
                  <div className="roles">
                    <label
                      className={`role-option ${role === "SEEKER" ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="SEEKER"
                        checked={role === "SEEKER"}
                        onChange={() => setRole("SEEKER")}
                      />
                      <span>
                        <strong>Iščem nepremičnino</strong>
                        <small>Prostor za moje načrte</small>
                      </span>
                    </label>
                    <label
                      className={`role-option ${role === "ADVERTISER" ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="ADVERTISER"
                        checked={role === "ADVERTISER"}
                        onChange={() => setRole("ADVERTISER")}
                      />
                      <span>
                        <strong>Oglašujem nepremičnino</strong>
                        <small>Priložnost za nov začetek</small>
                      </span>
                    </label>
                  </div>
                  {errors.role && <p className="field-error">{errors.role}</p>}
                </fieldset>
                {message && (
                  <div
                    className="error-summary"
                    role="alert"
                    ref={errorSummary}
                    tabIndex={-1}
                  >
                    {message}
                  </div>
                )}
                <div className="fields">
                  {fields.map((field) => (
                    <div
                      key={field.name}
                      className={`field ${["email", "password"].includes(field.name) ? "wide" : ""}`}
                    >
                      <label htmlFor={field.name}>{field.label}</label>
                      <input
                        id={field.name}
                        name={field.name}
                        type={field.type || "text"}
                        autoComplete={field.autoComplete}
                        required
                        maxLength={field.max}
                        minLength={field.name === "password" ? 8 : undefined}
                        disabled={pending}
                        aria-invalid={!!errors[field.name]}
                        aria-describedby={
                          errors[field.name]
                            ? `${field.name}-error`
                            : field.name === "password"
                              ? "password-hint"
                              : undefined
                        }
                      />
                      {errors[field.name] ? (
                        <p id={`${field.name}-error`} className="field-error">
                          {errors[field.name]}
                        </p>
                      ) : (
                        field.name === "password" && (
                          <p id="password-hint" className="hint">
                            Uporabite vsaj 8 znakov.
                          </p>
                        )
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="submit-button"
                  type="submit"
                  disabled={pending}
                >
                  {pending ? (
                    "Ustvarjanje računa …"
                  ) : (
                    <>
                      Ustvari račun <span aria-hidden="true">↗</span>
                    </>
                  )}
                </button>
                <p className="form-note">
                  Vaši kontaktni podatki so del vašega zasebnega profila.
                </p>
              </form>
            </>
          )}
        </section>
      </main>
      <footer className="page-footer">
        <span>Domora · Nepremičnine in novi začetki</span>
        <span>Narejeno za vaš naslednji korak.</span>
      </footer>
    </div>
  );
}
