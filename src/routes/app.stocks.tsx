import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BellRing, Boxes, CheckCircle2, Eye, History, MessageCircle, PackageX, Pencil, Smartphone, Package } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { PageHeader, Kpi, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge, RowMenu, InfoRow, Panel, axis, chartTooltip } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useStore, update, stockStatus, log, notify, uid, nowIso } from "@/lib/store";
import { CATEGORIES, type Product } from "@/lib/mock";
import { fDate, fDateTime } from "@/lib/format";

export const Route = createFileRoute("/app/stocks")({
  head: () => ({ meta: [{ title: "Agent IA Stock — TOUVIS AI" }, { name: "description", content: "Surveillance des seuils de stock Sage et alertes automatiques." }, { property: "og:title", content: "Agent IA Stock — TOUVIS AI" }, { property: "og:description", content: "Stocks, seuils et alertes en temps réel." }] }),
  component: Stocks,
});

function triggerAlert(p: Product) {
  update((s) => {
    const st = stockStatus(p);
    s.stockAlerts = [{ id: uid("AL"), productId: p.id, date: nowIso(), type: st === "Normal" ? "Stock faible" : (st as "Rupture"), channels: ["Application", "WhatsApp"], treated: false }, ...s.stockAlerts];
    s.products = s.products.map((x) => (x.id === p.id ? { ...x, lastAlert: nowIso(), treated: false } : x));
    notify(s, { category: "Stock", title: st === "Rupture" ? "Rupture de stock" : "Produit sous seuil", body: `${p.ref} ${p.name} — ${p.stock} unités`, link: "/app/stocks" });
    log(s, { agent: "Agent Stock", module: "Stocks", action: `Alerte déclenchée ${p.ref}` });
  });
  toast.warning(`Alerte stock — ${p.ref}`, { description: "Notification application envoyée", icon: <BellRing className="size-4" /> });
  setTimeout(() => toast(`WhatsApp envoyé à Othmane Kabbaj`, { description: `⚠️ ${p.ref} ${p.name} : ${p.stock}/${p.threshold} unités`, icon: <MessageCircle className="size-4" /> }), 700);
}

