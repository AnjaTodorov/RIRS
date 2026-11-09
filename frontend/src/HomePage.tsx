import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  Check,
  Home,
  House,
  MapPin,
  MoveUpRight,
  Search,
  ShieldCheck,
  Sparkles,
  SquareStack,
  Trees,
} from "lucide-react";
import { useSession } from "./session";
import { useResource, type Listing } from "./data";
import { PropertyCard } from "./Listings";
import { EmptyState, Loading, Notice } from "./ui";

export function HomePage() {
  const [purpose, setPurpose] = useState("SALE");
  const [searchError, setSearchError] = useState("");
  const navigate = useNavigate();
  const { profile } = useSession();
  const data = useResource<Listing[]>("/properties");
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const minimum = String(values.get("minPrice") || "");
    const maximum = String(values.get("maxPrice") || "");
    if (minimum && maximum && Number(minimum) > Number(maximum)) {
      setSearchError("Najnižja cena ne sme presegati najvišje.");
      return;
    }
    const params = new URLSearchParams({ listingType: purpose });
    for (const [key, value] of values)
      if (String(value).trim()) params.set(key, String(value).trim());
    navigate(`/nepremicnine?${params}`);
  }
  const publish =
    profile?.role === "ADVERTISER"
      ? { to: "/moji-oglasi", label: "Objavite svoj oglas" }
      : profile?.role === "ADMIN"
        ? { to: "/pregled", label: "Odprite pregled oglasov" }
        : profile
          ? { to: "/nepremicnine", label: "Odkrijte ponudbo" }
          : {
              to: "/registracija?role=ADVERTISER",
              label: "Objavite svoj oglas",
            };
  return (
    <>
      <section className="home-hero content-width">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" /> DOM, PO VAŠE
            </span>
            <h1>
              Prostor, kjer
              <br />
              se začne
              <br />
              <em>vaša zgodba.</em>
            </h1>
            <p>
              Poiščite več kot štiri stene. Odkrijte kraj,
              <br className="desktop-break" /> ki bo začetek nečesa vašega.
            </p>
            <a href="#ponudba" className="hero-explore">
              <span>
                <ArrowDown size={17} />
              </span>
              Raziščite možnosti
            </a>
          </div>
          <div className="hero-image-frame">
            <img
              src="/assets/interior.webp"
              alt="S soncem obsijana dnevna soba z lesom in zelenimi rastlinami"
              fetchPriority="high"
            />
            <div className="hero-image-label">
              <span className="tiny-spark">
                <Sparkles size={16} />
              </span>{" "}
              Navdih za vaš naslednji dom
            </div>
            <div className="hero-photo-note">
              <span className="photo-note-icon">
                <House size={23} strokeWidth={1.3} />
              </span>
              <div>
                Pravi prostor.<strong>Pravi občutek.</strong>
              </div>
            </div>
            <span className="hero-photo-index">01 / DOMORA</span>
          </div>
        </div>
        <div className="hero-search">
          <div className="purpose-tabs" aria-label="Namen iskanja">
            <button
              className={purpose === "SALE" ? "active" : ""}
              aria-pressed={purpose === "SALE"}
              onClick={() => setPurpose("SALE")}
            >
              Nakup
            </button>
            <button
              className={purpose === "RENT" ? "active" : ""}
              aria-pressed={purpose === "RENT"}
              onClick={() => setPurpose("RENT")}
            >
              Najem
            </button>
          </div>
          <form onSubmit={search} onChange={() => setSearchError("")}>
            <label className="hero-search-field">
              <span>
                <MapPin size={15} /> LOKACIJA
              </span>
              <input
                name="city"
                placeholder="Kje bi radi živeli?"
                aria-label="Kraj"
              />
            </label>
            <label className="hero-search-field">
              <span>
                <Building2 size={15} /> NEPREMIČNINA
              </span>
              <select name="propertyType" aria-label="Vrsta nepremičnine">
                <option value="">Vse vrste</option>
                <option>Stanovanje</option>
                <option>Hiša</option>
                <option>Zemljišče</option>
                <option>Poslovni prostor</option>
              </select>
            </label>
            <div className="hero-search-field hero-price-field">
              <span>
                {purpose === "RENT" ? "CENA / MESEC (€)" : "CENA (€)"}
              </span>
              <div className="hero-price-range">
                <input
                  type="number"
                  name="minPrice"
                  min="0"
                  step="0.01"
                  aria-label="Najnižja cena"
                  placeholder="Od"
                />
                <span aria-hidden="true">–</span>
                <input
                  type="number"
                  name="maxPrice"
                  min="0"
                  step="0.01"
                  aria-label="Najvišja cena"
                  placeholder="Do"
                />
              </div>
            </div>
            <button className="button button-primary hero-search-button">
              <Search size={18} />
              Poišči dom
            </button>
          </form>
          {searchError && (
            <div className="hero-search-error">
              <Notice tone="error">{searchError}</Notice>
            </div>
          )}
        </div>
        <div className="hero-assurances">
          <span>
            <ShieldCheck size={16} />
            Pregledani oglasi
          </span>
          <span>
            <CalendarCheck2 size={16} />
            Ogledi, usklajeni z vami
          </span>
          <span>
            <Check size={16} />
            Preprosto od prvega koraka
          </span>
        </div>
      </section>
      <section
        id="ponudba"
        className="home-listings content-width section-space"
      >
        <div className="editorial-section-heading">
          <div>
            <span className="eyebrow">ODKRIJTE PONUDBO</span>
            <h2>
              Nekje vas že čaka
              <br />
              <em>vaš prostor.</em>
            </h2>
          </div>
          <div>
            <p>
              Različni prostori. Različne možnosti.
              <br />
              En dober začetek.
            </p>
            <Link className="text-link strong" to="/nepremicnine">
              Vse nepremičnine <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        {data.error ? (
          <Notice tone="error" onRetry={data.reload}>
            {data.error}
          </Notice>
        ) : data.loading ? (
          <Loading cards />
        ) : data.value?.length ? (
          <div className="property-grid">
            {data.value.slice(0, 3).map((p) => (
              <PropertyCard key={p.id} listing={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Novi prostori prihajajo."
            description="Trenutno ni objavljenih oglasov. Vrnite se kmalu ali postanite del ponudbe s svojo nepremičnino."
            action={
              <Link className="button button-secondary" to={publish.to}>
                {publish.label}
                <ArrowUpRight size={17} />
              </Link>
            }
          />
        )}
      </section>
      <section className="category-section section-space">
        <div className="content-width">
          <div className="section-heading-inline">
            <div>
              <span className="eyebrow">VSAK NAČRT IMA SVOJ PROSTOR</span>
              <h2>Kaj je vaša naslednja zgodba?</h2>
            </div>
            <span className="serif-note">Izberite po svoje.</span>
          </div>
          <div className="category-grid">
            {[
              {
                label: "Stanovanja",
                value: "Stanovanje",
                description: "Za vsakdan, ki vam je blizu.",
                Icon: Building2,
              },
              {
                label: "Hiše",
                value: "Hiša",
                description: "Več prostora za vaše življenje.",
                Icon: House,
              },
              {
                label: "Zemljišča",
                value: "Zemljišče",
                description: "Platno za nekaj novega.",
                Icon: Trees,
              },
              {
                label: "Poslovni prostori",
                value: "Poslovni prostor",
                description: "Prostor za velike zamisli.",
                Icon: SquareStack,
              },
            ].map(({ label, value, description, Icon }, i) => (
              <Link
                to={`/nepremicnine?propertyType=${encodeURIComponent(value)}`}
                className="category-card"
                key={value}
              >
                <span className="category-number">0{i + 1}</span>
                <Icon size={39} strokeWidth={1.1} />
                <div>
                  <h3>{label}</h3>
                  <p>{description}</p>
                </div>
                <ArrowUpRight className="category-arrow" size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section
        className="how-section content-width section-space"
        id="kako-deluje"
      >
        <div className="how-intro">
          <span className="eyebrow">OD ISKANJA DO PRVEGA OGLEDA</span>
          <h2>
            Manj zapletov.
            <br />
            <em>Več občutka doma.</em>
          </h2>
          <p>
            Domora povezuje iskanje nepremičnin in dogovarjanje za oglede. Vse
            na enem preglednem mestu.
          </p>
          <Link className="text-link strong" to="/nepremicnine">
            Začnite raziskovati <ArrowRight size={17} />
          </Link>
        </div>
        <div className="how-steps">
          {[
            {
              title: "Poiščite svoj prostor",
              copy: "Izberite lokacijo, namen in svoj proračun. Ponudbo prilagodite svojim načrtom.",
              Icon: Search,
            },
            {
              title: "Izberite svoj termin",
              copy: "Prijavite se, preverite proste termine in oglaševalcu pošljite zahtevo za ogled.",
              Icon: CalendarCheck2,
            },
            {
              title: "Spoznajte svoj novi začetek",
              copy: "Po potrditvi prejmete natančen naslov. Svoje oglede spremljajte v osebnem računu.",
              Icon: Home,
            },
          ].map(({ title, copy, Icon }, i) => (
            <div className="how-step" key={title}>
              <span className="step-line-icon">
                <Icon size={22} strokeWidth={1.5} />
              </span>
              <div>
                <span className="step-number">KORAK 0{i + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="advertiser-cta content-width">
        <div className="cta-image">
          <img
            src="/assets/architecture.webp"
            alt="Sodobna arhitektura z leseno teraso in naravno svetlobo"
            loading="lazy"
          />
        </div>
        <div className="cta-copy">
          <span className="eyebrow">ZA OGLAŠEVALCE</span>
          <h2>
            Vaš prostor.
            <br />
            <em>Nekomu nov začetek.</em>
          </h2>
          <p>
            Predstavite svojo nepremičnino, določite termine in ohranite pregled
            nad zanimanjem. Preprosto in po svoje.
          </p>
          <Link className="button button-primary" to={publish.to}>
            {publish.label}
            <ArrowUpRight size={17} />
          </Link>
          <span className="cta-footnote">
            <ShieldCheck size={14} />
            Vsak oglas pred objavo pregleda administrator.
          </span>
        </div>
      </section>
    </>
  );
}
