import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { request, useSession, ApiError } from "./session";
import { ViewingPanel, OwnerRequests, CloseListing } from "./Viewings";

export type Listing = {
  id: string;
  title: string;
  description: string;
  city: string;
  publicLocation: string;
  exactAddress?: string;
  propertyType: string;
  listingType: "SALE" | "RENT" | null;
  price: string | null;
  areaM2: string | null;
  status: string;
  reviewReason?: string | null;
  photos: { id: string; position: number }[];
};
export const labels: Record<string, string> = {
  DRAFT: "Osnutek",
  PENDING_REVIEW: "V pregledu",
  PUBLISHED: "Objavljen",
  REJECTED: "Zavrnjen",
  INACTIVE: "Umaknjen",
  SOLD: "Prodan",
  RENTED: "Oddan",
  SALE: "Prodaja",
  RENT: "Najem",
};
export function useResource<T>(path: string) {
  const { session } = useSession();
  const identity = path + "|" + (session?.access_token || "public");
  const [state, setState] = useState<{
    key: string;
    value: T | null;
    error: string;
    loading: boolean;
  }>({ key: "", value: null, error: "", loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setState((previous) =>
      previous.key === identity
        ? { ...previous, loading: true, error: "" }
        : { key: identity, value: null, error: "", loading: true },
    );
    request<T>(path, session?.access_token)
      .then((v) => {
        if (active)
          setState({ key: identity, value: v, error: "", loading: false });
      })
      .catch((e) => {
        if (active) {
          setState({
            key: identity,
            value: null,
            error: e.message,
            loading: false,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [path, session?.access_token, version]);
  const current =
    state.key === identity ? state : { value: null, error: "", loading: true };
  return { ...current, reload: () => setVersion((v) => v + 1) };
}
export function Photo({
  propertyId,
  photoId,
}: {
  propertyId: string;
  photoId: string;
}) {
  const { value } = useResource<{ url: string }>(
    `/properties/${propertyId}/photos/${photoId}/url`,
  );
  return value ? (
    <img
      className="property-image"
      src={value.url}
      alt="Fotografija nepremičnine"
      loading="lazy"
    />
  ) : (
    <div
      className="photo-placeholder"
      aria-label="Fotografija trenutno ni na voljo"
    >
      ⌂
    </div>
  );
}
function Card({ listing: p }: { listing: Listing }) {
  return (
    <Link className="property-card" to={`/nepremicnine/${p.id}`}>
      {p.photos[0] ? (
        <Photo propertyId={p.id} photoId={p.photos[0].id} />
      ) : (
        <div className="photo-placeholder">⌂</div>
      )}
      <div className="card-body">
        <span className="badge">
          {labels[p.status] || p.status}{" "}
          {p.listingType && `· ${labels[p.listingType]}`}
        </span>
        <h2>{p.title || "Nov osnutek"}</h2>
        <p>
          {p.city || "Kraj še ni izbran"} · {p.propertyType}
        </p>
        <p>
          <strong>
            {p.price
              ? new Intl.NumberFormat("sl-SI", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                }).format(Number(p.price))
              : "Cena še ni določena"}
          </strong>
          {p.listingType === "RENT" && " / mesec"}
          {p.areaM2 && ` · ${p.areaM2} m²`}
        </p>
      </div>
    </Link>
  );
}
export function Catalog() {
  const [params, setParams] = useSearchParams();
  const [validation, setValidation] = useState("");
  const data = useResource<Listing[]>(`/properties?${params}`);
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
  }
  return (
    <>
      <section className="hero">
        <span className="eyebrow">PROSTOR ZA NOVE ZAČETKE</span>
        <h1>Poiščite svoj naslednji dom.</h1>
        <p>Objavljene nepremičnine za vaše načrte.</p>
      </section>
      <form onSubmit={search} className="filters" key={params.toString()}>
        <label>
          Kraj
          <input name="city" defaultValue={params.get("city") || ""} />
        </label>
        <label>
          Namen
          <select
            name="listingType"
            defaultValue={params.get("listingType") || ""}
          >
            <option value="">Vsi</option>
            <option value="SALE">Prodaja</option>
            <option value="RENT">Najem</option>
          </select>
        </label>
        <label>
          Vrsta
          <input
            name="propertyType"
            defaultValue={params.get("propertyType") || ""}
            placeholder="npr. Stanovanje"
          />
        </label>
        {[
          ["minPrice", "Cena od (€)"],
          ["maxPrice", "Cena do (€)"],
          ["minArea", "Površina od (m²)"],
          ["maxArea", "Površina do (m²)"],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              type="number"
              min="0"
              step="0.01"
              defaultValue={params.get(key) || ""}
            />
          </label>
        ))}
        <button>Išči</button>
      </form>
      <div className="filter-tags">
        {Array.from(params).map(([key, value]) => (
          <button
            className="secondary"
            key={key}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.delete(key);
              setParams(next);
            }}
          >
            {value} ×
          </button>
        ))}
      </div>
      {(validation || data.error) && (
        <p role="alert" className="notice">
          {validation || data.error}
        </p>
      )}
      {data.loading ? (
        <p role="status">Nalaganje ponudb …</p>
      ) : data.value?.length ? (
        <div className="property-grid">
          {data.value.map((p) => (
            <Card key={p.id} listing={p} />
          ))}
        </div>
      ) : (
        <p className="empty-state">
          {params.size ? "Ni zadetkov." : "Trenutno ni objavljenih oglasov."}
        </p>
      )}
    </>
  );
}
export function MyProperties() {
  const { profile, session, loading } = useSession();
  const data = useResource<Listing[]>("/my/properties");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) return <p>Nalaganje …</p>;
  if (!profile) return <Navigate to="/prijava" replace />;
  if (profile.role !== "ADVERTISER")
    return <p>Ta pogled je namenjen oglaševalcem.</p>;
  async function create() {
    setBusy(true);
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
  return (
    <>
      <section className="page-title">
        <h1>Moji oglasi</h1>
        <button onClick={create} disabled={busy}>
          + Nov oglas
        </button>
      </section>
      {(error || data.error) && <p role="alert">{error || data.error}</p>}
      {data.value?.length ? (
        <div className="property-grid">
          {data.value.map((p) => (
            <Card key={p.id} listing={p} />
          ))}
        </div>
      ) : (
        <p className="empty-state">Pripravite svoj prvi oglas.</p>
      )}
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
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  if (loading) return <p>Nalaganje …</p>;
  if (!profile) return <Navigate to="/prijava" replace />;
  if (!data.value)
    return <p role="alert">{data.error || "Nalaganje oglasa …"}</p>;
  const p = data.value;
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
    setFields({});
    try {
      await request(`/properties/${id}`, session?.access_token, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
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
      setMessage((e as Error).message);
      if (e instanceof ApiError) setFields(e.fields);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File) {
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("photo", file);
      await request(`/properties/${id}/photos`, session?.access_token, {
        method: "POST",
        body: form,
      });
      data.reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(photoId: string) {
    setBusy(true);
    try {
      await request(
        `/properties/${id}/photos/${photoId}`,
        session?.access_token,
        { method: "DELETE" },
      );
      data.reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="editor">
      <h1>Urejanje oglasa</h1>
      {p.reviewReason && (
        <p className="notice">Razlog zavrnitve: {p.reviewReason}</p>
      )}
      <form className="stack" onSubmit={save}>
        {editorFields.map(([name, label]) => (
          <label key={name}>
            {label}
            {name === "description" ? (
              <textarea name={name} defaultValue={p[name] || ""} rows={5} />
            ) : (
              <input
                name={name}
                defaultValue={p[name] || ""}
                type={name === "price" || name === "areaM2" ? "number" : "text"}
                min="0.01"
                step="0.01"
                aria-invalid={!!fields[name]}
              />
            )}{" "}
            {fields[name] && (
              <span className="field-error">{fields[name]}</span>
            )}
          </label>
        ))}
        <label>
          Namen
          <select
            aria-label="Namen"
            name="listingType"
            defaultValue={p.listingType || ""}
          >
            <option value="">Izberite namen</option>
            <option value="SALE">Prodaja</option>
            <option value="RENT">Najem</option>
          </select>
          {fields.listingType && (
            <span className="field-error">{fields.listingType}</span>
          )}
        </label>
        <div className="actions">
          <button value="save" disabled={busy}>
            Shrani osnutek
          </button>
          <button value="submit" disabled={busy}>
            Oddaj v pregled
          </button>
        </div>
      </form>
      <h2>Fotografije</h2>
      <p>JPG, PNG ali WebP · največ 5 MB · do 10 fotografij · neobvezno</p>
      <input
        type="file"
        aria-label="Dodaj fotografijo"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy || p.photos.length >= 10}
        onChange={(e) => {
          if (e.target.files?.[0]) void upload(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <div className="photo-grid">
        {p.photos.map((photo) => (
          <div key={photo.id}>
            <Photo propertyId={p.id} photoId={photo.id} />
            <button disabled={busy} onClick={() => remove(photo.id)}>
              Odstrani fotografijo
            </button>
          </div>
        ))}
      </div>
      <p role="status">{message}</p>
    </section>
  );
}
export function AdminProperties() {
  const { profile, loading } = useSession();
  const data = useResource<Listing[]>("/admin/properties");
  if (loading) return <p>Nalaganje …</p>;
  if (!profile) return <Navigate to="/prijava" replace />;
  if (profile.role !== "ADMIN") return <p>Dostop ni dovoljen.</p>;
  return (
    <>
      <h1>Oglasi za pregled</h1>
      {data.error && <p role="alert">{data.error}</p>}
      {data.value?.length ? (
        <div className="property-grid">
          {data.value.map((p) => (
            <Card key={p.id} listing={p} />
          ))}
        </div>
      ) : (
        <p className="empty-state">Ni oglasov za pregled.</p>
      )}
    </>
  );
}
export function PropertyPage() {
  const { id } = useParams();
  const { profile, session } = useSession();
  const data = useResource<Listing & { advertiserId?: string }>(
    `/properties/${id}`,
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (!data.value)
    return <p role="status">{data.error || "Nalaganje oglasa …"}</p>;
  const p = data.value;
  const isOwner = p.advertiserId === profile?.id && !!profile;
  async function review(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const decision = (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
      "value",
    );
    setBusy(true);
    try {
      await request(`/properties/${id}/review`, session?.access_token, {
        method: "POST",
        body: JSON.stringify(
          decision === "approve"
            ? { decision }
            : { decision, reason: form.get("reason") },
        ),
      });
      setMessage("Odločitev je shranjena.");
      data.reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="property-detail">
      <Link to="/">← Nepremičnine</Link>
      <span className="badge">{labels[p.status]}</span>
      <h1>{p.title || "Osnutek oglasa"}</h1>
      <p>
        {p.city} · {p.propertyType} · {p.listingType && labels[p.listingType]}
      </p>
      <h2>
        {p.price && `${p.price} €`}
        {p.listingType === "RENT" && " / mesec"} · {p.areaM2} m²
      </h2>
      <div className="photo-grid">
        {p.photos.map((photo) => (
          <Photo key={photo.id} propertyId={p.id} photoId={photo.id} />
        ))}
      </div>
      <p className="description">{p.description}</p>
      <p>Javna lokacija: {p.publicLocation}</p>
      {p.exactAddress && <p>Natančen naslov: {p.exactAddress}</p>}
      {p.reviewReason && (
        <p className="notice">Razlog zavrnitve: {p.reviewReason}</p>
      )}
      {isOwner && ["DRAFT", "REJECTED"].includes(p.status) && (
        <Link className="button-link" to={`/oglasi/${p.id}/uredi`}>
          Uredi oglas
        </Link>
      )}
      {profile?.role === "ADMIN" && p.status === "PENDING_REVIEW" && (
        <form className="stack review-form" onSubmit={review}>
          <label>
            Razlog zavrnitve
            <textarea name="reason" rows={3} />
          </label>
          <div className="actions">
            <button value="approve" disabled={busy}>
              Odobri objavo
            </button>
            <button value="reject" disabled={busy}>
              Zavrni oglas
            </button>
          </div>
        </form>
      )}
      <p role="status">{message}</p>
      {p.status === "PUBLISHED" && (
        <ViewingPanel propertyId={p.id} isOwner={isOwner} />
      )}
      {isOwner && (
        <OwnerRequests
          key={p.status}
          propertyId={p.id}
          active={p.status === "PUBLISHED"}
        />
      )}
      {isOwner && p.status === "PUBLISHED" && (
        <CloseListing
          propertyId={p.id}
          listingType={p.listingType}
          onClosed={data.reload}
        />
      )}
    </article>
  );
}
