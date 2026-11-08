import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession, request } from "./session";
import { useResource, labels } from "./Listings";

const timeZone = "Europe/Ljubljana";
export const formatTime = (value: string) =>
  new Intl.DateTimeFormat("sl-SI", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
export function slovenianTimeToISO(value: string) {
  const [year, month, day, hour, minute] = value.split(/[-T:]/).map(Number);
  if (
    !year ||
    !month ||
    !day ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  )
    throw new Error("Vnesite veljaven datum in čas.");
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let guess = desired;
  const partsAt = (ms: number) =>
    Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(new Date(ms))
        .map((p) => [p.type, p.value]),
    );
  for (let i = 0; i < 3; i++) {
    const p = partsAt(guess);
    guess +=
      desired -
      Date.UTC(
        Number(p.year),
        Number(p.month) - 1,
        Number(p.day),
        Number(p.hour),
        Number(p.minute),
      );
  }
  const p = partsAt(guess);
  if (`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` !== value)
    throw new Error(
      "Ta lokalni čas ne obstaja zaradi premika ure. Izberite drug čas.",
    );
  return new Date(guess).toISOString();
}
const statusLabels: Record<string, string> = {
  PENDING: "Čaka na odgovor",
  CONFIRMED: "Potrjeno",
  REJECTED: "Zavrnjeno",
  CANCELLED: "Preklicano",
};
type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
};
export function ViewingPanel({
  propertyId,
  isOwner,
}: {
  propertyId: string;
  isOwner: boolean;
}) {
  const { profile, session } = useSession();
  const slots = useResource<Slot[]>(`/properties/${propertyId}/slots`);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      await request(`/properties/${propertyId}/slots`, session?.access_token, {
        method: "POST",
        body: JSON.stringify({
          startsAt: slovenianTimeToISO(String(values.get("startsAt"))),
          endsAt: slovenianTimeToISO(String(values.get("endsAt"))),
        }),
      });
      form.reset();
      slots.reload();
      setMessage("Termin je dodan.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function book(slotId: string) {
    setBusy(true);
    setMessage("");
    try {
      await request(
        `/properties/${propertyId}/requests`,
        session?.access_token,
        { method: "POST", body: JSON.stringify({ slotId, message: note }) },
      );
      setMessage("Zahteva je oddana in čaka na odgovor oglaševalca.");
      slots.reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const eligible =
    profile && ["SEEKER", "ADVERTISER"].includes(profile.role) && !isOwner;
  return (
    <section className="viewing-section">
      <h2>Termini ogledov</h2>
      <p>Časi so prikazani v časovnem pasu Europe/Ljubljana.</p>
      {isOwner && (
        <form className="slot-form" onSubmit={add}>
          <label>
            Začetek (Europe/Ljubljana)
            <input name="startsAt" type="datetime-local" required />
          </label>
          <label>
            Konec (Europe/Ljubljana)
            <input name="endsAt" type="datetime-local" required />
          </label>
          <button disabled={busy}>Dodaj termin</button>
        </form>
      )}
      {eligible && (
        <label className="stack">
          Sporočilo oglaševalcu (neobvezno)
          <textarea
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </label>
      )}
      {!profile && (
        <p>
          Za oddajo zahteve se <Link to="/prijava">prijavite</Link>.
        </p>
      )}
      {slots.error && <p role="alert">{slots.error}</p>}
      {slots.loading ? (
        <p>Nalaganje terminov …</p>
      ) : (
        <>
          {!slots.value?.some((s) => s.available) && (
            <p>Ni razpoložljivih terminov.</p>
          )}
          <ul className="slot-list">
            {slots.value?.map((s) => (
              <li key={s.id}>
                <span>
                  {formatTime(s.startsAt)} – {formatTime(s.endsAt)}
                  <small>
                    {s.available ? "Prost termin" : "Zaseden termin"}
                  </small>
                </span>
                {eligible && (
                  <button
                    disabled={busy || !s.available}
                    onClick={() => book(s.id)}
                  >
                    Zahtevaj ogled
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <p role="status">{message}</p>
      {eligible && <Link to="/moji-ogledi">Spremljajte svoje zahteve →</Link>}
    </section>
  );
}
export function OwnerRequests({
  propertyId,
  active,
}: {
  propertyId: string;
  active: boolean;
}) {
  const { session } = useSession();
  const data = useResource<any[]>(`/properties/${propertyId}/requests`);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function decide(requestId: string, decision: "confirm" | "reject") {
    setBusy(true);
    setMessage("");
    try {
      await request(
        `/properties/${propertyId}/requests/${requestId}/decision`,
        session?.access_token,
        { method: "POST", body: JSON.stringify({ decision }) },
      );
      data.reload();
      setMessage("Odločitev je shranjena.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="viewing-section">
      <h2>Prejete zahteve</h2>
      {data.error && <p role="alert">{data.error}</p>}
      {data.value?.length ? (
        <ul className="request-list">
          {data.value.map((r) => (
            <li key={r.id}>
              <span className="badge">{statusLabels[r.status]}</span>
              <h3>
                {r.seeker.firstName} {r.seeker.lastName}
              </h3>
              <p>
                {formatTime(r.slot.startsAt)} – {formatTime(r.slot.endsAt)}
              </p>
              <p>
                {r.seeker.username} · {r.seeker.phoneNumber}
              </p>
              {r.message && <p className="description">{r.message}</p>}
              {active &&
                r.status === "PENDING" &&
                new Date(r.slot.startsAt) > new Date() && (
                  <div className="actions">
                    <button
                      disabled={busy}
                      onClick={() => decide(r.id, "confirm")}
                    >
                      Potrdi ogled
                    </button>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => decide(r.id, "reject")}
                    >
                      Zavrni zahtevo
                    </button>
                  </div>
                )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Ni prejetih zahtev.</p>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
export function CloseListing({
  propertyId,
  listingType,
  onClosed,
}: {
  propertyId: string;
  listingType: string | null;
  onClosed(): void;
}) {
  const { session } = useSession();
  const [status, setStatus] = useState("INACTIVE");
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function close(e: FormEvent) {
    e.preventDefault();
    if (!confirm) return;
    setBusy(true);
    try {
      await request(`/properties/${propertyId}/close`, session?.access_token, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      onClosed();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="close-section">
      <h2>Zaključek oglasa</h2>
      <p>
        Oglas bo odstranjen iz javnega prikaza. Prihodnje čakajoče in potrjene
        zahteve bodo preklicane.
      </p>
      <form className="stack" onSubmit={close}>
        <label>
          Način zaključka
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="INACTIVE">Umakni oglas</option>
            <option value={listingType === "SALE" ? "SOLD" : "RENTED"}>
              {listingType === "SALE"
                ? "Označi kot prodan"
                : "Označi kot oddan"}
            </option>
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            required
          />
          Potrjujem zaključek in preklic prihodnjih ogledov.
        </label>
        <button disabled={!confirm || busy}>Zaključi oglas</button>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
export function MyViewings() {
  const { profile, loading } = useSession();
  const data = useResource<any[]>("/my/requests");
  if (loading) return <p>Nalaganje …</p>;
  if (!profile) return <Navigate to="/prijava" replace />;
  if (profile.role === "ADMIN")
    return <p>Ta pogled je namenjen interesentom.</p>;
  return (
    <>
      <h1>Moji ogledi</h1>
      <p>Europe/Ljubljana · statusi se osvežijo ob ponovnem nalaganju.</p>
      <button className="secondary" onClick={data.reload}>
        Osveži statuse
      </button>
      {data.error && <p role="alert">{data.error}</p>}
      {data.value?.length ? (
        <ul className="request-list">
          {data.value.map((r) => (
            <li key={r.id}>
              <span className="badge">{statusLabels[r.status]}</span>
              <h2>
                {r.property.status === "PUBLISHED" ? (
                  <Link to={`/nepremicnine/${r.property.id}`}>
                    {r.property.title}
                  </Link>
                ) : (
                  r.property.title
                )}
              </h2>
              <p>
                {formatTime(r.slot.startsAt)} – {formatTime(r.slot.endsAt)}
              </p>
              <p>Javna lokacija: {r.property.publicLocation}</p>
              {r.property.exactAddress ? (
                <p className="confirmed-address">
                  Natančen naslov: <strong>{r.property.exactAddress}</strong>
                </p>
              ) : (
                <p className="muted">
                  Natančen naslov je na voljo samo pri potrjenem ogledu
                  aktivnega oglasa.
                </p>
              )}
              <p>Oglas: {labels[r.property.status]}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">Še nimate zahtev za ogled.</p>
      )}
    </>
  );
}