function Stocks() {
  const s = useStore();
  const [detail, setDetail] = useState<string | null>(null);
  const [edit, setEdit] = useState<Product | null>(null);
  const [val, setVal] = useState(0);
  const t = useTable(s.products, {
    search: (p) => `${p.ref} ${p.name} ${p.serial} ${p.category}`,
    sorters: { ref: (p) => p.ref, stock: (p) => p.stock, threshold: (p) => p.threshold, ratio: (p) => p.stock / p.threshold },
    initialSort: { key: "ratio", dir: "asc" },
  });
  const p = detail ? s.products.find((x) => x.id === detail)! : null;
  const markTreated = (id: string) => { update((st) => { st.products = st.products.map((x) => (x.id === id ? { ...x, treated: true } : x)); st.stockAlerts = st.stockAlerts.map((a) => (a.productId === id ? { ...a, treated: true } : a)); log(st, { agent: "Agent Stock", module: "Stocks", action: `Alerte traitée ${st.products.find((x) => x.id === id)!.ref}` }); }); toast.success("Alerte marquée comme traitée"); };
  const count = (st: string) => s.products.filter((x) => stockStatus(x) === st).length;

  return (
    <div>
      <PageHeader icon={<Boxes />} eyebrow="Agent IA" title="Stocks" subtitle="L'agent surveille les niveaux de stock Sage et alerte l'équipe dès qu'un seuil est atteint." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Normal" value={count("Normal")} icon={<CheckCircle2 />} tone="green" />
        <Kpi label="Stock faible" value={count("Stock faible")} icon={<Package />} tone="amber" />
        <Kpi label="Seuil atteint" value={count("Seuil atteint")} icon={<AlertTriangle />} tone="amber" />
        <Kpi label="Rupture" value={count("Rupture")} icon={<PackageX />} tone="red" />
      </div>
      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} placeholder="Référence, produit, n° de série…" />
        <FilterSelect label="Statut" options={["Normal", "Stock faible", "Seuil atteint", "Rupture"]} {...t.filter("st", (x, v) => stockStatus(x) === v)} />
        <FilterSelect label="Catégorie" options={CATEGORIES} {...t.filter("cat", (x, v) => x.category === v)} />
      </Toolbar>
      <DataTable count={t.rows.length} empty={!t.rows.length} head={<>
        <Th sort={t.sortProps("ref")}>Référence</Th><Th>Produit</Th><Th>Catégorie</Th><Th>N° série</Th><Th sort={t.sortProps("stock")}>Stock actuel</Th>
        <Th sort={t.sortProps("threshold")}>Seuil min.</Th><Th sort={t.sortProps("ratio")}>Statut</Th><Th>Dernière alerte</Th><Th className="text-right">Actions</Th>
      </>}>
        {t.rows.map((x) => {
          const st = stockStatus(x); const pct = Math.min(100, (x.stock / (x.threshold * 2)) * 100);
          return (
            <tr key={x.id} className="cursor-pointer" onClick={() => setDetail(x.id)}>
              <Td className="font-mono text-xs text-primary">{x.ref}</Td><Td className="max-w-[260px] truncate font-medium">{x.name}</Td><Td className="text-muted-foreground">{x.category}</Td>
              <Td className="font-mono text-xs text-muted-foreground">{x.serial}</Td>
              <Td><div className="flex items-center gap-2"><span className="w-10 tabular-nums">{x.stock}</span><div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${st === "Normal" ? "bg-success" : st === "Rupture" ? "bg-destructive" : "bg-warning"}`} style={{ width: `${pct}%` }} /></div></div></Td>
              <Td className="tabular-nums">{x.threshold}</Td>
              <Td><div className="flex items-center gap-1.5"><StatusBadge status={st} />{x.treated && <CheckCircle2 className="size-3.5 text-success" />}</div></Td>
              <Td className="text-xs text-muted-foreground">{fDate(x.lastAlert)}</Td>
              <Td className="text-right"><div onClick={(e) => e.stopPropagation()}><RowMenu items={[
                { label: "Voir", icon: <Eye />, onClick: () => setDetail(x.id) },
                { label: "Modifier seuil", icon: <Pencil />, onClick: () => { setEdit(x); setVal(x.threshold); } },
                { label: "Déclencher alerte", icon: <BellRing />, onClick: () => triggerAlert(x) },
                { label: "Voir historique", icon: <History />, onClick: () => setDetail(x.id) },
                { label: "Marquer comme traité", icon: <CheckCircle2 />, onClick: () => markTreated(x.id), separator: true },
              ]} /></div></Td>
            </tr>
          );
        })}
      </DataTable>

      <Sheet open={!!p} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="glass w-full overflow-y-auto sm:max-w-xl">
          {p && <>
            <SheetHeader><SheetTitle>{p.name}</SheetTitle></SheetHeader>
            <div className="mt-4 flex gap-4">
              <div className="grid size-28 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-[radial-gradient(circle_at_30%_20%,var(--accent),transparent)] text-primary"><Package className="size-10" /></div>
              <div className="flex-1 text-sm"><div className="font-mono text-primary">{p.ref}</div><div className="mt-1 text-muted-foreground">{p.category} · {p.serial}</div><div className="mt-3"><StatusBadge status={stockStatus(p)} /></div></div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[["Disponible", p.stock], ["Réservé", p.reserved], ["Seuil min.", p.threshold]].map(([l, v]) => <div key={l} className="rounded-xl border border-border p-3"><div className="text-[11px] text-muted-foreground">{l}</div><div className="font-display text-xl">{v}</div></div>)}
            </div>
            <div className="mt-2 divide-y divide-border"><InfoRow label="Dernière entrée" value={fDate(p.lastIn)} /><InfoRow label="Dernière sortie" value={fDate(p.lastOut)} /></div>
            <Panel title="Évolution du stock (12 semaines)" className="mt-4" bodyClass="p-3">
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={p.history.map((v, i) => ({ w: `S${i + 30}`, v }))}>
                  <defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="w" {...axis} /><YAxis {...axis} /><Tooltip {...chartTooltip} />
                  <ReferenceLine y={p.threshold} stroke="var(--warning)" strokeDasharray="4 4" />
                  <Area dataKey="v" name="Stock" stroke="var(--chart-1)" fill="url(#gs)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
            <h4 className="mb-2 mt-5 text-sm font-semibold">Historique des alertes</h4>
            <div className="space-y-2">
              {s.stockAlerts.filter((a) => a.productId === p.id).map((a) => <div key={a.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"><div><StatusBadge status={a.type} /><span className="ml-2 text-xs text-muted-foreground">{fDateTime(a.date)}</span></div><div className="flex items-center gap-1 text-xs text-muted-foreground"><Smartphone className="size-3.5" />{a.channels.join(" + ")}{a.treated && <CheckCircle2 className="ml-1 size-3.5 text-success" />}</div></div>)}
              {!s.stockAlerts.some((a) => a.productId === p.id) && <p className="text-xs text-muted-foreground">Aucune alerte pour ce produit.</p>}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => { setEdit(p); setVal(p.threshold); }}><Pencil />Modifier seuil</Button>
              <Button size="sm" variant="outline" className="bg-transparent" onClick={() => triggerAlert(p)}><BellRing />Déclencher alerte</Button>
              <Button size="sm" variant="ghost" onClick={() => markTreated(p.id)}><CheckCircle2 />Marquer traité</Button>
            </div>
          </>}
        </SheetContent>
      </Sheet>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle>Modifier le seuil minimum</DialogTitle><DialogDescription>{edit?.ref} — {edit?.name} (stock actuel : {edit?.stock})</DialogDescription></DialogHeader>
          <Input type="number" min={0} value={val} onChange={(e) => setVal(Number(e.target.value))} />
          {edit && <div className="text-sm text-muted-foreground">Nouveau statut : <StatusBadge status={stockStatus({ stock: edit.stock, threshold: val })} /></div>}
          <DialogFooter><Button variant="ghost" onClick={() => setEdit(null)}>Annuler</Button><Button onClick={() => { const e = edit!; update((st) => { st.products = st.products.map((x) => (x.id === e.id ? { ...x, threshold: val } : x)); log(st, { agent: "Agent Stock", module: "Stocks", action: `Seuil ${e.ref} : ${e.threshold} → ${val}` }); }); setEdit(null); toast.success("Seuil mis à jour"); }}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
