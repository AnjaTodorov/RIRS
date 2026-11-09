import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Euro,
  FileCheck2,
  FileText,
  Grid2X2,
  House,
  ImagePlus,
  Images,
  Info,
  LayoutGrid,
  LoaderCircle,
  MapPin,
  Maximize2,
  Pencil,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { request, useSession, ApiError } from "./session";
import { useResource, type Listing } from "./data";
import { ViewingPanel, OwnerRequests, CloseListing } from "./Viewings";
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Loading,
  Modal,
  Notice,
  PageHeading,
  money,
  number,
  statusLabels,
} from "./ui";
export { useResource } from "./data";
export type { Listing } from "./data";
export const labels = statusLabels;

export function Photo({
  propertyId,
  photoId,
  alt = "Fotografija nepremičnine",
  eager = false,
}: {
  propertyId: string;
  photoId: string;
  alt?: string;
  eager?: boolean;
}) {
  const { value, error } = useResource<{ url: string }>(
    `/properties/${propertyId}/photos/${photoId}/url`,
  );
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [value?.url]);
  return value && !failed ? (
    <img
      className="property-image"
      src={value.url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={`photo-placeholder ${!error && !failed ? "photo-loading" : ""}`}
      aria-label={
        error || failed
          ? "Fotografija trenutno ni na voljo"
          : "Nalaganje fotografije"
      }
    >
      <House size={37} strokeWidth={1} />
      {(error || failed) && <span>Fotografija trenutno ni na voljo</span>}
    </div>
  );
}
export function PhotoFallback({ large = false }: { large?: boolean }) {
  return (
    <div className={`photo-placeholder empty-photo ${large ? "large" : ""}`}>
      <span className="placeholder-lines" />
      <House size={large ? 56 : 38} strokeWidth={1} />
      <span>Prostor za vašo zgodbo</span>
      <small>Fotografija še ni dodana</small>
    </div>
  );
}
export function PropertyCard({ listing: p }: { listing: Listing }) {
  return (
    <Link className="property-card" to={`/nepremicnine/${p.id}`}>
      <div className="property-card-image">
        {p.photos?.[0] ? (
          <Photo propertyId={p.id} photoId={p.photos[0].id} />
        ) : (
          <PhotoFallback />
        )}
        <span className="card-purpose">
          {p.listingType === "RENT" ? "Za najem" : "Za nakup"}
        </span>
        {p.photos?.length > 0 && (
          <span className="photo-counter">
            <Images size={13} />
            {p.photos.length}
          </span>
        )}
        <span className="card-open">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="property-card-content">
        <p className="property-location">
          <MapPin size={13} />
          {p.city || "Kraj še ni določen"}
        </p>
        <h2>{p.title || "Nov osnutek"}</h2>
        <p className="property-card-subtitle">
          {p.publicLocation || p.propertyType || "Podatki se pripravljajo"}
        </p>
        <div className="property-card-features">
          <span>
            <Ruler size={15} />
            {p.areaM2 ? `${number(p.areaM2)} m²` : "Površina ni določena"}
          </span>
          <span>
            <Building2 size={15} />
            {p.propertyType || "Nepremičnina"}
          </span>
        </div>
        <div className="property-card-bottom">
          <strong>
            {money(p.price)}
            {p.listingType === "RENT" && <small> / mesec</small>}
          </strong>
          <span>
            Oglej si <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
function useCompact() {
  const [compact, setCompact] = useState(
    () => window.matchMedia?.("(max-width: 900px)").matches || false,
  );
  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 900px)");
    if (!query) return;
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return compact;
}
const filterNames: Record<string, string> = {
  city: "Kraj",
  listingType: "Namen",
  propertyType: "Vrsta",
  minPrice: "Cena od (€)",
  maxPrice: "Cena do (€)",
  minArea: "Površina od (m²)",
  maxArea: "Površina do (m²)",
};
export function Catalog() {
  const [params, setParams] = useSearchParams();
  const [validation, setValidation] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [sort, setSort] = useState("default");
  const compact = useCompact();
  const data = useResource<Listing[]>(`/properties?${params}`);
  const sorted = useMemo(() => {
    const items = [...(data.value || [])];
    if (sort === "price-asc")
      items.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc")
      items.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "area-desc")
      items.sort((a, b) => Number(b.areaM2) - Number(a.areaM2));
    return items;
  }, [data.value, sort]);
  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const min = String(values.get("minPrice") || "");
    const max = String(values.get("maxPrice") || "");
    const amin = String(values.get("minArea") || "");
    const amax = String(values.get("maxArea") || "");
    if (
      (min && max && Number(min) > Number(max)) ||
      (amin && amax && Number(amin) > Number(amax))
    ) {
      setValidation("Najmanjša vrednost ne sme presegati največje.");
      return;
    }
    setValidation("");
    const query = new URLSearchParams();
    for (const [k, v] of values)
      if (String(v).trim()) query.set(k, String(v).trim());
    setParams(query);
    setDrawer(false);
  }
  const filterForm = (
    <form className="filter-form" onSubmit={search} key={params.toString()}>
      <div className="filter-panel-title">
        <h2>
          <SlidersHorizontal size={17} />
          Prilagodite iskanje
        </h2>
        <button
          type="button"
          className="inline-action"
          onClick={() => {
            setParams({});
            setValidation("");
          }}
        >
          Počisti
        </button>
      </div>
      <div className="field">
        <label htmlFor="filter-purpose">Namen</label>
        <select
          id="filter-purpose"
          name="listingType"
          defaultValue={params.get("listingType") || ""}
        >
          <option value="">Nakup in najem</option>
          <option value="SALE">Nakup</option>
          <option value="RENT">Najem</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="filter-city">Kraj</label>
        <div className="input-icon">
          <MapPin size={17} />
          <input
            id="filter-city"
            name="city"
            placeholder="Vnesite kraj"
            defaultValue={params.get("city") || ""}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="filter-type">Vrsta nepremičnine</label>
        <input
          id="filter-type"
          name="propertyType"
          list="property-types"
          placeholder="Vse vrste"
          defaultValue={params.get("propertyType") || ""}
        />
        <datalist id="property-types">
          <option>Stanovanje</option>
          <option>Hiša</option>
          <option>Zemljišče</option>
          <option>Poslovni prostor</option>
        </datalist>
      </div>
      <div className="filter-section">
        <h3>
          Cenovni razpon <span>€</span>
        </h3>
        <div className="range-inputs">
          {[
            ["minPrice", "Cena od (€)", "Od"],
            ["maxPrice", "Cena do (€)", "Do"],
          ].map(([key, label, placeholder]) => (
            <div className="field" key={key}>
              <label className="sr-only" htmlFor={key}>
                {label}
              </label>
              <input
                id={key}
                name={key}
                type="number"
                min="0"
                step="0.01"
                placeholder={placeholder}
                defaultValue={params.get(key) || ""}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="filter-section">
        <h3>
          Površina <span>m²</span>
        </h3>
        <div className="range-inputs">
          {[
            ["minArea", "Površina od (m²)", "Od"],
            ["maxArea", "Površina do (m²)", "Do"],
          ].map(([key, label, placeholder]) => (
            <div className="field" key={key}>
              <label className="sr-only" htmlFor={key}>
                {label}
              </label>
              <input
                id={key}
                name={key}
                type="number"
                min="0"
                step="0.01"
                placeholder={placeholder}
                defaultValue={params.get(key) || ""}
              />
            </div>
          ))}
        </div>
      </div>
      {validation && <Notice tone="error">{validation}</Notice>}
      <button className="button button-primary button-full">
        <Search size={17} />
        Išči
      </button>
      <p className="filter-footnote">
        <ShieldCheck size={14} />
        Prikazujemo samo pregledane, objavljene oglase.
      </p>
    </form>
  );
  return (
    <div className="discovery-page content-width">
      <div className="breadcrumb">
        <Link to="/">Domov</Link>
        <ChevronRight size={13} />
        <span>Nepremičnine</span>
      </div>
      <PageHeading
        eyebrow="VAŠ PROSTOR JE NEKJE TUKAJ"
        title="Prostor za vaše načrte."
        description="Od prve zamisli do pravega občutka. Poiščite dom po svoje."
      />
      <div className="discovery-layout">
        {!compact && <aside className="filter-sidebar">{filterForm}</aside>}
        <section className="results-section" aria-label="Rezultati iskanja">
          <div className="results-toolbar">
            <div>
              <span className="result-number">
                {data.loading ? "…" : sorted.length}
              </span>
              <span>
                {" "}
                {params.size
                  ? "zadetkov za vaše iskanje"
                  : "nepremičnin v ponudbi"}
              </span>
            </div>
            <div className="results-controls">
              {compact && (
                <button
                  className="button button-secondary filter-toggle"
                  onClick={() => setDrawer(true)}
                >
                  <SlidersHorizontal size={16} />
                  Filtri {params.size > 0 && <span>{params.size}</span>}
                </button>
              )}
              <label className="sort-control">
                <span className="sr-only">Razvrsti po</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="default">Privzeti vrstni red</option>
                  <option value="price-asc">Cena: od nižje do višje</option>
                  <option value="price-desc">Cena: od višje do nižje</option>
                  <option value="area-desc">
                    Površina: od večje do manjše
                  </option>
                </select>
              </label>
            </div>
          </div>
          {params.size > 0 && (
            <div className="filter-tags">
              {Array.from(params).map(([key, value]) => (
                <button
                  key={key}
                  className="filter-chip"
                  aria-label={`Odstrani filter: ${filterNames[key] || key} ${value}`}
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.delete(key);
                    setParams(next);
                  }}
                >
                  <small>{filterNames[key]}</small>
                  {statusLabels[value] || value}
                  <X size={13} />
                </button>
              ))}
              <button className="inline-action" onClick={() => setParams({})}>
                Počisti vse
              </button>
            </div>
          )}
          {data.error ? (
            <Notice tone="error" onRetry={data.reload}>
              {data.error}
            </Notice>
          ) : data.loading ? (
            <Loading cards label="Nalaganje ponudb …" />
          ) : sorted.length ? (
            <div className="property-grid search-grid">
              {sorted.map((p) => (
                <PropertyCard key={p.id} listing={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title={
                params.size
                  ? "Tokrat brez zadetkov."
                  : "Novi prostori prihajajo."
              }
              description={
                params.size
                  ? "Poskusite z drugim krajem ali širšim razponom. Pravi prostor je morda le filter stran."
                  : "Trenutno ni objavljenih oglasov. Vrnite se kmalu in odkrijte nove možnosti."
              }
              action={
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setParams({});
                    setValidation("");
                  }}
                >
                  Ponastavi iskanje <ArrowRight size={16} />
                </button>
              }
            />
          )}
        </section>
      </div>
      {compact && (
        <Modal
          open={drawer}
          onClose={() => setDrawer(false)}
          title="Filtri iskanja"
          className="filter-dialog"
        >
          {filterForm}
        </Modal>
      )}
    </div>
  );
}
export function EditListingAction({
  listing,
  className = "button button-primary",
  onStarted,
}: {
  listing: Pick<Listing, "id" | "status">;
  className?: string;
  onStarted?: () => void;
}) {
  const { session } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const target = `/oglasi/${listing.id}/uredi`;
  async function start() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await request(`/properties/${listing.id}/edit`, session?.access_token, {
        method: "POST",
      });
      setOpen(false);
      if (onStarted) onStarted();
      else navigate(target);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (["DRAFT", "REJECTED"].includes(listing.status))
    return (
      <Link className={className} to={target}>
        <Pencil size={16} />
        Uredi oglas
      </Link>
    );
  if (listing.status !== "PUBLISHED") return null;
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Pencil size={16} />
        Uredi oglas
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={start}
        title="Uredi objavljen oglas?"
        description="Oglas bo začasno umaknjen iz javne ponudbe in vrnjen v osnutek. Spremembe bodo objavljene šele po ponovni oddaji in odobritvi administratorja. Obstoječi termini in zahteve ostanejo shranjeni."
        confirmLabel="Začni urejanje"
        busy={busy}
      >
        {error && <Notice tone="error">{error}</Notice>}
      </ConfirmDialog>
    </>
  );
}
export function MyProperties() {
  const { profile, session, loading } = useSession();
  const data = useResource<Listing[]>(
    profile?.role === "ADVERTISER" ? "/my/properties" : null,
  );
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  if (loading) return <Loading />;
  if (!profile) return <Navigate to="/prijava" replace />;
  if (profile.role !== "ADVERTISER")
    return (
      <Notice>
        Dostop do tega prostora je namenjen oglaševalcem.{" "}
        <Link to="/racun">Nazaj na pregled</Link>
      </Notice>
    );
  async function create() {
    setBusy(true);
    setError("");
    try {
      const p = await request<Listing>("/properties", session?.access_token, {
        method: "POST",
        body: "{}",
      });
      navigate(`/oglasi/${p.id}/uredi`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const all = data.value || [];
  const visible = all.filter(
    (p) =>
      (tab === "all" || p.status === tab) &&
      `${p.title} ${p.city}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="VAŠ PORTFELJ"
        title="Moji oglasi"
        description="Od prvega osnutka do novega začetka. Vse na enem mestu."
        action={
          <button
            className="button button-primary"
            aria-label="+ Nov oglas"
            onClick={create}
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Plus size={17} />
            )}
            Nov oglas
          </button>
        }
      />
      <div className="mini-stat-grid">
        {[
          { label: "Vsi oglasi", value: all.length, Icon: House },
          {
            label: "Objavljeni",
            value: all.filter((p) => p.status === "PUBLISHED").length,
            Icon: CheckCircle2,
          },
          {
            label: "V pregledu",
            value: all.filter((p) => p.status === "PENDING_REVIEW").length,
            Icon: FileCheck2,
          },
        ].map(({ label, value, Icon }) => (
          <div className="mini-stat" key={label}>
            <span>
              <Icon size={19} />
            </span>
            <div>
              <strong>{data.loading ? "—" : value}</strong>
              <small>{label}</small>
            </div>
          </div>
        ))}
      </div>
      {(error || data.error) && (
        <Notice tone="error" onRetry={data.reload}>
          {error || data.error}
        </Notice>
      )}
      <section className="panel management-panel">
        <div className="management-toolbar">
          <div className="status-tabs" aria-label="Stanje oglasov">
            {[
              { value: "all", label: "Vsi oglasi" },
              { value: "PUBLISHED", label: "Objavljeni" },
              { value: "DRAFT", label: "Osnutki" },
              { value: "PENDING_REVIEW", label: "V pregledu" },
              { value: "REJECTED", label: "Zavrnjeni" },
              { value: "INACTIVE", label: "Umaknjeni" },
              { value: "SOLD", label: "Prodani" },
              { value: "RENTED", label: "Oddani" },
            ].map((t) => (
              <button
                key={t.value}
                className={tab === t.value ? "active" : ""}
                aria-pressed={tab === t.value}
                onClick={() => setTab(t.value)}
              >
                {t.label}
                <span>
                  {t.value === "all"
                    ? all.length
                    : all.filter((p) => p.status === t.value).length}
                </span>
              </button>
            ))}
          </div>
          <div className="input-icon table-search">
            <Search size={16} />
            <input
              aria-label="Išči med svojimi oglasi"
              placeholder="Poiščite oglas …"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        {data.loading ? (
          <Loading />
        ) : visible.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nepremičnina</th>
                  <th>Cena</th>
                  <th>Status</th>
                  <th className="align-right">Naslednji korak</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        className="table-property"
                        to={`/nepremicnine/${p.id}`}
                      >
                        <div className="table-thumbnail">
                          {p.photos[0] ? (
                            <Photo propertyId={p.id} photoId={p.photos[0].id} />
                          ) : (
                            <PhotoFallback />
                          )}
                        </div>
                        <div>
                          <strong>{p.title || "Nov osnutek"}</strong>
                          <small>
                            <MapPin size={12} />
                            {p.city || "Lokacija še ni določena"}
                          </small>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span className="table-price">{money(p.price)}</span>
                      <small className="table-secondary">
                        {p.listingType === "RENT"
                          ? "na mesec"
                          : p.listingType === "SALE"
                            ? "Prodaja"
                            : "Namen še ni določen"}
                      </small>
                    </td>
                    <td>
                      <Badge status={p.status} />
                    </td>
                    <td className="align-right">
                      <div className="listing-row-actions">
                        <EditListingAction
                          listing={p}
                          className="table-action"
                        />
                        {!["DRAFT", "REJECTED"].includes(p.status) && (
                          <Link
                            className="table-action"
                            to={`/nepremicnine/${p.id}`}
                          >
                            {p.status === "PUBLISHED"
                              ? "Upravljaj oglede"
                              : "Podrobnosti"}
                            <ArrowUpRight size={16} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            compact
            icon={FileText}
            title={
              all.length
                ? "Tukaj še ni oglasov."
                : "Vaša ponudba se začne tukaj."
            }
            description={
              all.length
                ? "Spremenite izbrani status ali iskalni izraz."
                : "Pripravite prvi osnutek in predstavite prostor, ki bo nekomu postal dom."
            }
            action={
              !all.length && (
                <button
                  className="button button-secondary"
                  onClick={create}
                  disabled={busy}
                >
                  <Plus size={16} />
                  Ustvarite prvi oglas
                </button>
              )
            }
          />
        )}
      </section>
    </>
  );
}
const editorFields = [
  ["title", "Naslov"],
  ["description", "Opis"],
  ["city", "Kraj"],
  ["publicLocation", "Javna lokacija"],
  ["exactAddress", "Natančen naslov"],
  ["propertyType", "Vrsta nepremičnine"],
  ["price", "Cena (€)"],
  ["areaM2", "Površina (m²)"],
] as const;
export function ListingEditor() {
  const { id } = useParams();
  const { profile, session, loading } = useSession();
  const data = useResource<Listing>(`/properties/${id}`);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const loaded = useRef("");
  const [dirty, setDirty] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (data.value && loaded.current !== data.value.id) {
      loaded.current = data.value.id;
      setDraft(
        Object.fromEntries([
          ...editorFields.map(([name]) => [
            name,
            String(data.value![name] ?? ""),
          ]),
          ["listingType", data.value.listingType || ""],
        ]),
      );
      setDirty(false);
    }
  }, [data.value]);
  if (loading) return <Loading />;
  if (!profile) return <Navigate to="/prijava" replace />;
  if (!data.value)
    return data.error ? (
      <Notice tone="error" onRetry={data.reload}>
        {data.error}
      </Notice>
    ) : (
      <Loading label="Nalaganje oglasa …" />
    );
  const p = data.value;
  if (profile.role !== "ADVERTISER" || p.advertiserId !== profile.id)
    return <Notice tone="error">Urejate lahko samo svoje oglase.</Notice>;
  if (p.status === "PUBLISHED")
    return (
      <>
        <PageHeading
          title="Urejanje objavljenega oglasa"
          description="Pred spremembami vrnite oglas v osnutek. Za ponovno objavo bo potrebna odobritev administratorja."
        />
        <EditListingAction listing={p} onStarted={data.reload} />
      </>
    );
  if (!["DRAFT", "REJECTED"].includes(p.status))
    return (
      <Notice>
        Ta oglas trenutno ni na voljo za urejanje.{" "}
        <Link to={`/nepremicnine/${p.id}`}>Odprite podrobnosti</Link>.
      </Notice>
    );
  const complete =
    editorFields.every(([name]) =>
      name === "price" || name === "areaM2"
        ? Number(draft[name]) > 0
        : !!draft[name]?.trim(),
    ) && !!draft.listingType;
  function change(name: string, value: string) {
    setDraft((d) => ({ ...d, [name]: value }));
    setDirty(true);
    setMessage("");
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
      "value",
    );
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const body = {
      ...values,
      listingType: values.listingType || null,
      price: values.price === "" ? null : Number(values.price),
      areaM2: values.areaM2 === "" ? null : Number(values.areaM2),
    };
    setBusy(true);
    setMessage("");
    setError("");
    setFields({});
    try {
      await request(`/properties/${id}`, session?.access_token, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setDirty(false);
      if (action === "submit") {
        await request(`/properties/${id}/submit`, session?.access_token, {
          method: "POST",
        });
        navigate(`/nepremicnine/${id}`);
      } else {
        setMessage("Osnutek je shranjen.");
        data.reload();
      }
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError) setFields(e.fields);
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setError("");
    setMessage("");
    if (p.photos.length + list.length > 10) {
      setError("Oglas ima lahko največ 10 fotografij.");
      return;
    }
    if (
      list.some(
        (file) =>
          file.size > 5 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp"].includes(file.type),
      )
    ) {
      setError("Izberite fotografije JPG, PNG ali WebP, velike največ 5 MB.");
      return;
    }
    setBusy(true);
    try {
      for (const file of list) {
        const form = new FormData();
        form.set("photo", file);
        await request(`/properties/${id}/photos`, session?.access_token, {
          method: "POST",
          body: form,
        });
      }
      setMessage("Fotografije so naložene.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      data.reload();
      setBusy(false);
    }
  }
  async function remove() {
    if (!removeId) return;
    setBusy(true);
    setError("");
    try {
      await request(
        `/properties/${id}/photos/${removeId}`,
        session?.access_token,
        { method: "DELETE" },
      );
      setRemoveId(null);
      data.reload();
      setMessage("Fotografija je odstranjena.");
    } catch (e) {
      setError((e as Error).message);
      setRemoveId(null);
    } finally {
      setBusy(false);
    }
  }
  function field(name: (typeof editorFields)[number][0], hint?: string) {
    const label = editorFields.find((f) => f[0] === name)![1];
    return (
      <div
        className={`field ${name === "description" || name === "title" ? "field-full" : ""}`}
      >
        <label htmlFor={name}>{label}</label>
        {name === "description" ? (
          <textarea
            id={name}
            name={name}
            rows={5}
            value={draft[name] || ""}
            onChange={(e) => change(name, e.target.value)}
            aria-invalid={!!fields[name]}
            disabled={busy}
          />
        ) : (
          <input
            id={name}
            name={name}
            value={draft[name] || ""}
            onChange={(e) => change(name, e.target.value)}
            type={name === "price" || name === "areaM2" ? "number" : "text"}
            min="0.01"
            step="0.01"
            list={name === "propertyType" ? "editor-property-types" : undefined}
            aria-invalid={!!fields[name]}
            disabled={busy}
          />
        )}{" "}
        {fields[name] ? (
          <p className="field-error">{fields[name]}</p>
        ) : (
          hint && <p className="field-hint">{hint}</p>
        )}
      </div>
    );
  }
  return (
    <>
      <Link to="/moji-oglasi" className="back-link">
        <ArrowLeft size={15} />
        Moji oglasi
      </Link>
      <PageHeading
        eyebrow="PRIPRAVITE NOVO ZGODBO"
        title="Urejanje oglasa"
        description="Dober oglas se začne s premišljenimi podrobnostmi."
        action={<Badge status={p.status} />}
      />
      {p.reviewReason && (
        <Notice title="Povratna informacija pregleda">{p.reviewReason}</Notice>
      )}
      <nav className="editor-progress" aria-label="Razdelki oglasa">
        {[
          "Osnovni podatki",
          "Lokacija",
          "Cena in značilnosti",
          "Fotografije",
          "Pregled in oddaja",
        ].map((label, i) => (
          <a href={`#editor-${i + 1}`} key={label}>
            <span>{i + 1}</span>
            {label}
          </a>
        ))}
      </nav>
      <div className="editor-layout">
        <form id="listing-form" className="editor-form" onSubmit={save}>
          <section className="panel editor-section" id="editor-1">
            <div className="editor-section-heading">
              <span>01</span>
              <div>
                <h2>Osnovni podatki</h2>
                <p>Predstavite značaj svoje nepremičnine.</p>
              </div>
            </div>
            <div className="form-grid">
              {field(
                "title",
                "Kratek naslov, ki pove, zakaj je vaš prostor poseben.",
              )}
              {field("propertyType")}
              <datalist id="editor-property-types">
                <option>Stanovanje</option>
                <option>Hiša</option>
                <option>Zemljišče</option>
                <option>Poslovni prostor</option>
              </datalist>
              <div className="field">
                <label htmlFor="listingType">Namen</label>
                <select
                  id="listingType"
                  name="listingType"
                  aria-label="Namen"
                  value={draft.listingType || ""}
                  disabled={busy}
                  onChange={(e) => change("listingType", e.target.value)}
                  aria-invalid={!!fields.listingType}
                >
                  <option value="">Izberite namen</option>
                  <option value="SALE">Prodaja</option>
                  <option value="RENT">Najem</option>
                </select>
                {fields.listingType && (
                  <p className="field-error">{fields.listingType}</p>
                )}
              </div>
              {field(
                "description",
                "Opišite prostor, okolico in stvari, zaradi katerih se bo nekdo počutil doma.",
              )}
            </div>
          </section>
          <section className="panel editor-section" id="editor-2">
            <div className="editor-section-heading">
              <span>02</span>
              <div>
                <h2>Lokacija</h2>
                <p>Pravo okolje je del dobrega doma.</p>
              </div>
            </div>
            <div className="form-grid">
              {field("city")}
              {field(
                "publicLocation",
                "Približna lokacija, ki je vidna obiskovalcem.",
              )}
              {field("exactAddress")}
            </div>
            <div className="privacy-note">
              <ShieldCheck size={20} />
              <p>
                Natančen naslov ostane zaseben. Vidijo ga lastnik, administrator
                pri pregledu in interesent s potrjenim ogledom aktivnega oglasa.
              </p>
            </div>
          </section>
          <section className="panel editor-section" id="editor-3">
            <div className="editor-section-heading">
              <span>03</span>
              <div>
                <h2>Cena in značilnosti</h2>
                <p>Jasni podatki za lažjo odločitev.</p>
              </div>
            </div>
            <div className="form-grid">
              {field(
                "price",
                draft.listingType === "RENT"
                  ? "Mesečna najemnina v evrih."
                  : "Skupna prodajna cena v evrih.",
              )}
              {field("areaM2", "Površina v kvadratnih metrih.")}
            </div>
          </section>
          <section className="panel editor-section" id="editor-4">
            <div className="editor-section-heading">
              <span>04</span>
              <div>
                <h2>Fotografije</h2>
                <p>Naj svetloba in prostor povesta svojo zgodbo.</p>
              </div>
              <span className="subtle-counter">{p.photos.length}/10</span>
            </div>
            <div
              className={`upload-dropzone ${dragging ? "dragging" : ""} ${busy ? "disabled" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (!busy) void upload(e.dataTransfer.files);
              }}
            >
              <UploadCloud size={31} strokeWidth={1.3} />
              <strong>Povlecite fotografije sem</strong>
              <span>ali jih izberite iz svoje naprave</span>
              <button
                type="button"
                className="button button-secondary"
                disabled={busy || p.photos.length >= 10}
                onClick={() => fileInput.current?.click()}
              >
                <ImagePlus size={16} />
                Izberi fotografije
              </button>
              <input
                ref={fileInput}
                className="sr-only"
                type="file"
                aria-label="Dodaj fotografijo"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={busy || p.photos.length >= 10}
                onChange={(e) => {
                  if (e.target.files) void upload(e.target.files);
                  e.target.value = "";
                }}
              />
              <small>JPG, PNG, WebP · do 5 MB · fotografije niso obvezne</small>
            </div>
            <div className="editor-photos">
              {p.photos.map((photo, i) => (
                <div key={photo.id} className="editor-photo">
                  <Photo propertyId={p.id} photoId={photo.id} />
                  {i === 0 && (
                    <span className="photo-cover-label">
                      Naslovna fotografija
                    </span>
                  )}
                  <button
                    type="button"
                    className="photo-remove"
                    aria-label="Odstrani fotografijo"
                    disabled={busy}
                    onClick={() => setRemoveId(photo.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className="panel editor-section" id="editor-5">
            <div className="editor-section-heading">
              <span>05</span>
              <div>
                <h2>Pregled in oddaja</h2>
                <p>Še zadnji pogled pred novim začetkom.</p>
              </div>
            </div>
            <div className={`completion-note ${complete ? "complete" : ""}`}>
              <CheckCircle2 size={24} />
              <div>
                <strong>
                  {complete
                    ? "Podatki so pripravljeni za pregled."
                    : "Dopolnite podatke pred oddajo."}
                </strong>
                <p>
                  {complete
                    ? "Po oddaji bo administrator preveril vaš oglas. Objavljen bo šele po odobritvi."
                    : "Izpolnite naslov, opis, lokacijo, vrsto, namen ter pozitivno ceno in površino. Osnutek lahko shranite tudi prej."}
                </p>
              </div>
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            {message && <Notice tone="success">{message}</Notice>}
          </section>
        </form>
        <aside className="editor-preview">
          <p className="eyebrow">PREDOGLED VAŠEGA OGLASA</p>
          <div className="preview-card">
            <div className="preview-image">
              {p.photos[0] ? (
                <Photo propertyId={p.id} photoId={p.photos[0].id} />
              ) : (
                <PhotoFallback />
              )}
              <span className="card-purpose">
                {draft.listingType === "RENT" ? "Za najem" : "Za nakup"}
              </span>
            </div>
            <div className="preview-content">
              <p className="property-location">
                <MapPin size={13} />
                {draft.city || "Vaš kraj"}
              </p>
              <h3>{draft.title || "Naslov vašega oglasa"}</h3>
              <p>
                {draft.propertyType || "Vrsta nepremičnine"}
                {draft.areaM2 && ` · ${number(draft.areaM2)} m²`}
              </p>
              <strong>
                {draft.price ? money(draft.price) : "Cena še ni določena"}
                {draft.listingType === "RENT" && <small> / mesec</small>}
              </strong>
            </div>
          </div>
          <div className="editor-tip">
            <Info size={19} />
            <p>
              Osnutek je viden samo vam. Po oddaji ga pregleda administrator.
            </p>
          </div>
        </aside>
      </div>
      <div className="editor-action-bar">
        <span>
          <span className={`save-dot ${dirty ? "unsaved" : ""}`} />
          {busy
            ? "Shranjevanje …"
            : dirty
              ? "Neshranjene spremembe"
              : "Pripravljeno za naslednji korak"}
        </span>
        <div>
          <button
            form="listing-form"
            className="button button-secondary"
            type="submit"
            value="save"
            disabled={busy}
          >
            Shrani osnutek
          </button>
          <button
            form="listing-form"
            className="button button-primary"
            type="submit"
            value="submit"
            disabled={busy}
          >
            Oddaj v pregled <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={remove}
        title="Odstranim fotografijo?"
        description="Fotografija ne bo več prikazana ob oglasu. Po potrebi jo lahko ponovno naložite."
        confirmLabel="Odstrani"
        danger
        busy={busy}
      />
    </>
  );
}
export function AdminProperties() {
  const { profile, loading } = useSession();
  const data = useResource<Listing[]>(
    profile?.role === "ADMIN" ? "/admin/properties" : null,
  );
  const [query, setQuery] = useState("");
  if (loading) return <Loading />;
  if (!profile) return <Navigate to="/prijava" replace />;
  if (profile.role !== "ADMIN")
    return <Notice tone="error">Dostop ni dovoljen.</Notice>;
  const pending = data.value || [];
  const shown = pending.filter((p) =>
    `${p.title} ${p.city}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="PREGLED IN ZAUPANJE"
        title="Pregled oglasov"
        description="Poskrbite, da vsak novi prostor dobi dobro predstavitev."
        action={
          <span className="queue-count">
            <span />
            {data.loading ? "…" : pending.length} v čakalni vrsti
          </span>
        }
      />
      <section className="panel management-panel">
        <div className="queue-toolbar">
          <div>
            <h2>Čakajo na vaš pregled</h2>
            <p>Pred objavo preverite popolnost in ustreznost oglasa.</p>
          </div>
          <div className="input-icon table-search">
            <Search size={16} />
            <input
              aria-label="Išči v pregledih"
              placeholder="Naslov ali kraj …"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        {data.error ? (
          <Notice tone="error" onRetry={data.reload}>
            {data.error}
          </Notice>
        ) : data.loading ? (
          <Loading />
        ) : shown.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nepremičnina</th>
                  <th>Namen in cena</th>
                  <th>Status</th>
                  <th className="align-right">Pregled</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link className="table-property" to={`/pregled/${p.id}`}>
                        <div className="table-thumbnail">
                          {p.photos[0] ? (
                            <Photo propertyId={p.id} photoId={p.photos[0].id} />
                          ) : (
                            <PhotoFallback />
                          )}
                        </div>
                        <div>
                          <strong>{p.title}</strong>
                          <small>
                            <MapPin size={12} />
                            {p.city} · {p.propertyType}
                          </small>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span className="table-price">{money(p.price)}</span>
                      <small className="table-secondary">
                        {p.listingType === "RENT"
                          ? "Najem na mesec"
                          : "Prodaja"}
                      </small>
                    </td>
                    <td>
                      <Badge status={p.status} />
                    </td>
                    <td className="align-right">
                      <Link className="table-action" to={`/pregled/${p.id}`}>
                        Preglej oglas <ArrowUpRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            compact
            icon={FileCheck2}
            title={query ? "Ni zadetkov za to iskanje." : "Vse je pregledano."}
            description={
              query
                ? "Poskusite z drugim naslovom ali krajem."
                : "Trenutno ni novih oglasov, ki bi čakali na vašo odločitev."
            }
          />
        )}
      </section>
    </>
  );
}
function Gallery({ listing: p }: { listing: Listing }) {
  const [active, setActive] = useState<number | null>(null);
  const photos = p.photos || [];
  if (!photos.length)
    return (
      <div className="gallery gallery-empty">
        <PhotoFallback large />
      </div>
    );
  return (
    <>
      <div className={`gallery gallery-count-${Math.min(photos.length, 3)}`}>
        {photos.slice(0, 3).map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            className={`gallery-image gallery-image-${i}`}
            aria-label={`Odpri fotografijo ${i + 1}`}
            onClick={() => setActive(i)}
          >
            <Photo propertyId={p.id} photoId={photo.id} eager={i === 0} />
            <span className="gallery-expand">
              <Maximize2 size={18} />
            </span>
          </button>
        ))}
        <button className="gallery-all button" onClick={() => setActive(0)}>
          <Grid2X2 size={15} />
          Vse fotografije ({photos.length})
        </button>
      </div>
      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={`Fotografije · ${p.title || "Nepremičnina"}`}
        className="gallery-modal"
      >
        {active !== null && (
          <>
            <div className="lightbox-image">
              <Photo propertyId={p.id} photoId={photos[active].id} eager />
            </div>
            <div className="lightbox-controls">
              <button
                className="icon-button"
                aria-label="Prejšnja fotografija"
                disabled={photos.length < 2}
                onClick={() =>
                  setActive((active + photos.length - 1) % photos.length)
                }
              >
                <ChevronLeft />
              </button>
              <span aria-live="polite">
                {active + 1} / {photos.length}
              </span>
              <button
                className="icon-button"
                aria-label="Naslednja fotografija"
                disabled={photos.length < 2}
                onClick={() => setActive((active + 1) % photos.length)}
              >
                <ChevronRight />
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
export function PropertyPage({ review = false }: { review?: boolean }) {
  const { id } = useParams();
  const { profile, session, loading } = useSession();
  const data = useResource<Listing>(`/properties/${id}`);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [slotVersion, setSlotVersion] = useState(0);
  if (review && loading) return <Loading />;
  if (review && !profile) return <Navigate to="/prijava" replace />;
  if (review && profile?.role !== "ADMIN")
    return <Notice tone="error">Dostop ni dovoljen.</Notice>;
  if (!data.value)
    return (
      <div className={review ? "" : "content-width detail-loading"}>
        {data.error ? (
          <EmptyState
            title="Tega oglasa ni mogoče odpreti."
            description={data.error}
            action={
              <Link
                className="button button-secondary"
                to={review ? "/pregled" : "/nepremicnine"}
              >
                Nazaj na ponudbo
              </Link>
            }
          />
        ) : (
          <Loading label="Nalaganje oglasa …" />
        )}
      </div>
    );
  const p = data.value;
  const isOwner =
    p.advertiserId === profile?.id && profile?.role === "ADVERTISER";
  const canViewExact = isOwner || profile?.role === "ADMIN";
  async function submitReview() {
    if (!decision || (decision === "reject" && !reason.trim())) return;
    setBusy(true);
    setError("");
    try {
      await request(`/properties/${id}/review`, session?.access_token, {
        method: "POST",
        body: JSON.stringify(
          decision === "approve"
            ? { decision }
            : { decision, reason: reason.trim() },
        ),
      });
      setDecision(null);
      setReason("");
      setMessage("Odločitev je shranjena.");
      data.reload();
    } catch (e) {
      setError((e as Error).message);
      setDecision(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article
      className={`property-detail ${review ? "review-detail" : "content-width"}`}
    >
      <div className="breadcrumb">
        <Link to={review ? "/pregled" : "/nepremicnine"}>
          {review ? "Pregled oglasov" : "Nepremičnine"}
        </Link>
        <ChevronRight size={13} />
        <span>{p.city || "Podrobnosti oglasa"}</span>
      </div>
      <header className="detail-heading">
        <div>
          <div className="detail-labels">
            <Badge status={p.status} />
            <span className="eyebrow">{p.propertyType || "NEPREMIČNINA"}</span>
          </div>
          <h1>{p.title || "Osnutek oglasa"}</h1>
          <p>
            <MapPin size={16} />
            {p.city}
            {p.publicLocation && ` · ${p.publicLocation}`}
          </p>
        </div>
        <div className="detail-price">
          <strong>{money(p.price)}</strong>
          <span>
            {p.listingType === "RENT" ? "mesečna najemnina" : "prodajna cena"}
            {p.areaM2 ? ` · ${number(p.areaM2)} m²` : ""}
          </span>
        </div>
      </header>
      <Gallery listing={p} />
      <div className="detail-columns">
        <div className="detail-primary">
          <div className="property-facts">
            {[
              {
                label: "Vrsta nepremičnine",
                value: p.propertyType || "Ni določeno",
                Icon: Building2,
              },
              {
                label: "Površina",
                value: p.areaM2 ? `${number(p.areaM2)} m²` : "Ni določeno",
                Icon: Ruler,
              },
              {
                label: "Namen",
                value: p.listingType
                  ? statusLabels[p.listingType]
                  : "Ni določen",
                Icon: House,
              },
            ].map(({ label, value, Icon }) => (
              <div key={label}>
                <Icon size={24} strokeWidth={1.3} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <section className="detail-section">
            <span className="eyebrow">PREDSTAVITEV PROSTORA</span>
            <h2>Prostor za novo poglavje.</h2>
            <p className="description">
              {p.description || "Opis še ni dodan."}
            </p>
          </section>
          <section className="location-card">
            <span className="location-icon">
              <MapPin size={26} strokeWidth={1.4} />
            </span>
            <div>
              <span className="eyebrow">JAVNA LOKACIJA</span>
              <h3>{p.publicLocation || p.city || "Lokacija še ni določena"}</h3>
              <p>{p.city}</p>
            </div>
            <div className="location-privacy">
              <ShieldCheck size={17} />
              Natančen naslov je zaseben.
            </div>
          </section>
          {canViewExact && p.exactAddress && (
            <div className="authorized-address">
              <ShieldCheck size={21} />
              <div>
                <span>Naslov za pooblaščen pregled</span>
                <strong>{p.exactAddress}</strong>
              </div>
            </div>
          )}
          {p.reviewReason && (
            <Notice title="Razlog zavrnitve">{p.reviewReason}</Notice>
          )}
          {isOwner && <EditListingAction listing={p} />}
          {message && <Notice tone="success">{message}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          {isOwner && (
            <OwnerRequests
              key={p.status}
              propertyId={p.id}
              active={p.status === "PUBLISHED"}
              onDecision={() => setSlotVersion((v) => v + 1)}
            />
          )}{" "}
          {isOwner && p.status === "PUBLISHED" && (
            <CloseListing
              propertyId={p.id}
              listingType={p.listingType}
              onClosed={data.reload}
            />
          )}
        </div>
        <aside className="detail-sidebar">
          {profile?.role === "ADMIN" && p.status === "PENDING_REVIEW" ? (
            <section className="panel review-card">
              <span className="section-icon">
                <FileCheck2 size={24} />
              </span>
              <h2>Vaša odločitev šteje.</h2>
              <p>
                Preverite podatke, fotografije in ustreznost oglasa, preden
                postane javen.
              </p>
              <div className="review-checklist">
                <span>
                  <Check size={15} />
                  Opis in osnovni podatki
                </span>
                <span>
                  <Check size={15} />
                  Cena, površina in lokacija
                </span>
                <span>
                  <Check size={15} />
                  Fotografije in predstavitev
                </span>
              </div>
              <button
                className="button button-primary button-full"
                onClick={() => setDecision("approve")}
                disabled={busy}
              >
                Odobri objavo <Check size={17} />
              </button>
              <button
                className="button button-secondary button-full"
                onClick={() => setDecision("reject")}
                disabled={busy}
              >
                Zavrni oglas
              </button>
              <p className="field-hint">
                Ob zavrnitvi navedite, kaj mora oglaševalec izboljšati.
              </p>
            </section>
          ) : p.status === "PUBLISHED" ? (
            <ViewingPanel
              key={slotVersion}
              propertyId={p.id}
              isOwner={!!isOwner}
            />
          ) : (
            <section className="panel listing-state-card">
              <FileText size={31} strokeWidth={1.3} />
              <h2>
                {p.status === "PENDING_REVIEW"
                  ? "Vaš oglas je v dobrih rokah."
                  : p.status === "DRAFT"
                    ? "Vse se začne z osnutkom."
                    : "Vsak zaključek je nov začetek."}
              </h2>
              <p>
                {p.status === "PENDING_REVIEW"
                  ? "Oglas čaka na pregled administratorja. Po odobritvi bo viden v javni ponudbi."
                  : p.status === "DRAFT"
                    ? "Dopolnite podatke in oddajte svoj oglas v pregled."
                    : "Ta oglas trenutno ni aktiven za javni prikaz ali nove oglede."}
              </p>
              <Badge status={p.status} />
            </section>
          )}
          <div className="detail-side-note">
            <ShieldCheck size={18} />
            <p>
              Dogovori za ogled ostajajo pregledni. Natančen naslov prejme
              interesent šele po potrditvi aktivnega ogleda.
            </p>
          </div>
        </aside>
      </div>
      <ConfirmDialog
        open={decision === "approve"}
        onClose={() => setDecision(null)}
        onConfirm={submitReview}
        title="Odobrim objavo oglasa?"
        description="Oglas bo javno viden v ponudbi. Preverite, da so podatki in predstavitev ustrezni."
        confirmLabel="Potrdi objavo"
        busy={busy}
      />
      <Modal
        open={decision === "reject"}
        onClose={() => !busy && setDecision(null)}
        title="Kaj mora oglaševalec izboljšati?"
      >
        <p className="modal-description">
          Vaša obrazložitev pomaga lastniku pripraviti boljšo predstavitev.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitReview();
          }}
        >
          <div className="field">
            <label htmlFor="review-reason">Razlog zavrnitve</label>
            <textarea
              id="review-reason"
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              maxLength={2000}
              placeholder="Jasno opišite, katere podatke je treba dopolniti …"
              disabled={busy}
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setDecision(null)}
              disabled={busy}
            >
              Prekliči
            </button>
            <button
              className="button button-danger"
              disabled={!reason.trim() || busy}
            >
              {busy ? "Shranjevanje …" : "Potrdi zavrnitev"}
            </button>
          </div>
        </form>
      </Modal>
    </article>
  );
}
