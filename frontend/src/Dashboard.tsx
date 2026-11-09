import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock3,
  FileCheck2,
  FileText,
  House,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { request, useSession } from "./session";
import {
  useResource,
  type Listing,
  type PersonalRequest,
  type ReceivedRequest,
} from "./data";
import { Badge, EmptyState, Loading, Notice, PageHeading, money } from "./ui";
import { formatTime } from "./Viewings";
import { Photo, PhotoFallback } from "./Listings";

function Stat({
  label,
  value,
  caption,
  Icon,
}: {
  label: string;
  value: number | string;
  caption: string;
  Icon: typeof House;
}) {
  return (
    <div className="stat-card panel">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={20} strokeWidth={1.4} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{caption}</p>
    </div>
  );
}
function Welcome({
  name,
  role,
}: {
  name: string;
  role: "SEEKER" | "ADVERTISER" | "ADMIN";
}) {
  return (
    <div className="dashboard-welcome">
      <div>
        <p className="eyebrow">
          {role === "ADMIN"
            ? "PREGLED IN ZAUPANJE"
            : role === "ADVERTISER"
              ? "VAŠI PROSTORI, PREGLEDNO UREJENI"
              : "VAŠ OSEBNI PROSTOR"}
        </p>
        <h1>
          {role === "ADMIN" ? (
            "Dober pregled se začne tukaj."
          ) : (
            <>
              Dobrodošli, <em>{name}.</em>
            </>
          )}
        </h1>
        <p>
          {role === "ADMIN"
            ? "Vsaka dobra predstavitev prispeva k zaupanju v ponudbo."
            : role === "ADVERTISER"
              ? "Ohranjajte pregled nad oglasi in ustvarjajte nove priložnosti."
              : "Vaša naslednja zgodba je lahko bližje, kot si mislite."}
        </p>
      </div>
      <span className="welcome-mark">
        <House size={54} strokeWidth={0.8} />
        <Sparkles size={18} strokeWidth={1.2} />
      </span>
    </div>
  );
}
function SeekerOverview() {
  const { profile } = useSession();
  const data = useResource<PersonalRequest[]>("/my/requests");
  const all = data.value || [];
  const upcoming = all
    .filter(
      (r) =>
        r.status === "CONFIRMED" &&
        r.property.status === "PUBLISHED" &&
        new Date(r.slot.startsAt) > new Date(),
    )
    .sort((a, b) => +new Date(a.slot.startsAt) - +new Date(b.slot.startsAt));
  return (
    <>
      <Welcome name={profile!.firstName} role="SEEKER" />
      <div className="stat-grid">
        <Stat
          label="Prihodnji ogledi"
          value={data.loading ? "—" : upcoming.length}
          caption="Vaši potrjeni naslednji koraki"
          Icon={CalendarCheck2}
        />
        <Stat
          label="Čakajo na odgovor"
          value={
            data.loading
              ? "—"
              : all.filter((r) => r.status === "PENDING").length
          }
          caption="Zahteve pri oglaševalcih"
          Icon={Clock3}
        />
        <Stat
          label="Vse vaše zahteve"
          value={data.loading ? "—" : all.length}
          caption="Vaša zgodovina zanimanja"
          Icon={CalendarDays}
        />
      </div>
      {data.error && (
        <Notice tone="error" onRetry={data.reload}>
          {data.error}
        </Notice>
      )}
      <div className="overview-grid">
        <section className="panel overview-panel">
          <div className="section-heading-inline">
            <h2>Vaši naslednji ogledi</h2>
            <Link className="text-link" to="/moji-ogledi">
              Vsi ogledi <ArrowUpRight size={16} />
            </Link>
          </div>
          {data.loading ? (
            <Loading />
          ) : upcoming.length ? (
            <div className="overview-list">
              {upcoming.slice(0, 4).map((r) => (
                <Link key={r.id} className="overview-item" to="/moji-ogledi">
                  <div className="overview-thumb">
                    {r.property.photos?.[0] ? (
                      <Photo
                        propertyId={r.property.id}
                        photoId={r.property.photos[0].id}
                      />
                    ) : (
                      <PhotoFallback />
                    )}
                  </div>
                  <div>
                    <strong>{r.property.title}</strong>
                    <span>
                      <CalendarDays size={13} />
                      {formatTime(r.slot.startsAt)}
                    </span>
                  </div>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              icon={CalendarDays}
              title="Naslednji ogled še čaka."
              description="Izberite prostor, ki vas pritegne, in zaprosite za svoj prvi ogled."
              action={
                <Link className="button button-secondary" to="/nepremicnine">
                  Odkrijte ponudbo <ArrowRight size={16} />
                </Link>
              }
            />
          )}
        </section>
        <ExploreCard />
      </div>
      <section className="panel overview-panel">
        <div className="section-heading-inline">
          <h2>Zadnje zahteve</h2>
          <Link className="text-link" to="/moji-ogledi">
            Pregled zahtev <ArrowUpRight size={16} />
          </Link>
        </div>
        {all.length ? (
          <div className="simple-requests">
            {all.slice(0, 4).map((r) => (
              <Link to="/moji-ogledi" key={r.id}>
                <div>
                  <strong>{r.property.title}</strong>
                  <span>{formatTime(r.slot.startsAt)}</span>
                </div>
                <Badge status={r.status} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="overview-muted">
            Vaše zahteve se bodo pojavile tukaj. Do takrat poiščite prostor za
            svoje načrte.
          </p>
        )}
      </section>
    </>
  );
}
function ExploreCard() {
  return (
    <aside className="explore-card">
      <img
        src="/assets/interior.webp"
        alt="Svetla notranjost z naravnimi materiali"
      />
      <div>
        <span className="overline-light">NASLEDNJE POGLAVJE</span>
        <h2>
          Pravi prostor.
          <br />
          <em>Vaš občutek.</em>
        </h2>
        <Link className="button button-light" to="/nepremicnine">
          Raziščite nepremičnine <ArrowUpRight size={17} />
        </Link>
      </div>
    </aside>
  );
}
function AdvertiserOverview() {
  const { profile, session } = useSession();
  const properties = useResource<Listing[]>("/my/properties");
  const [received, setReceived] = useState<
    (ReceivedRequest & { property: Listing })[]
  >([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const propertyKey = (properties.value || [])
    .map((p) => p.id + ":" + p.status)
    .join(",");
  useEffect(() => {
    let active = true;
    if (!properties.value) return;
    setLoading(true);
    setError("");
    Promise.all(
      properties.value.map(async (p) =>
        (
          await request<ReceivedRequest[]>(
            `/properties/${p.id}/requests`,
            session?.access_token,
          )
        ).map((r) => ({ ...r, property: p })),
      ),
    )
      .then((groups) => {
        if (active) setReceived(groups.flat());
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyKey, session?.access_token, properties.value]);
  const all = properties.value || [];
  const pending = received.filter((r) => r.status === "PENDING");
  const upcoming = received
    .filter(
      (r) =>
        r.status === "CONFIRMED" &&
        r.property.status === "PUBLISHED" &&
        new Date(r.slot.startsAt) > new Date(),
    )
    .sort((a, b) => +new Date(a.slot.startsAt) - +new Date(b.slot.startsAt));
  return (
    <>
      <Welcome name={profile!.firstName} role="ADVERTISER" />
      <div className="dashboard-quick-action">
        <p>
          <span className="status-dot" />
          Vsak dober oglas je začetek nove priložnosti.
        </p>
        <Link className="button button-primary" to="/moji-oglasi">
          <Plus size={17} />
          Ustvarite oglas
        </Link>
      </div>
      <div className="stat-grid">
        <Stat
          label="Objavljeni oglasi"
          value={
            properties.loading
              ? "—"
              : all.filter((p) => p.status === "PUBLISHED").length
          }
          caption={`${all.length} oglasov v vašem portfelju`}
          Icon={House}
        />
        <Stat
          label="Čakajoče zahteve"
          value={loading || error ? "—" : pending.length}
          caption="Interesenti čakajo na vaš odgovor"
          Icon={Clock3}
        />
        <Stat
          label="Prihodnji ogledi"
          value={loading || error ? "—" : upcoming.length}
          caption="Potrjeni termini aktivnih oglasov"
          Icon={CalendarCheck2}
        />
      </div>
      {(properties.error || error) && (
        <Notice tone="error" onRetry={properties.reload}>
          {properties.error || error}
        </Notice>
      )}
      <div className="overview-grid">
        <section className="panel overview-panel">
          <div className="section-heading-inline">
            <h2>Zahteve, ki čakajo na vas</h2>
            <Link className="text-link" to="/prejete-zahteve">
              Vse zahteve <ArrowUpRight size={16} />
            </Link>
          </div>
          {loading ? (
            <Loading />
          ) : pending.length ? (
            <div className="simple-requests">
              {pending.slice(0, 4).map((r) => (
                <Link key={r.id} to={`/prejete-zahteve?oglas=${r.property.id}`}>
                  <div>
                    <strong>
                      {r.seeker.firstName} {r.seeker.lastName}
                    </strong>
                    <span>{r.property.title}</span>
                    <small>{formatTime(r.slot.startsAt)}</small>
                  </div>
                  <span className="circle-arrow">
                    <ArrowUpRight size={18} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              icon={CalendarDays}
              title="Vse zahteve so pregledane."
              description="Ko nekdo zaprosi za ogled, bo zahteva prikazana tukaj."
            />
          )}
        </section>
        <aside className="panel status-overview">
          <p className="eyebrow">VAŠI OGLASI</p>
          <h2>Vsak korak šteje.</h2>
          {[
            { status: "DRAFT", label: "V pripravi" },
            { status: "PENDING_REVIEW", label: "Čakajo na pregled" },
            { status: "REJECTED", label: "Za dopolnitev" },
          ].map(({ status, label }) => (
            <Link to="/moji-oglasi" key={status}>
              <span
                className={`status-indicator indicator-${status.toLowerCase()}`}
              />
              {label}
              <strong>{all.filter((p) => p.status === status).length}</strong>
              <ArrowUpRight size={15} />
            </Link>
          ))}
          <Link
            to="/moji-oglasi"
            className="button button-secondary button-full"
          >
            Odpri moje oglase <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
      <section className="panel overview-panel">
        <div className="section-heading-inline">
          <h2>Prihodnji potrjeni ogledi</h2>
          <Link to="/prejete-zahteve" className="text-link">
            Upravljaj oglede <ArrowUpRight size={16} />
          </Link>
        </div>
        {upcoming.length ? (
          <div className="simple-requests">
            {upcoming.slice(0, 4).map((r) => (
              <Link key={r.id} to={`/nepremicnine/${r.property.id}`}>
                <div>
                  <strong>{r.property.title}</strong>
                  <span>
                    {r.seeker.firstName} {r.seeker.lastName} ·{" "}
                    {formatTime(r.slot.startsAt)}
                  </span>
                </div>
                <Badge status={r.status} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="overview-muted">
            Ko potrdite ogled, se bo pojavil na vašem seznamu.
          </p>
        )}
      </section>
    </>
  );
}
function AdminOverview() {
  const { profile } = useSession();
  const data = useResource<Listing[]>("/admin/properties");
  const all = data.value || [];
  return (
    <>
      <Welcome name={profile!.firstName} role="ADMIN" />
      <div className="stat-grid">
        <Stat
          label="Čakajo na pregled"
          value={data.loading ? "—" : all.length}
          caption="Oglasi, ki potrebujejo vašo odločitev"
          Icon={FileCheck2}
        />
        <Stat
          label="Prodajne nepremičnine"
          value={
            data.loading
              ? "—"
              : all.filter((p) => p.listingType === "SALE").length
          }
          caption="V trenutni čakalni vrsti"
          Icon={House}
        />
        <Stat
          label="Nepremičnine za najem"
          value={
            data.loading
              ? "—"
              : all.filter((p) => p.listingType === "RENT").length
          }
          caption="V trenutni čakalni vrsti"
          Icon={Building2}
        />
      </div>
      <div className="overview-grid">
        <section className="panel overview-panel">
          <div className="section-heading-inline">
            <h2>Naslednji oglasi za pregled</h2>
            <Link className="text-link" to="/pregled">
              Čakalna vrsta <ArrowUpRight size={16} />
            </Link>
          </div>
          {data.error ? (
            <Notice tone="error" onRetry={data.reload}>
              {data.error}
            </Notice>
          ) : data.loading ? (
            <Loading />
          ) : all.length ? (
            <div className="overview-list">
              {all.slice(0, 4).map((p) => (
                <Link
                  className="overview-item"
                  key={p.id}
                  to={`/pregled/${p.id}`}
                >
                  <div className="overview-thumb">
                    {p.photos?.[0] ? (
                      <Photo propertyId={p.id} photoId={p.photos[0].id} />
                    ) : (
                      <PhotoFallback />
                    )}
                  </div>
                  <div>
                    <strong>{p.title}</strong>
                    <span>
                      {p.city} · {money(p.price)}
                    </span>
                  </div>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              icon={FileCheck2}
              title="Vse je pregledano."
              description="Čakalna vrsta je prazna. Novi oglasi bodo prikazani tukaj."
            />
          )}
        </section>
        <aside className="panel moderation-guide">
          <span className="section-icon">
            <ShieldCheck size={25} />
          </span>
          <h2>
            Dober pregled
            <br />
            gradi zaupanje.
          </h2>
          <p>Pred odločitvijo preverite:</p>
          <ol>
            <li>
              <span>01</span>Jasnost opisa in osnovne podatke.
            </li>
            <li>
              <span>02</span>Ceno, površino in lokacijo.
            </li>
            <li>
              <span>03</span>Ustreznost fotografij in predstavitve.
            </li>
          </ol>
          <div className="privacy-note">
            <ShieldCheck size={17} />
            <p>
              Ob zavrnitvi navedite jasen razlog, da lahko oglaševalec izboljša
              oglas.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
export function DashboardOverview() {
  const { profile, loading } = useSession();
  if (loading) return <Loading />;
  if (!profile) return <Navigate to="/prijava" replace />;
  return profile.role === "ADVERTISER" ? (
    <AdvertiserOverview />
  ) : profile.role === "ADMIN" ? (
    <AdminOverview />
  ) : (
    <SeekerOverview />
  );
}
