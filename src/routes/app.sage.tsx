import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Boxes, CheckCircle2, CreditCard, Database, FileText, Loader2, Package, Receipt, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, DataTable, Th, Td, StatusBadge, AnimatedNumber } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStore, runSageSync } from "@/lib/store";
import { fDateTime, fTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/sage")({
  head: () => ({ meta: [{ title: "Intégration Sage — TOUVIS AI" }, { name: "description", content: "Synchronisation des clients, produits, stocks, factures et devis avec Sage." }, { property: "og:title", content: "Intégration Sage — TOUVIS AI" }, { property: "og:description", content: "Connexion Sage et historique de synchronisation." }] }),
  component: Sage,
});

const SECTIONS = ["Clients", "Produits", "Stock", "Factures", "Paiements", "Devis"];

function Sage() {
  const s = useStore();
  const [p, setP] = useState(-1);
  const sync = () => {
    let v = 0; setP(0);
    const iv = setInterval(() => { v += 100 / 12; setP(Math.min(100, v)); if (v >= 100) { clearInterval(iv); runSageSync(); setTimeout(() => setP(-1), 600); toast.success("Synchronisation Sage réussie", { description: "Toutes les données sont à jour." }); } }, 220);
  };
  const next = new Date(new Date(s.sage.lastSync).getTime() + 15 * 60000).toISOString();
  const counts = [["Clients synchronisés", s.clients.length, Users], ["Produits", s.products.length, Package], ["Factures", s.invoices.length, Receipt], ["Paiements", s.invoices.filter((i) => i.status === "Payée").length, CreditCard], ["Devis", s.quotes.length, FileText], ["Articles en stock", s.products.reduce((a, x) => a + x.stock, 0), Boxes]] as const;
  const running = p >= 0;
  return (
    <div>
      <PageHeader icon={<Database />} eyebrow="Administration" title="Intégration Sage" subtitle="Vos agents IA lisent et écrivent dans Sage en continu." />
      <div className="glass relative mb-6 overflow-hidden rounded-2xl p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-success/10 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl border border-success/30 bg-success/10 text-success"><Database className="size-7" /></div>
            <div><div className="flex items-center gap-2 font-display text-xl font-semibold">Sage connecté <span className="size-2.5 rounded-full bg-success pulse-dot text-success" /></div><div className="text-sm text-muted-foreground">Sage 100cloud · Base TOUVIS_PROD · Fréquence {s.sage.frequency}</div></div>
          </div>
          <Button className="bg-brand shadow-glow" disabled={running} onClick={sync}>{running ? <Loader2 className="animate-spin" /> : <RefreshCw />}Synchroniser maintenant</Button>
        </div>
        {running && <div className="mt-5"><Progress value={p} className="h-1.5" /><div className="mt-2 flex flex-wrap gap-3 text-xs">{SECTIONS.map((x, i) => { const done = p >= ((i + 1) / SECTIONS.length) * 100; return <span key={x} className={cn("flex items-center gap-1", done ? "text-success" : p >= (i / SECTIONS.length) * 100 ? "text-primary" : "text-muted-foreground")}>{done ? <CheckCircle2 className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}{x}</span>; })}</div></div>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3"><div className="text-xs text-muted-foreground">Dernière synchronisation</div><div className="font-medium">{fDateTime(s.sage.lastSync)}</div></div>
          <div className="rounded-xl border border-border p-3"><div className="text-xs text-muted-foreground">Prochaine synchronisation</div><div className="font-medium">{fTime(next)}</div></div>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {counts.map(([l, v, I]) => <div key={l} className="glass rounded-2xl p-4"><I className="size-4 text-primary" /><div className="mt-2 font-display text-2xl font-semibold"><AnimatedNumber value={v} /></div><div className="text-xs text-muted-foreground">{l}</div></div>)}
      </div>
      <Panel title="Sections synchronisées" className="mb-6"><div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{SECTIONS.map((x) => <div key={x} className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-3 py-2.5 text-sm"><CheckCircle2 className="size-4 text-success" />{x}</div>)}</div></Panel>
      <h3 className="mb-3 text-sm font-semibold">Historique des synchronisations</h3>
      <DataTable count={s.syncRuns.length} head={<><Th>Date</Th><Th>Durée</Th><Th>Enregistrements</Th><Th>Résultat</Th></>}>
        {s.syncRuns.map((r) => <tr key={r.id} className="page-enter"><Td>{fDateTime(r.date)}</Td><Td>{r.duration}</Td><Td className="tabular-nums">{r.records.toLocaleString("fr-FR")}</Td><Td><StatusBadge status={r.result} /></Td></tr>)}
      </DataTable>
    </div>
  );
}
