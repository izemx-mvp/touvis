import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox, MoreHorizontal, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { norm, initials, fDateTime } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { TimelineEvent } from "@/lib/mock";

export function PageHeader({ title, subtitle, icon, actions, eyebrow }: { title: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        {icon && <div className="grid size-11 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-glow [&_svg]:size-5">{icon}</div>}
        <div>
          {eyebrow && <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary/80">{eyebrow}</div>}
          <h1 className="text-2xl font-semibold text-foreground md:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className, bodyClass }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("glass rounded-2xl", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {action}
        </header>
      )}
      <div className={cn("p-5", bodyClass)}>{children}</div>
    </section>
  );
}

export function AnimatedNumber({ value, format = (n: number) => Math.round(n).toLocaleString("fr-FR") }: { value: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now(); const a = from.current; const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur); const e = 1 - Math.pow(1 - p, 3);
      setDisplay(a + (value - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(display)}</>;
}

const TONES = {
  cyan: "text-primary bg-primary/10 border-primary/25",
  green: "text-success bg-success/10 border-success/25",
  amber: "text-warning bg-warning/10 border-warning/25",
  red: "text-destructive bg-destructive/10 border-destructive/25",
  blue: "text-info bg-info/10 border-info/25",
  steel: "text-steel bg-steel/10 border-steel/20",
};
export type Tone = keyof typeof TONES;

export function Kpi({ label, value, format, icon, tone = "cyan", hint, to }: { label: string; value: number; format?: (n: number) => string; icon: ReactNode; tone?: Tone; hint?: string; to?: string }) {
  const body = (
    <div className="glass glass-hover group relative h-full overflow-hidden rounded-2xl p-4">
      <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-50" />
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg border [&_svg]:size-4", TONES[tone])}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold text-foreground tabular-nums"><AnimatedNumber value={value} format={format} /></div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

const STATUS_TONE: Record<string, Tone> = {
  "Payée": "green", "Normal": "green", "Actif": "green", "Active": "green", "Résolue": "green", "Accepté": "green", "Terminée": "green", "Indexé": "green", "Succès": "green", "Transformé en commande": "green", "Traitée par IA": "cyan", "Synchronisé": "green", "Intéressé": "green", "Traité": "green",
  "Proche échéance": "amber", "Stock faible": "amber", "À relancer": "amber", "En attente client": "amber", "Informations manquantes": "amber", "À valider": "amber", "Planifiée": "amber", "À rappeler": "amber", "Moyenne": "amber", "En attente": "amber", "Seuil atteint": "amber", "Suspendue": "amber", "Pause": "amber",
  "En retard": "red", "Rupture": "red", "Refusé": "red", "Erreur": "red", "Échec": "red", "Haute": "red", "Échue": "red", "Expiré": "red", "Non intéressé": "red", "Inactive": "red",
  "Relancée": "blue", "Relancé": "blue", "Envoyé": "blue", "Devis envoyé": "blue", "Nouvelle": "cyan", "En cours": "blue", "Analyse IA": "cyan", "Transférée humain": "blue", "En préparation": "blue", "Prospect": "blue",
};
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? "steel";
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium", TONES[tone], className)}>
      <span className={cn("size-1.5 rounded-full bg-current", (tone === "red" || status === "En cours" || status === "Nouvelle") && "pulse-dot")} />
      {status}
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border border-primary/25 bg-brand text-[11px] font-semibold text-primary-foreground", className)}>{initials(name)}</span>;
}

export function SearchInput({ value, onChange, placeholder = "Rechercher…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative min-w-[220px] flex-1 md:max-w-xs">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 border-border bg-secondary/50 pl-9" />
      {value && <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Effacer"><X className="size-4" /></button>}
    </div>
  );
}

export function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-[150px] border-border bg-secondary/50 text-sm"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label} : tous</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}

/** Generic search + filters + sort over an array. */
export function useTable<T>(rows: T[], opts: { search: (r: T) => string; initialSort?: { key: string; dir: "asc" | "desc" }; sorters?: Record<string, (r: T) => number | string> }) {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(opts.initialSort ?? null);
  const [filterFns, setFilterFns] = useState<Record<string, (r: T, v: string) => boolean>>({});
  const result = useMemo(() => {
    let r = rows;
    if (q) { const nq = norm(q); r = r.filter((x) => norm(opts.search(x)).includes(nq)); }
    for (const [k, v] of Object.entries(filters)) if (v && v !== "all" && filterFns[k]) r = r.filter((x) => filterFns[k](x, v));
    if (sort && opts.sorters?.[sort.key]) {
      const f = opts.sorters[sort.key];
      r = [...r].sort((a, b) => { const va = f(a), vb = f(b); const c = va < vb ? -1 : va > vb ? 1 : 0; return sort.dir === "asc" ? c : -c; });
    }
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, filters, sort, filterFns]);
  const filter = (key: string, fn: (r: T, v: string) => boolean) => ({
    value: filters[key] ?? "all",
    onChange: (v: string) => { setFilterFns((f) => (f[key] ? f : { ...f, [key]: fn })); setFilters((f) => ({ ...f, [key]: v })); },
  });
  const sortProps = (key: string) => ({
    active: sort?.key === key ? sort.dir : null,
    onClick: () => setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" })),
  });
  return { rows: result, q, setQ, filter, sortProps, reset: () => { setQ(""); setFilters({}); } };
}

export function Th({ children, sort, className }: { children: ReactNode; sort?: { active: "asc" | "desc" | null; onClick: () => void }; className?: string }) {
  return (
    <th className={cn("whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground", className)}>
      {sort ? (
        <button onClick={sort.onClick} className="inline-flex items-center gap-1 hover:text-foreground">
          {children}
          {sort.active === "asc" ? <ArrowUp className="size-3 text-primary" /> : sort.active === "desc" ? <ArrowDown className="size-3 text-primary" /> : <ArrowUpDown className="size-3 opacity-40" />}
        </button>
      ) : children}
    </th>
  );
}

export function DataTable({ head, children, empty, count }: { head: ReactNode; children: ReactNode; empty?: boolean; count?: number }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40"><tr>{head}</tr></thead>
          <tbody className="divide-y divide-border [&>tr]:transition-colors [&>tr:hover]:bg-primary/[0.04]">{children}</tbody>
        </table>
      </div>
      {empty && <EmptyState />}
      {count !== undefined && <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">{count} résultat{count > 1 ? "s" : ""}</div>}
    </div>
  );
}
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cn("whitespace-nowrap px-3 py-3 text-foreground/90", className)}>{children}</td>;

export function EmptyState({ title = "Aucun résultat", text = "Modifiez vos filtres ou votre recherche." }: { title?: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl border border-border bg-secondary/50 text-muted-foreground"><Inbox className="size-5" /></div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{text}</div>
    </div>
  );
}

export function Confirm({ trigger, title, description, onConfirm, confirmLabel = "Confirmer", danger }: { trigger: ReactNode; title: string; description?: string; onConfirm: () => void; confirmLabel?: string; danger?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="glass border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={danger ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Controlled confirmation usable from dropdown menus. */
export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel = "Confirmer", danger }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; onConfirm: () => void; confirmLabel?: string; danger?: boolean }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={danger ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type MenuItem = { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; separator?: boolean; disabled?: boolean };
export function RowMenu({ items }: { items: MenuItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Actions"><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {items.map((it, i) => (
          <div key={i}>
            {it.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem disabled={it.disabled} onSelect={it.onClick} className={cn("gap-2 [&_svg]:size-4", it.danger && "text-destructive focus:text-destructive")}>{it.icon}{it.label}</DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <ol className="relative ml-2 border-l border-primary/20">
      {sorted.map((e, i) => (
        <li key={i} className="mb-4 ml-5 last:mb-0">
          <span className={cn("absolute -left-[5px] mt-1.5 size-2.5 rounded-full border border-primary/60", i === 0 ? "bg-primary shadow-glow" : "bg-background")} />
          <div className="text-sm text-foreground">{e.label}</div>
          <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{fDateTime(e.date)}</span>
            {e.channel && <span className="text-primary">· {e.channel}</span>}
            {e.by && <span>· {e.by}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export const chartTooltip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, color: "var(--foreground)" },
  labelStyle: { color: "var(--muted-foreground)" },
  cursor: { fill: "color-mix(in oklab, var(--primary) 8%, transparent)" },
};
export const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;
