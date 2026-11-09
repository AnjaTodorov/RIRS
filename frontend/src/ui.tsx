import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type InputHTMLAttributes,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Home,
  Info,
  LoaderCircle,
  X,
  type LucideIcon,
} from "lucide-react";

export const statusLabels: Record<string, string> = {
  DRAFT: "Osnutek",
  PENDING_REVIEW: "V pregledu",
  PUBLISHED: "Objavljen",
  REJECTED: "Zavrnjeno",
  INACTIVE: "Umaknjen",
  SOLD: "Prodano",
  RENTED: "Oddano",
  PENDING: "V čakanju",
  CONFIRMED: "Potrjeno",
  CANCELLED: "Preklicano",
  SALE: "Prodaja",
  RENT: "Najem",
};
export const roleLabels = {
  SEEKER: "Iskalec nepremičnine",
  ADVERTISER: "Oglaševalec",
  ADMIN: "Administrator",
};
export const money = (value: string | number | null) =>
  value === null
    ? "Cena še ni določena"
    : new Intl.NumberFormat("sl-SI", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }).format(Number(value));
export const number = (value: string | number) =>
  new Intl.NumberFormat("sl-SI", { maximumFractionDigits: 2 }).format(
    Number(value),
  );

export function Brand({
  plain = false,
  inverse = false,
}: {
  plain?: boolean;
  inverse?: boolean;
}) {
  const content = (
    <>
      <img
        className="brand-symbol"
        src="/assets/domora-logo.svg"
        width="38"
        height="38"
        alt=""
        aria-hidden="true"
      />
      <span>
        domora<span className="brand-period">.</span>
      </span>
    </>
  );
  return plain ? (
    <a
      href="/"
      className={`brand ${inverse ? "brand-inverse" : ""}`}
      aria-label="Domora – začetna stran"
    >
      {content}
    </a>
  ) : (
    <Link
      to="/"
      className={`brand ${inverse ? "brand-inverse" : ""}`}
      aria-label="Domora – začetna stran"
    >
      {content}
    </Link>
  );
}
export function Badge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span />
      {statusLabels[status] || status}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="lead-muted">{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}
export function Notice({
  children,
  tone = "info",
  title,
  onRetry,
}: {
  children: ReactNode;
  tone?: "info" | "error" | "success";
  title?: string;
  onRetry?: () => void;
}) {
  const Icon =
    tone === "error" ? CircleAlert : tone === "success" ? CheckCircle2 : Info;
  return (
    <div
      className={`notice notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon size={19} aria-hidden="true" />
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
        {onRetry && (
          <button className="inline-action" type="button" onClick={onRetry}>
            Poskusite znova <ArrowUpRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
export function EmptyState({
  icon: Icon = Home,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state ${compact ? "empty-compact" : ""}`}>
      <span className="empty-icon">
        <Icon size={29} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
export function Loading({
  label = "Nalaganje …",
  cards = false,
}: {
  label?: string;
  cards?: boolean;
}) {
  return cards ? (
    <div className="property-grid" role="status" aria-label={label}>
      {[1, 2, 3].map((i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-photo" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-line" />
          </div>
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  ) : (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{label}</span>
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    else if (!open && dialog?.open) dialog.close();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          type="button"
          aria-label="Zapri"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Potrdi",
  busy = false,
  danger = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  danger?: boolean;
  children?: ReactNode;
}) {
  return (
    <Modal open={open} onClose={() => !busy && onClose()} title={title}>
      <p className="modal-description">{description}</p>
      {children}
      <div className="modal-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onClose}
          disabled={busy}
        >
          Prekliči
        </button>
        <button
          type="button"
          className={`button ${danger ? "button-danger" : "button-primary"}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? (
            <>
              <LoaderCircle className="spin" size={17} />
              Shranjevanje …
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </Modal>
  );
}
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-control">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        className="icon-button"
        type="button"
        aria-label={visible ? "Skrij geslo" : "Prikaži geslo"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
export function AuthLayout({
  children,
  mode,
}: {
  children: ReactNode;
  mode: "login" | "register";
}) {
  return (
    <main className="auth-layout">
      <aside className="auth-visual">
        <img
          src="/assets/interior.webp"
          alt="Svetla dnevna soba z naravnimi materiali in zelenjem"
        />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-top">
          <Brand plain inverse />
          <span>PROSTOR ZA NOVE ZAČETKE</span>
        </div>
        <div className="auth-quote">
          <span className="overline-light">VEČ KOT NEPREMIČNINA</span>
          <h2>
            Dober prostor.
            <br />
            <em>Še lepši začetek.</em>
          </h2>
          <p>
            Za vsakim domom je zgodba.
            <br />
            Vaša se lahko začne tukaj.
          </p>
          <div className="auth-visual-bottom">
            <span>Dobrodošli v Domori.</span>
            <span>
              Dom, po vaše. <ArrowUpRight size={17} />
            </span>
          </div>
        </div>
      </aside>
      <section className="auth-content">
        <div className="auth-topline">
          <a href="/nepremicnine" className="text-link">
            ← Nazaj na ponudbo
          </a>
          <Brand plain />
        </div>
        <div
          className={`auth-form-wrap ${mode === "register" ? "register-wrap" : ""}`}
        >
          {children}
        </div>
        <div className="auth-bottomline">
          <span>Domora · Prostor za vaše načrte</span>
          <span>
            <Check size={13} /> Vaši podatki ostajajo zasebni.
          </span>
        </div>
      </section>
    </main>
  );
}
