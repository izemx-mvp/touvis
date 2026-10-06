import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, Copy, Eye, Megaphone, MessageSquareReply, Pause, Pencil, Play, Plus, RotateCcw, Star, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Kpi, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge, RowMenu, ConfirmDialog } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { useStore, update, log, uid } from "@/lib/store";
import type { Campaign } from "@/lib/mock";
import { fDate } from "@/lib/format";

export const Route = createFileRoute("/app/campagnes/")({
  head: () => ({ meta: [{ title: "Agent IA Campagnes — TOUVIS AI" }, { name: "description", content: "Campagnes email et WhatsApp ciblées et rédigées par l'IA." }, { property: "og:title", content: "Campagnes — TOUVIS AI" }, { property: "og:description", content: "Créez et pilotez vos campagnes." }] }),
  component: Campagnes,
});

function Campagnes() {
  const s = useStore();
  const nav = useNavigate();
  const [del, setDel] = useState<Campaign | null>(null);
  const t = useTable(s.campaigns, { search: (c) => `${c.name} ${c.segment}`, sorters: { date: (c) => c.date, contacts: (c) => c.contacts }, initialSort: { key: "date", dir: "desc" } });
  const setStatus = (c: Campaign, status: Campaign["status"], msg: string) => { update((st) => { st.campaigns = st.campaigns.map((x) => (x.id === c.id ? { ...x, status, sent: status === "En cours" && !x.sent ? Math.round(x.contacts * 0.3) : x.sent } : x)); log(st, { agent: "Agent Campagnes", module: "Campagnes", action: `${c.name} : ${status}` }); }); toast.success(msg); };
  const open = (id: string) => nav({ to: "/app/campagnes/$id", params: { id } });
  return (
    <div>
      <PageHeader icon={<Megaphone />} eyebrow="Agent IA" title="Campagnes" subtitle="Ciblez vos clients Sage, laissez l'IA rédiger, et suivez les réponses en temps réel." actions={<Button className="bg-brand shadow-glow" onClick={() => nav({ to: "/app/campagnes/nouvelle" })}><Plus />Nouvelle campagne</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Actives" value={s.campaigns.filter((c) => c.status === "En cours").length} icon={<Play />} tone="blue" />
        <Kpi label="Planifiées" value={s.campaigns.filter((c) => c.status === "Planifiée").length} icon={<CalendarClock />} tone="amber" />
        <Kpi label="Terminées" value={s.campaigns.filter((c) => c.status === "Terminée").length} icon={<CheckCircle2 />} tone="green" />
        <Kpi label="Contacts ciblés" value={s.campaigns.reduce((a, c) => a + c.contacts, 0)} icon={<Users />} />
        <Kpi label="Réponses" value={s.campaigns.reduce((a, c) => a + c.replies, 0)} icon={<MessageSquareReply />} tone="blue" />
        <Kpi label="Clients intéressés" value={s.campaigns.reduce((a, c) => a + c.interested, 0)} icon={<Star />} tone="green" />
      </div>
      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} />
        <FilterSelect label="Statut" options={["Brouillon", "Planifiée", "En cours", "Terminée", "Suspendue"]} {...t.filter("st", (c, v) => c.status === v)} />
        <FilterSelect label="Canal" options={["Email", "WhatsApp"]} {...t.filter("ch", (c, v) => c.channel === v)} />
      </Toolbar>
      <DataTable count={t.rows.length} empty={!t.rows.length} head={<><Th>Campagne</Th><Th>Objectif</Th><Th>Segment</Th><Th>Canal</Th><Th sort={t.sortProps("contacts")}>Contacts</Th><Th sort={t.sortProps("date")}>Date</Th><Th>Statut</Th><Th>Résultats</Th><Th className="text-right">Actions</Th></>}>
        {t.rows.map((c) => (
          <tr key={c.id} className="cursor-pointer" onClick={() => open(c.id)}>
            <Td className="font-medium">{c.name}</Td><Td>{c.objective}</Td><Td className="text-muted-foreground">{c.segment}</Td><Td>{c.channel}</Td><Td className="tabular-nums">{c.contacts}</Td><Td>{fDate(c.date)}</Td><Td><StatusBadge status={c.status} /></Td>
            <Td>{c.sent ? <div className="w-32"><div className="flex justify-between text-[11px] text-muted-foreground"><span>{c.replies} rép.</span><span className="text-success">{c.interested} int.</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-brand" style={{ width: `${(c.replies / Math.max(1, c.delivered)) * 100 * 2.5}%` }} /></div></div> : <span className="text-xs text-muted-foreground">—</span>}</Td>
            <Td className="text-right"><div onClick={(e) => e.stopPropagation()}><RowMenu items={[
              { label: "Voir", icon: <Eye />, onClick: () => open(c.id) },
              { label: "Modifier", icon: <Pencil />, onClick: () => nav({ to: "/app/campagnes/nouvelle" }) },
              { label: "Dupliquer", icon: <Copy />, onClick: () => { update((st) => { st.campaigns = [{ ...c, id: uid("CP"), name: `${c.name} (copie)`, status: "Brouillon", sent: 0, delivered: 0, replies: 0, interested: 0, errors: 0 }, ...st.campaigns]; }); toast.success("Campagne dupliquée"); } },
              c.status === "En cours" ? { label: "Suspendre", icon: <Pause />, onClick: () => setStatus(c, "Suspendue", "Campagne suspendue") } : { label: c.status === "Terminée" ? "Relancer" : "Lancer / reprendre", icon: <RotateCcw />, onClick: () => setStatus(c, "En cours", "Campagne lancée") },
              { label: "Supprimer", icon: <Trash2 />, onClick: () => setDel(c), danger: true, separator: true },
            ]} /></div></Td>
          </tr>
        ))}
      </DataTable>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger title="Supprimer la campagne ?" description={del?.name} confirmLabel="Supprimer" onConfirm={() => { update((st) => { st.campaigns = st.campaigns.filter((x) => x.id !== del!.id); }); toast.success("Campagne supprimée"); setDel(null); }} />
    </div>
  );
}
