import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import { useSession, request } from "./session";
import {
  useResource,
  type Listing,
  type Slot,
  type PersonalRequest,
  type ReceivedRequest,
} from "./data";
import { Photo, PhotoFallback } from "./Listings";
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Loading,
  Modal,
  Notice,
  PageHeading,
  money,
  statusLabels,
} from "./ui";

const timeZone = "Europe/Ljubljana";
export const formatTime = (value: string) =>
  new Intl.DateTimeFormat("sl-SI", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
const dateOnly = (value: string) =>
  new Intl.DateTimeFormat("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(value));
const clockOnly = (value: string) =>
  new Intl.DateTimeFormat("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
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

export function ViewingPanel({
  propertyId,
  isOwner,
}: {
  propertyId: string;
  isOwner: boolean;
}) {
  const { profile, session } = useSession();
  const location = useLocation();
  const slots = useResource<Slot[]>(`/properties/${propertyId}/slots`);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const available = (slots.value || []).filter((s) => s.available);
  const eligible =
    profile && ["SEEKER", "ADVERTISER"].includes(profile.role) && !isOwner;
  useEffect(() => {
    if (slots.value) {
      if (
        selected &&
        !slots.value.some((s) => s.id === selected && s.available)
      )
        setSelected("");
      if (!selected && available.length === 1) setSelected(available[0].id);
    }
  }, [slots.value, selected]);
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setMessage("");
    setError("");
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
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function book() {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await request(
        `/properties/${propertyId}/requests`,
        session?.access_token,
        {
          method: "POST",
          body: JSON.stringify({ slotId: selected, message: note }),
        },
      );
      setMessage("Zahteva je oddana in čaka na odgovor oglaševalca.");
      slots.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel viewing-card">
      <div className="viewing-card-intro">
        <span className="section-icon">
          <CalendarDays size={24} strokeWidth={1.4} />
        </span>
        <p className="eyebrow">
          {isOwner ? "ORGANIZIRAJTE OGLEDE" : "NASLEDNJI KORAK DO DOMA"}
        </p>
        <h2>
          {isOwner ? "Vaši termini ogledov" : "Spoznajte prostor v živo."}
        </h2>
        <p>
          {isOwner
            ? "Določite termine, ki vam ustrezajo. Interesenti bodo zaprosili za svoj ogled."
            : "Izberite termin in pošljite zahtevo. Za prvi občutek, da ste doma."}
        </p>
      </div>
      {isOwner && (
        <details className="slot-create" open={!slots.value?.length}>
          <summary>
            <CalendarClock size={17} />
            Dodajte nov termin <ChevronDown size={15} />
          </summary>
          <form onSubmit={add} className="stack">
            <div className="field">
              <label htmlFor="slot-start">Začetek (Europe/Ljubljana)</label>
              <input
                id="slot-start"
                name="startsAt"
                type="datetime-local"
                required
                disabled={busy}
              />
            </div>
            <div className="field">
              <label htmlFor="slot-end">Konec (Europe/Ljubljana)</label>
              <input
                id="slot-end"
                name="endsAt"
                type="datetime-local"
                required
                disabled={busy}
              />
            </div>
            <button
              className="button button-primary button-full"
              disabled={busy}
            >
              Dodaj termin <Check size={16} />
            </button>
          </form>
        </details>
      )}
      {slots.error ? (
        <Notice tone="error" onRetry={slots.reload}>
          {slots.error}
        </Notice>
      ) : slots.loading && !slots.value ? (
        <Loading label="Nalaganje terminov …" />
      ) : !slots.value?.length ? (
        <div className="viewing-empty">
          <CalendarClock size={26} strokeWidth={1.3} />
          <strong>Ni razpoložljivih terminov.</strong>
          <p>
            {isOwner
              ? "Začnite z dodajanjem prvega termina."
              : "Oglaševalec še ni dodal prostih terminov. Preverite znova pozneje."}
          </p>
        </div>
      ) : (
        <fieldset className="slot-choices">
          <legend>
            {isOwner ? "Dodani termini" : "Izberite prost termin"}
          </legend>
          {slots.value.map((s) => (
            <label
              className={`slot-choice ${selected === s.id && eligible ? "selected" : ""} ${!s.available ? "occupied" : ""}`}
              key={s.id}
            >
              {eligible && (
                <input
                  type="radio"
                  name="viewing-slot"
                  checked={selected === s.id}
                  disabled={busy || !s.available}
                  value={s.id}
                  onChange={() => setSelected(s.id)}
                />
              )}
              <div className="slot-date-icon">
                <CalendarDays size={18} />
              </div>
              <span className="slot-choice-time">
                <strong>{dateOnly(s.startsAt)}</strong>
                <small>
                  {clockOnly(s.startsAt)} – {clockOnly(s.endsAt)}
                </small>
              </span>
              <span
                className={`slot-availability ${s.available ? "free" : ""}`}
              >
                {s.available ? "Prosto" : "Zasedeno"}
              </span>
            </label>
          ))}
        </fieldset>
      )}
      {eligible && available.length > 0 && (
        <>
          <div className="field viewing-note">
            <label htmlFor="viewing-message">
              Sporočilo oglaševalcu <span>(neobvezno)</span>
            </label>
            <textarea
              id="viewing-message"
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Kaj bi želeli sporočiti pred ogledom?"
              rows={2}
              disabled={busy}
            />
          </div>
          <button
            className="button button-primary button-full"
            disabled={busy || !selected}
            onClick={book}
          >
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Send size={16} />
            )}
            Zahtevaj ogled
          </button>
        </>
      )}
      {!profile && (
        <Link
          className="button button-primary button-full"
          to="/prijava"
          state={{ from: location.pathname }}
        >
          Prijavite se za ogled <ArrowRight size={17} />
        </Link>
      )}
      {profile?.role === "ADMIN" && !isOwner && (
        <p className="field-hint">
          Ogledov v administratorski vlogi ne morete zahtevati.
        </p>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      {eligible && (
        <Link className="viewing-history-link" to="/moji-ogledi">
          Moji ogledi <ArrowUpRight size={15} />
        </Link>
      )}
      <div className="viewing-card-footnote">
        <Clock3 size={14} />
        <span>Časovni pas Europe/Ljubljana</span>
      </div>
      <div className="privacy-note">
        <LockKeyhole size={16} />
        <p>
          Potrditev termina razkrije natančen naslov. Vaša zahteva še ni potrjen
          ogled.
        </p>
      </div>
    </section>
  );
}
const requestTabs = [
  { value: "all", label: "Vse zahteve" },
  { value: "PENDING", label: "Čakajoče" },
  { value: "CONFIRMED", label: "Potrjene" },
  { value: "REJECTED", label: "Zavrnjene" },
  { value: "CANCELLED", label: "Preklicane" },
];
export function OwnerRequests({
  propertyId,
  active,
  onDecision,
}: {
  propertyId: string;
  active: boolean;
  onDecision?: () => void;
}) {
  const { session } = useSession();
  const data = useResource<ReceivedRequest[]>(
    `/properties/${propertyId}/requests`,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("all");
  const [decision, setDecision] = useState<{
    id: string;
    type: "confirm" | "reject";
  } | null>(null);
  async function decide() {
    if (!decision) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await request(
        `/properties/${propertyId}/requests/${decision.id}/decision`,
        session?.access_token,
        { method: "POST", body: JSON.stringify({ decision: decision.type }) },
      );
      setDecision(null);
      data.reload();
      onDecision?.();
      setMessage("Odločitev je shranjena.");
    } catch (e) {
      setError((e as Error).message);
      setDecision(null);
    } finally {
      setBusy(false);
    }
  }
  const all = data.value || [];
  const visible = all.filter((r) => tab === "all" || r.status === tab);
  return (
    <section className="owner-requests">
      <div className="section-heading-inline">
        <div>
          <span className="eyebrow">POVEŽITE LJUDI IN PROSTORE</span>
          <h2>Prejete zahteve</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Osveži prejete zahteve"
          onClick={data.reload}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <div className="status-tabs compact-tabs" aria-label="Status zahtev">
        {requestTabs.map((t) => (
          <button
            className={t.value === tab ? "active" : ""}
            key={t.value}
            onClick={() => setTab(t.value)}
            aria-pressed={t.value === tab}
          >
            {t.label}
            <span>
              {
                all.filter((r) => t.value === "all" || r.status === t.value)
                  .length
              }
            </span>
          </button>
        ))}
      </div>
      {data.error ? (
        <Notice tone="error" onRetry={data.reload}>
          {data.error}
        </Notice>
      ) : data.loading && !data.value ? (
        <Loading />
      ) : visible.length ? (
        <div className="received-request-list">
          {visible.map((r) => (
            <article className="received-request panel" key={r.id}>
              <div className="received-request-head">
                <div className="applicant">
                  <span className="avatar">
                    {r.seeker.firstName.slice(0, 1)}
                    {r.seeker.lastName.slice(0, 1)}
                  </span>
                  <div>
                    <h3>
                      {r.seeker.firstName} {r.seeker.lastName}
                    </h3>
                    <span>@{r.seeker.username}</span>
                  </div>
                </div>
                <Badge status={r.status} />
              </div>
              <div className="request-meta">
                <span>
                  <CalendarDays size={16} />
                  {dateOnly(r.slot.startsAt)}
                </span>
                <span>
                  <Clock3 size={16} />
                  {clockOnly(r.slot.startsAt)} – {clockOnly(r.slot.endsAt)}
                </span>
              </div>
              <p className="applicant-phone">
                Kontakt:{" "}
                <a href={`tel:${r.seeker.phoneNumber}`}>
                  {r.seeker.phoneNumber}
                </a>
              </p>
              {r.message && (
                <div className="request-message">
                  <MessageSquare size={16} />
                  <p>{r.message}</p>
                </div>
              )}
              {active &&
                r.status === "PENDING" &&
                new Date(r.slot.startsAt) > new Date() && (
                  <div className="request-decisions">
                    <button
                      className="button button-primary button-small"
                      disabled={busy}
                      onClick={() => setDecision({ id: r.id, type: "confirm" })}
                    >
                      <Check size={16} />
                      Potrdi ogled
                    </button>
                    <button
                      className="button button-secondary button-small"
                      disabled={busy}
                      onClick={() => setDecision({ id: r.id, type: "reject" })}
                    >
                      <X size={15} />
                      Zavrni zahtevo
                    </button>
                  </div>
                )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          icon={CalendarClock}
          title="Trenutno ni zahtev."
          description={
            tab === "all"
              ? "Ko interesenti zaprosijo za ogled, jih boste našli tukaj."
              : "Za izbrani status trenutno ni zahtev."
          }
        />
      )}{" "}
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      <ConfirmDialog
        open={!!decision}
        onClose={() => setDecision(null)}
        onConfirm={decide}
        title={
          decision?.type === "confirm"
            ? "Potrdim ta ogled?"
            : "Zavrnem to zahtevo?"
        }
        description={
          decision?.type === "confirm"
            ? "Termin bo rezerviran za izbranega interesenta. Vse druge čakajoče zahteve za isti termin bodo samodejno zavrnjene."
            : "Ta zahteva bo zavrnjena. Termin ostane prost, če nima drugega potrjenega ogleda."
        }
        confirmLabel={
          decision?.type === "confirm" ? "Potrdi zahtevo" : "Potrdi zavrnitev"
        }
        busy={busy}
        danger={decision?.type === "reject"}
      />
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
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function close() {
    if (!confirmed) return;
    setBusy(true);
    setMessage("");
    try {
      await request(`/properties/${propertyId}/close`, session?.access_token, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      setOpen(false);
      onClosed();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="close-section panel">
      <span className="close-icon">
        <TriangleAlert size={23} strokeWidth={1.5} />
      </span>
      <div>
        <h2>Zaključek oglasa</h2>
        <p>
          Je prostor dobil novo zgodbo? Umaknite oglas ali ga označite kot{" "}
          {listingType === "SALE" ? "prodanega" : "oddanega"}.
        </p>
        <div className="close-controls">
          <div className="field">
            <label className="sr-only" htmlFor="close-status">
              Način zaključka
            </label>
            <select
              id="close-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="INACTIVE">Umakni oglas</option>
              <option value={listingType === "SALE" ? "SOLD" : "RENTED"}>
                {listingType === "SALE"
                  ? "Označi kot prodano"
                  : "Označi kot oddano"}
              </option>
            </select>
          </div>
          <button
            className="button button-danger-soft"
            onClick={() => {
              setConfirmed(false);
              setMessage("");
              setOpen(true);
            }}
          >
            Zaključi oglas <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={
          status === "INACTIVE"
            ? "Umaknem oglas iz ponudbe?"
            : status === "SOLD"
              ? "Označim nepremičnino kot prodano?"
              : "Označim nepremičnino kot oddano?"
        }
      >
        <div className="modal-warning">
          <TriangleAlert size={23} />
          <p>
            Oglas ne bo več javno viden. Prihodnje čakajoče in potrjene zahteve
            bodo preklicane, natančen naslov pa ne bo več dostopen interesentom.
            Pretekla zgodovina ostane.
          </p>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={busy}
          />
          Potrjujem zaključek in preklic prihodnjih ogledov.
        </label>
        {message && <Notice tone="error">{message}</Notice>}
        <div className="modal-actions">
          <button
            className="button button-secondary"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Prekliči
          </button>
          <button
            className="button button-danger"
            disabled={!confirmed || busy}
            onClick={close}
          >
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            Potrdi zaključek
          </button>
        </div>
      </Modal>
    </section>
  );
}
function PersonalRequestCard({ value: r }: { value: PersonalRequest }) {
  const underReview = ["DRAFT", "PENDING_REVIEW", "REJECTED"].includes(
    r.property.status,
  );
  const canSeeAddress =
    r.status === "CONFIRMED" &&
    r.property.status === "PUBLISHED" &&
    r.property.exactAddress;
  return (
    <article className="personal-request panel">
      <div className="personal-request-image">
        {r.property.status === "PUBLISHED" && r.property.photos?.[0] ? (
          <Photo propertyId={r.property.id} photoId={r.property.photos[0].id} />
        ) : (
          <PhotoFallback />
        )}
      </div>
      <div className="personal-request-body">
        <div className="personal-request-top">
          <span className="property-location">
            <MapPin size={13} />
            {underReview
              ? "Začasno v urejanju"
              : r.property.city || r.property.publicLocation}
          </span>
          <Badge status={r.status} />
        </div>
        <h2>
          {r.property.status === "PUBLISHED" ? (
            <Link to={`/nepremicnine/${r.property.id}`}>
              {r.property.title}
            </Link>
          ) : (
            r.property.title
          )}
        </h2>
        <div className="request-meta">
          <span>
            <CalendarDays size={16} />
            {dateOnly(r.slot.startsAt)}
          </span>
          <span>
            <Clock3 size={16} />
            {clockOnly(r.slot.startsAt)} – {clockOnly(r.slot.endsAt)}
          </span>
        </div>
        {canSeeAddress ? (
          <div className="confirmed-address">
            <span>
              <ShieldCheck size={19} />
            </span>
            <div>
              <small>NATANČEN NASLOV POTRJENEGA OGLEDA</small>
              <strong>{r.property.exactAddress}</strong>
            </div>
          </div>
        ) : (
          <p className="address-locked">
            <LockKeyhole size={15} />
            {underReview
              ? "Oglas se ponovno ureja ali čaka na odobritev. Zahteva ostaja shranjena; naslov do ponovne objave ni dostopen."
              : r.property.status !== "PUBLISHED"
                ? "Oglas ni več aktiven. Natančen naslov ni dostopen."
                : "Natančen naslov bo na voljo po potrditvi ogleda."}
          </p>
        )}
        <div className="personal-request-bottom">
          <span>
            {r.property.publicLocation && <>{r.property.publicLocation} · </>}
            {statusLabels[r.property.status] || r.property.status}
          </span>
          {r.property.status === "PUBLISHED" && (
            <Link to={`/nepremicnine/${r.property.id}`}>
              Odpri oglas <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
        {r.message && (
          <p className="personal-message">Vaše sporočilo: {r.message}</p>
        )}
      </div>
    </article>
  );
}
export function MyViewings() {
  const { profile, loading } = useSession();
  const data = useResource<PersonalRequest[]>(
    profile && profile.role !== "ADMIN" ? "/my/requests" : null,
  );
  const [tab, setTab] = useState("all");
  if (loading) return <Loading />;
  if (!profile) return <Navigate to="/prijava" replace />;
  if (profile.role === "ADMIN")
    return (
      <Notice>
        Ta pogled je namenjen interesentom.{" "}
        <Link to="/racun">Nazaj na pregled</Link>
      </Notice>
    );
  const all = data.value || [];
  const shown = all.filter((r) => tab === "all" || r.status === tab);
  const upcoming = all.filter(
    (r) =>
      r.status === "CONFIRMED" &&
      new Date(r.slot.startsAt) > new Date() &&
      r.property.status === "PUBLISHED",
  ).length;
  return (
    <>
      <PageHeading
        eyebrow="PROSTORI, KI SO VAS PRITEGNILI"
        title="Moji ogledi"
        description="Od prvega zanimanja do pravega občutka. Spremljajte vsak korak."
        action={
          <button
            className="button button-secondary"
            onClick={data.reload}
            disabled={data.loading}
          >
            <RefreshCw size={16} className={data.loading ? "spin" : ""} />
            Osveži statuse
          </button>
        }
      />
      <div className="mini-stat-grid">
        {[
          {
            label: "Prihodnji potrjeni ogledi",
            value: upcoming,
            Icon: CalendarCheck2,
          },
          {
            label: "Čakajo na odgovor",
            value: all.filter((r) => r.status === "PENDING").length,
            Icon: Clock3,
          },
          { label: "Vse vaše zahteve", value: all.length, Icon: CalendarDays },
        ].map(({ label, value, Icon }) => (
          <div className="mini-stat" key={label}>
            <span>
              <Icon size={21} />
            </span>
            <div>
              <strong>{data.loading && !data.value ? "—" : value}</strong>
              <small>{label}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="viewings-toolbar">
        <div className="status-tabs" aria-label="Status ogledov">
          {requestTabs.map((t) => (
            <button
              className={tab === t.value ? "active" : ""}
              aria-pressed={tab === t.value}
              key={t.value}
              onClick={() => setTab(t.value)}
            >
              {t.label}
              <span>
                {
                  all.filter((r) => t.value === "all" || r.status === t.value)
                    .length
                }
              </span>
            </button>
          ))}
        </div>
        <span className="timezone-note">
          <Clock3 size={13} />
          Europe/Ljubljana
        </span>
      </div>
      {data.error ? (
        <Notice tone="error" onRetry={data.reload}>
          {data.error}
        </Notice>
      ) : data.loading && !data.value ? (
        <Loading cards />
      ) : shown.length ? (
        <div className="personal-request-list">
          {shown.map((r) => (
            <PersonalRequestCard key={r.id} value={r} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title={
            all.length
              ? "V tej skupini še ni ogledov."
              : "Vaš prvi ogled še čaka."
          }
          description={
            all.length
              ? "Izberite drug status in preglejte svoje zahteve."
              : "Odkrijte nepremičnino, ki vas pritegne, izberite termin in naredite naslednji korak."
          }
          action={
            <Link className="button button-primary" to="/nepremicnine">
              Raziščite ponudbo <ArrowRight size={16} />
            </Link>
          }
        />
      )}
    </>
  );
}
export function ReceivedRequestsPage() {
  const { profile, loading } = useSession();
  const properties = useResource<Listing[]>(
    profile?.role === "ADVERTISER" ? "/my/properties" : null,
  );
  const [params, setParams] = useSearchParams();
  const chosen =
    properties.value?.find((p) => p.id === params.get("oglas")) ||
    properties.value?.find((p) => p.status === "PUBLISHED") ||
    properties.value?.[0];
  if (loading) return <Loading />;
  if (!profile) return <Navigate to="/prijava" replace />;
  if (profile.role !== "ADVERTISER")
    return <Notice tone="error">Ta pogled je namenjen oglaševalcem.</Notice>;
  return (
    <>
      <PageHeading
        eyebrow="OD ZANIMANJA DO SREČANJA"
        title="Prejete zahteve"
        description="Izberite oglas in uskladite naslednji dober ogled."
      />
      {properties.error ? (
        <Notice tone="error" onRetry={properties.reload}>
          {properties.error}
        </Notice>
      ) : properties.loading ? (
        <Loading />
      ) : chosen ? (
        <>
          <div className="property-selector panel">
            <div>
              <span className="eyebrow">IZBRANA NEPREMIČNINA</span>
              <strong>{chosen.title || "Osnutek oglasa"}</strong>
              <span>{chosen.city}</span>
            </div>
            <div className="field">
              <label className="sr-only" htmlFor="request-property">
                Izberite oglas
              </label>
              <select
                id="request-property"
                value={chosen.id}
                onChange={(e) => setParams({ oglas: e.target.value })}
              >
                {properties.value?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title || "Osnutek oglasa"}
                  </option>
                ))}
              </select>
            </div>
            <Link
              className="text-link strong"
              to={`/nepremicnine/${chosen.id}`}
            >
              Podrobnosti <ArrowUpRight size={16} />
            </Link>
          </div>
          <OwnerRequests
            key={`${chosen.id}:${chosen.status}`}
            propertyId={chosen.id}
            active={chosen.status === "PUBLISHED"}
          />
        </>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Najprej predstavite svoj prostor."
          description="Ko objavite oglas in dodate termine, bodo zahteve za oglede prikazane tukaj."
          action={
            <Link className="button button-primary" to="/moji-oglasi">
              Moji oglasi <ArrowRight size={16} />
            </Link>
          }
        />
      )}
    </>
  );
}
