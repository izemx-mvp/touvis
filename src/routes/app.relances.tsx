import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellRing, History, Mail, MessageCircle, Pause, Play, Plus, Repeat, Save, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge, RowMenu, Panel, Timeline } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore, update, clientOf, quoteTotals, relaunchQuote, log, uid, FOLLOWUP_STOP, type ReminderStep } from "@/lib/store";
import { fDate, mad, daysTo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/relances")({
  head: () => ({ meta: [{ title: "Agent IA Relance Devis — TOUVIS AI" }, { name: "description", content: "Relances automatiques des devis sans réponse." }, { property: "og:title", content: "Relance devis — TOUVIS AI" }, { property: "og:description", content: "Séquences de relance multicanal." }] }),
  component: Relances,
});

function Relances() {
  const s = useStore();
  const nav = useNavigate();
  const [seq, setSeq] = useState<ReminderStep[]>(s.quoteSequence);
  const [hist, setHist] = useState<string | null>(null);
  const followed = s.quotes.filter((q) => !q.archived && !FOLLOWUP_STOP.includes(q.status) && q.sentDate);
  const t = useTable(followed, { search: (q) => `${q.id} ${clientOf(s, q.clientId).company}`, sorters: { days: (q) => -daysTo(q.sentDate!), amount: (q) => quoteTotals(q.lines).ttc }, initialSort: { key: "days", dir: "desc" } });
  const set = (id: string, p: Partial<ReminderStep>) => setSeq((x) => x.map((y) => (y.id === id ? { ...y, ...p } : y)));
  const hq = hist ? s.quotes.find((q) => q.id === hist) : null;
  return (
    <div>
      <PageHeader icon={<Repeat />} eyebrow="Agent IA" title="Relance devis" subtitle="Seuls les devis nécessitant un suivi apparaissent ici. Les relances s'arrêtent automatiquement dès qu'un devis est accepté, refusé, expiré ou transformé en commande." />

      <Panel title="Séquence de relance" className="mb-6" action={<Button size="sm" onClick={() => { update((st) => { st.quoteSequence = [...seq].sort((a, b) => a.day - b.day); log(st, { agent: "Agent Relance Devis", module: "Relance devis", action: "Séquence modifiée" }); }); toast.success("Séquence enregistrée"); }}><Save />Enregistrer</Button>}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <div className="grid w-32 shrink-0 place-items-center rounded-xl border border-border bg-secondary/30 p-3 text-center text-xs text-muted-foreground"><Mail className="mb-1 size-5 text-primary" />Devis envoyé<br />J0</div>
          {seq.map((st, i) => (
            <div key={st.id} className="flex shrink-0 items-center gap-3">
              <span className="h-px w-6 bg-gradient-to-r from-primary/60 to-primary/10" />
              <div className="glass w-64 space-y-2 rounded-xl p-3">
                <div className="flex items-center justify-between"><span className="font-mono text-xs text-primary">Étape {i + 1}</span><Button variant="ghost" size="icon" className="size-7" aria-label="Supprimer l'étape" onClick={() => setSeq((x) => x.filter((y) => y.id !== st.id))}><Trash2 /></Button></div>
                <div className="flex gap-2">
                  <div className="relative w-24"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">J+</span><Input type="number" min={1} value={st.day} onChange={(e) => set(st.id, { day: Number(e.target.value) })} className="h-8 pl-7" /></div>
                  <Select value={st.channel} onValueChange={(v) => set(st.id, { channel: v as ReminderStep["channel"] })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Email">Email</SelectItem><SelectItem value="WhatsApp">WhatsApp</SelectItem></SelectContent></Select>
                </div>
                <Textarea rows={3} value={st.message} onChange={(e) => set(st.id, { message: e.target.value })} className="text-xs" />
              </div>
            </div>
          ))}
          <button onClick={() => setSeq((x) => [...x, { id: uid("s"), day: (x[x.length - 1]?.day ?? 0) + 4, channel: "Email", message: "Bonjour {{nom}}, notre devis {{devis}} expire bientôt." }])} className="ml-3 grid w-32 shrink-0 place-items-center rounded-xl border border-dashed border-primary/30 text-xs text-primary hover:bg-primary/5"><Plus className="mb-1 size-5" />Ajouter étape</button>
        </div>
      </Panel>

      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} />
        <FilterSelect label="Statut" options={["Envoyé", "À relancer", "Relancé"]} {...t.filter("st", (q, v) => q.status === v)} />
      </Toolbar>
      <DataTable count={t.rows.length} empty={!t.rows.length} head={<><Th>N° devis</Th><Th>Client</Th><Th sort={t.sortProps("amount")}>Montant</Th><Th>Date envoi</Th><Th sort={t.sortProps("days")}>Jours sans réponse</Th><Th>Dernière relance</Th><Th>Prochaine relance</Th><Th>Statut</Th><Th className="text-right">Actions</Th></>}>
        {t.rows.map((q) => { const d = -daysTo(q.sentDate!); return (
          <tr key={q.id}>
            <Td className="font-mono text-xs text-primary">{q.id}</Td><Td className="font-medium">{clientOf(s, q.clientId).company}</Td><Td className="tabular-nums">{mad(quoteTotals(q.lines).ttc)}</Td><Td>{fDate(q.sentDate)}</Td>
            <Td><span className={cn("font-mono", d > 10 ? "text-destructive" : d > 5 ? "text-warning" : "")}>{d} j</span></Td><Td className="text-xs text-muted-foreground">{fDate(q.lastReminder)}</Td>
            <Td className="text-xs">{q.paused ? <span className="text-warning">Suspendue</span> : fDate(q.nextReminder)}</Td><Td><StatusBadge status={q.status} /></Td>
            <Td className="text-right"><RowMenu items={[
              { label: "Relancer maintenant (Email)", icon: <Mail />, onClick: () => relaunchQuote(q.id, "Email") },
              { label: "Relancer par WhatsApp", icon: <MessageCircle />, onClick: () => relaunchQuote(q.id, "WhatsApp") },
              { label: "Modifier séquence", icon: <Settings2 />, onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
              { label: q.paused ? "Reprendre" : "Suspendre", icon: q.paused ? <Play /> : <Pause />, onClick: () => { update((st) => { st.quotes = st.quotes.map((x) => (x.id === q.id ? { ...x, paused: !x.paused } : x)); }); toast.success(q.paused ? "Relances reprises" : "Relances suspendues"); } },
              { label: "Voir historique", icon: <History />, onClick: () => setHist(q.id) },
              { label: "Ouvrir le devis", icon: <BellRing />, onClick: () => nav({ to: "/app/devis/$id", params: { id: q.id } }), separator: true },
            ]} /></Td>
          </tr>
        ); })}
      </DataTable>
      <Sheet open={!!hq} onOpenChange={(o) => !o && setHist(null)}>
        <SheetContent className="glass sm:max-w-md"><SheetHeader><SheetTitle>Historique {hq?.id}</SheetTitle></SheetHeader><div className="mt-6">{hq && <Timeline events={hq.history} />}</div></SheetContent>
      </Sheet>
    </div>
  );
}
