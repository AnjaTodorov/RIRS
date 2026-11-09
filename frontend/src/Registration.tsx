import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  Search,
} from "lucide-react";
import { AuthLayout, PasswordInput } from "./ui";

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
  { name: "password", label: "Geslo", autoComplete: "new-password", max: 128 },
];
export function Registration() {
  const [role, setRole] = useState(() =>
    new URLSearchParams(window.location.search).get("role") === "ADVERTISER"
      ? "ADVERTISER"
      : "SEEKER",
  );
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
    if (fragment.has("access_token") || fragment.has("error"))
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
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
    <AuthLayout mode="register">
      {result ? (
        <div className="auth-success">
          <span className="success-orbit">
            {result.requiresEmailConfirmation ? (
              <Mail size={31} />
            ) : (
              <CheckCircle2 size={31} />
            )}
          </span>
          <p className="eyebrow">DOBRODOŠLI V DOMORI</p>
          <h1 ref={successHeading} tabIndex={-1}>
            {result.requiresEmailConfirmation
              ? "Preverite svoj e-poštni nabiralnik."
              : "Vaš račun je pripravljen."}
          </h1>
          <p>{result.message}</p>
          {result.requiresEmailConfirmation && (
            <p className="lead-muted">
              Odprite potrditveno povezavo v sporočilu. Če ga ne najdete,
              preverite tudi vsiljeno pošto.
            </p>
          )}
          <a className="button button-primary" href="/prijava">
            Na prijavo <ArrowRight size={17} />
          </a>
          <a className="text-link" href="/nepremicnine">
            Raziščite nepremičnine
          </a>
        </div>
      ) : (
        <>
          <p className="eyebrow">VAŠ NOVI ZAČETEK</p>
          <h1>
            Ustvarite račun<span className="sage-period">.</span>
          </h1>
          <p className="auth-description">
            En račun. Več možnosti za vaš naslednji korak.
          </p>
          <form onSubmit={submit} aria-label="Registracija" aria-busy={pending}>
            <fieldset className="role-fieldset" disabled={pending}>
              <legend>Kako boste uporabljali Domoro?</legend>
              <div className="role-options">
                {[
                  {
                    value: "SEEKER",
                    title: "Iščem nepremičnino",
                    note: "Iskalec nepremičnine",
                    Icon: Search,
                  },
                  {
                    value: "ADVERTISER",
                    title: "Oglašujem nepremičnino",
                    note: "Oglaševalec",
                    Icon: Building2,
                  },
                ].map(({ value, title, note, Icon }) => (
                  <label
                    key={value}
                    className={`role-card ${role === value ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                    />
                    <Icon size={21} strokeWidth={1.5} />
                    <strong>{title}</strong>
                    <small>{note}</small>
                  </label>
                ))}
              </div>
              {errors.role && <p className="field-error">{errors.role}</p>}
            </fieldset>
            {message && (
              <div
                className="notice notice-error"
                role="alert"
                ref={errorSummary}
                tabIndex={-1}
              >
                {message}
              </div>
            )}
            <div className="form-grid">
              {fields.map((field) => (
                <div
                  className={`field ${["email", "password"].includes(field.name) ? "field-full" : ""}`}
                  key={field.name}
                >
                  <label htmlFor={field.name}>{field.label}</label>
                  {field.name === "password" ? (
                    <PasswordInput
                      id={field.name}
                      name={field.name}
                      autoComplete={field.autoComplete}
                      required
                      minLength={8}
                      maxLength={field.max}
                      disabled={pending}
                      aria-invalid={!!errors[field.name]}
                      aria-describedby={
                        errors[field.name]
                          ? `${field.name}-error`
                          : "password-hint"
                      }
                    />
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type || "text"}
                      autoComplete={field.autoComplete}
                      required
                      maxLength={field.max}
                      disabled={pending}
                      aria-invalid={!!errors[field.name]}
                      aria-describedby={
                        errors[field.name] ? `${field.name}-error` : undefined
                      }
                    />
                  )}{" "}
                  {errors[field.name] ? (
                    <p id={`${field.name}-error`} className="field-error">
                      {errors[field.name]}
                    </p>
                  ) : (
                    field.name === "password" && (
                      <p id="password-hint" className="field-hint">
                        <KeyRound size={12} /> Vsaj 8 znakov za varen začetek.
                      </p>
                    )
                  )}
                </div>
              ))}
            </div>
            <button
              className="button button-primary button-full"
              type="submit"
              disabled={pending}
            >
              {pending ? (
                <>
                  <LoaderCircle size={17} className="spin" />
                  Ustvarjanje računa …
                </>
              ) : (
                <>
                  Ustvari račun <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            Že imate račun? <a href="/prijava">Prijavite se</a>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
