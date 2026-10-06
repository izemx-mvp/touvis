import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BellRing, CheckCircle2, Clock, Eye, History, Pause, Play, Plus, Receipt, Settings2, Trash2, Wallet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Kpi, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge, RowMenu, Timeline, InfoRow, Panel } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, update, remindInvoice, markInvoicePaid, clientOf, log, uid, type ReminderStep } from "@/lib/store";
import { mad, fDate, daysTo, fDateTime } from "@/lib/format";
import { COMMERCIAUX, type Invoice } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/recouvrement")({
  head: () => ({ meta: [{ title: "Agent IA Recouvrement — TOUVIS AI" }, { name: "description", content: "Suivi des factures Sage et relances automatiques email / WhatsApp." }, { property: "og:title", content: "Agent IA Recouvrement — TOUVIS AI" }, { property: "og:description", content: "Factures, échéances et relances automatiques." }] }),
  component: Recouvrement,
});

const STATUSES = ["À venir", "Proche échéance", "Échue", "En retard", "Relancée", "Payée"];

function Recouvrement() {
  const s = useStore();
  const [detail, setDetail] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const t = useTable(s.invoices, {
    search: (i) => `${i.id} ${clientOf(s, i.clientId).company} ${clientOf(s, i.clientId).name}`,
    initialSort: { key: "due", dir: "asc" },
    sorters: { due: (i) => i.due, amount: (i) => i.amount, remaining: (i) => i.remaining, days: (i) => daysTo(i.due), date: (i) => i.date },
  });
  const unpaid = s.invoices.filter((i) => i.status !== "Payée");
  const overdue = s.invoices.filter((i) => ["Échue", "En retard"].includes(i.status));
  const togglePause = (i: Invoice) => { update((st) => { const x = st.invoices.find((y) => y.id === i.id)!; x.paused = !x.paused; x.history = [...x.history, { date: new Date().toISOString(), label: x.paused ? "Relances suspendues" : "Relances réactivées", by: st.currentUser.name }]; log(st, { agent: "Agent Recouvrement", module: "Recouvrement", action: `${x.paused ? "Suspension" : "Reprise"} relances ${x.id}` }); }); toast.success(i.paused ? "Relances réactivées" : "Relances suspendues"); };
  const inv = detail ? s.invoices.find((i) => i.id === detail) : null;

  return (
    <div>
      <PageHeader icon={<Wallet />} eyebrow="Agent IA" title="Recouvrement" subtitle="L'agent suit chaque échéance Sage et relance vos clients selon vos règles."
        actions={<Button variant="outline" className="bg-transparent" onClick={() => setRulesOpen(true)}><Settings2 />Modifier les règles</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Montant à recouvrer" value={unpaid.reduce((a, i) => a + i.remaining, 0)} format={mad} icon={<Wallet />} tone="amber" />
        <Kpi label="Factures impayées" value={unpaid.length} icon={<Receipt />} tone="blue" />
        <Kpi label="Échues / en retard" value={overdue.length} icon={<AlertTriangle />} tone="red" />
        <Kpi label="Payées" value={s.invoices.length - unpaid.length} icon={<CheckCircle2 />} tone="green" />
      </div>

      <Panel title="Règles de relance actives" className="mb-6" action={<Button size="sm" variant="ghost" onClick={() => setRulesOpen(true)}>Modifier</Button>}>
        <div className="flex flex-wrap items-center gap-2">
          {[...s.invoiceRules].sort((a, b) => a.day - b.day).map((r, i, arr) => (
            <div key={r.id} className="flex items-center gap-2">
              <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-sm"><span className="font-mono font-semibold text-primary">{r.day === 0 ? "J0" : r.day < 0 ? `J${r.day}` : `J+${r.day}`}</span> · {r.channel}</div>
              {i < arr.length - 1 && <span className="h-px w-6 bg-primary/40" />}
            </div>
          ))}
        </div>
      </Panel>

      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} placeholder="Facture, client, société…" />
        <FilterSelect label="Statut" options={STATUSES} {...t.filter("status", (i, v) => i.status === v)} />
        <FilterSelect label="Client" options={[...new Set(s.invoices.map((i) => clientOf(s, i.clientId).company))].sort()} {...t.filter("client", (i, v) => clientOf(s, i.clientId).company === v)} />
        <FilterSelect label="Période" options={["Ce mois", "Mois dernier", "Plus ancien", "À venir"]} {...t.filter("period", (i, v) => { const d = new Date(i.due); const m = d.getMonth(); return v === "Ce mois" ? m === 9 : v === "Mois dernier" ? m === 8 : v === "Plus ancien" ? m < 8 : m > 9; })} />
        <FilterSelect label="Montant" options={["< 50 000", "50 000 – 150 000", "> 150 000"]} {...t.filter("amount", (i, v) => v === "< 50 000" ? i.amount < 50000 : v === "> 150 000" ? i.amount > 150000 : i.amount >= 50000 && i.amount <= 150000)} />
        <FilterSelect label="Retard" options={["Sans retard", "1-10 jours", "> 10 jours"]} {...t.filter("late", (i, v) => { const d = -daysTo(i.due); return v === "Sans retard" ? d <= 0 : v === "1-10 jours" ? d > 0 && d <= 10 : d > 10; })} />
        <FilterSelect label="Canal" options={["Email", "WhatsApp"]} {...t.filter("channel", (i, v) => i.channel === v)} />
        <FilterSelect label="Commercial" options={COMMERCIAUX} {...t.filter("sales", (i, v) => clientOf(s, i.clientId).sales === v)} />
      </Toolbar>

      <DataTable count={t.rows.length} empty={!t.rows.length} head={<>
        <Th>N° facture</Th><Th>Client</Th><Th sort={t.sortProps("date")}>Date</Th><Th sort={t.sortProps("due")}>Échéance</Th>
        <Th sort={t.sortProps("amount")}>Montant TTC</Th><Th sort={t.sortProps("remaining")}>Restant</Th><Th sort={t.sortProps("days")}>Jours</Th>
        <Th>Statut</Th><Th>Dernière relance</Th><Th>Prochaine action</Th><Th className="text-right">Actions</Th>
      </>}>
        {t.rows.map((i) => {
          const c = clientOf(s, i.clientId); const d = daysTo(i.due);
          return (
            <tr key={i.id} className="cursor-pointer" onClick={() => setDetail(i.id)}>
              <Td className="font-mono text-xs text-primary">{i.id}</Td>
              <Td><div className="font-medium">{c.company}</div><div className="text-xs text-muted-foreground">{c.name}</div></Td>
              <Td>{fDate(i.date)}</Td><Td>{fDate(i.due)}</Td><Td className="tabular-nums">{mad(i.amount)}</Td>
              <Td className="font-medium tabular-nums">{mad(i.remaining)}</Td>
              <Td><span className={cn("font-mono text-xs", i.status === "Payée" ? "text-muted-foreground" : d < 0 ? "text-destructive" : d <= 5 ? "text-warning" : "text-muted-foreground")}>{d === 0 ? "J0" : d > 0 ? `J-${d}` : `J+${-d}`}</span></Td>
              <Td><div className="flex items-center gap-1.5"><StatusBadge status={i.status} />{i.paused && <Pause className="size-3.5 text-warning" />}</div></Td>
              <Td className="text-xs text-muted-foreground">{fDate(i.lastReminder)}</Td>
              <Td className="text-xs">{i.paused ? <span className="text-warning">Suspendue</span> : i.nextAction}</Td>
              <Td className="text-right" ><div onClick={(e) => e.stopPropagation()}>
                <RowMenu items={[
                  { label: "Voir détail", icon: <Eye />, onClick: () => setDetail(i.id) },
                  { label: "Relancer maintenant", icon: <BellRing />, onClick: () => remindInvoice(i.id), disabled: i.status === "Payée" },
                  { label: "Modifier les règles", icon: <Settings2 />, onClick: () => setRulesOpen(true) },
                  { label: i.paused ? "Réactiver les relances" : "Suspendre les relances", icon: i.paused ? <Play /> : <Pause />, onClick: () => togglePause(i), disabled: i.status === "Payée" },
                  { label: "Marquer comme payée", icon: <CheckCircle2 />, onClick: () => markInvoicePaid(i.id), disabled: i.status === "Payée" },
                  { label: "Voir historique", icon: <History />, onClick: () => setDetail(i.id), separator: true },
                ]} />
              </div></Td>
            </tr>
          );
        })}
      </DataTable>

      <Sheet open={!!inv} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="glass w-full overflow-y-auto sm:max-w-xl">
          {inv && (() => { const c = clientOf(s, inv.clientId); return (<>
            <SheetHeader><SheetTitle className="flex items-center gap-3"><span className="font-mono">{inv.id}</span><StatusBadge status={inv.status} /></SheetTitle></SheetHeader>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" disabled={inv.status === "Payée"} onClick={() => remindInvoice(inv.id)}><BellRing />Relancer maintenant</Button>
              <Button size="sm" variant="outline" className="bg-transparent" disabled={inv.status === "Payée"} onClick={() => markInvoicePaid(inv.id)}><CheckCircle2 />Marquer payée</Button>
              <Button size="sm" variant="ghost" disabled={inv.status === "Payée"} onClick={() => togglePause(inv)}>{inv.paused ? <><Play />Réactiver</> : <><Pause />Suspendre</>}</Button>
            </div>
            <Tabs defaultValue="info" className="mt-5">
              <TabsList className="w-full"><TabsTrigger value="info">Facture</TabsTrigger><TabsTrigger value="client">Client</TabsTrigger><TabsTrigger value="hist">Historique</TabsTrigger><TabsTrigger value="rule">Règle</TabsTrigger></TabsList>
              <TabsContent value="info" className="divide-y divide-border">
                <InfoRow label="Date facture" value={fDate(inv.date)} /><InfoRow label="Échéance" value={fDate(inv.due)} /><InfoRow label="Montant TTC" value={mad(inv.amount)} />
                <InfoRow label="Montant restant" value={<span className="text-primary">{mad(inv.remaining)}</span>} /><InfoRow label="Canal de relance" value={inv.channel} /><InfoRow label="Prochaine action" value={inv.paused ? "Suspendue" : inv.nextAction} />
              </TabsContent>
              <TabsContent value="client" className="divide-y divide-border">
                <InfoRow label="Société" value={c.company} /><InfoRow label="Contact" value={c.name} /><InfoRow label="Email" value={c.email} /><InfoRow label="Téléphone" value={c.phone} /><InfoRow label="Commercial" value={c.sales} /><InfoRow label="Statut Sage" value={<StatusBadge status={c.sage} />} />
              </TabsContent>
              <TabsContent value="hist" className="pt-3">
                <Timeline events={inv.history} />
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border p-3"><div className="text-xs text-muted-foreground">Emails envoyés</div><div className="font-display text-xl">{inv.history.filter((h) => h.channel === "Email").length}</div></div>
                  <div className="rounded-xl border border-border p-3"><div className="text-xs text-muted-foreground">WhatsApp envoyés</div><div className="font-display text-xl">{inv.history.filter((h) => h.channel === "WhatsApp").length}</div></div>
                </div>
              </TabsContent>
              <TabsContent value="rule" className="space-y-2 pt-3">
                {s.invoiceRules.map((r) => <div key={r.id} className="rounded-xl border border-border p-3 text-sm"><span className="font-mono text-primary">{r.day === 0 ? "J0" : r.day < 0 ? `J${r.day}` : `J+${r.day}`}</span> · {r.channel}<p className="mt-1 text-xs text-muted-foreground">{r.message.replace("{{nom}}", c.name).replace("{{facture}}", inv.id)}</p></div>)}
                <p className="text-xs text-muted-foreground">Dernière relance : {fDateTime(inv.lastReminder)}</p>
              </TabsContent>
            </Tabs>
          </>); })()}
        </SheetContent>
      </Sheet>

      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
}

function RulesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useStore();
  const [rules, setRules] = useState<ReminderStep[]>(s.invoiceRules);
  const set = (id: string, patch: Partial<ReminderStep>) => setRules((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setRules(s.invoiceRules); onOpenChange(o); }}>
      <DialogContent className="glass max-w-2xl">
        <DialogHeader><DialogTitle>Règles de relance</DialogTitle><DialogDescription>Définissez quand et comment l'agent relance vos clients (J- avant échéance, J+ après).</DialogDescription></DialogHeader>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {rules.map((r) => (
            <div key={r.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[90px_130px_1fr_auto]">
              <Input type="number" value={r.day} onChange={(e) => set(r.id, { day: Number(e.target.value) })} aria-label="Jour" />
              <Select value={r.channel} onValueChange={(v) => set(r.id, { channel: v as ReminderStep["channel"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Email">Email</SelectItem><SelectItem value="WhatsApp">WhatsApp</SelectItem></SelectContent></Select>
              <Textarea rows={1} value={r.message} onChange={(e) => set(r.id, { message: e.target.value })} className="min-h-9" />
              <Button variant="ghost" size="icon" onClick={() => setRules((x) => x.filter((y) => y.id !== r.id))} aria-label="Supprimer"><Trash2 /></Button>
            </div>
          ))}
          <Button variant="outline" className="w-full border-dashed bg-transparent" onClick={() => setRules((r) => [...r, { id: uid("r"), day: 14, channel: "Email", message: "Bonjour {{nom}}, dernier rappel pour la facture {{facture}}." }])}><Plus />Ajouter une étape</Button>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={() => { update((st) => { st.invoiceRules = rules; log(st, { agent: "Agent Recouvrement", module: "Recouvrement", action: "Règles de relance modifiées" }); }); onOpenChange(false); toast.success("Règles enregistrées"); }}><Clock />Enregistrer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
