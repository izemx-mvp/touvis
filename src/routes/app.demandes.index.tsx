import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, FileInput, Sparkles, UserRound, Wand2, AlertTriangle, Inbox, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge, RowMenu, Kpi } from "@/components/touvis/kit";
import { useStore, update, clientOf, log } from "@/lib/store";
import { COMMERCIAUX } from "@/lib/mock";
import { fDate } from "@/lib/format";

export const Route = createFileRoute("/app/demandes/")({
  head: () => ({ meta: [{ title: "Demandes de devis — TOUVIS AI" }, { name: "description", content: "Demandes reçues par email analysées automatiquement par l'IA." }, { property: "og:title", content: "Demandes de devis — TOUVIS AI" }, { property: "og:description", content: "Analyse IA des demandes de devis." }] }),
  component: Demandes,
});

const ANALYSIS = ["Nouvelle", "Analyse IA", "Informations manquantes", "En préparation", "À valider", "Devis envoyé", "Accepté", "Refusé"];

function Demandes() {
  const s = useStore();
  const nav = useNavigate();
  const t = useTable(s.quoteRequests, { search: (r) => `${r.id} ${r.subject} ${clientOf(s, r.clientId).company} ${clientOf(s, r.clientId).name}`, sorters: { date: (r) => r.date, id: (r) => r.id }, initialSort: { key: "date", dir: "desc" } });
  const assign = (id: string, who: string) => { update((st) => { st.quoteRequests = st.quoteRequests.map((r) => (r.id === id ? { ...r, owner: who } : r)); log(st, { module: "Devis", action: `Demande ${id} assignée à ${who}` }); }); toast.success(`Assignée à ${who}`); };
  return (
    <div>
      <PageHeader icon={<FileInput />} eyebrow="Agent IA Devis" title="Demandes de devis" subtitle="Chaque email reçu est lu par l'IA : client, produits, quantités et délais sont extraits automatiquement." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Demandes reçues" value={s.quoteRequests.length} icon={<Inbox />} />
        <Kpi label="Nouvelles" value={s.quoteRequests.filter((r) => ["Nouvelle", "Analyse IA"].includes(r.analysis)).length} icon={<Sparkles />} tone="blue" />
        <Kpi label="Infos manquantes" value={s.quoteRequests.filter((r) => r.analysis === "Informations manquantes").length} icon={<AlertTriangle />} tone="amber" />
        <Kpi label="Converties en devis" value={s.quoteRequests.filter((r) => r.quoteId).length} icon={<CheckCircle2 />} tone="green" />
      </div>
      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} placeholder="N°, client, objet…" />
        <FilterSelect label="Analyse" options={ANALYSIS} {...t.filter("a", (r, v) => r.analysis === v)} />
        <FilterSelect label="Responsable" options={COMMERCIAUX} {...t.filter("o", (r, v) => r.owner === v)} />
      </Toolbar>
      <DataTable count={t.rows.length} empty={!t.rows.length} head={<><Th sort={t.sortProps("id")}>N° demande</Th><Th>Client</Th><Th>Objet email</Th><Th sort={t.sortProps("date")}>Date</Th><Th>Produits détectés</Th><Th>Statut analyse</Th><Th>Statut devis</Th><Th>Responsable</Th><Th className="text-right">Actions</Th></>}>
        {t.rows.map((r) => { const c = clientOf(s, r.clientId); return (
          <tr key={r.id} className="cursor-pointer" onClick={() => nav({ to: "/app/demandes/$id", params: { id: r.id } })}>
            <Td className="font-mono text-xs text-primary">{r.id}</Td><Td><div className="font-medium">{c.company}</div><div className="text-xs text-muted-foreground">{c.name}</div></Td>
            <Td className="max-w-[240px] truncate">{r.subject}</Td><Td>{fDate(r.date)}</Td>
            <Td><span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs text-primary">{r.lines.length} produits</span></Td>
            <Td><StatusBadge status={r.analysis} /></Td><Td>{r.quoteStatus === "—" ? <span className="text-muted-foreground">—</span> : <StatusBadge status={r.quoteStatus} />}</Td><Td className="text-sm">{r.owner}</Td>
            <Td className="text-right"><div onClick={(e) => e.stopPropagation()}><RowMenu items={[
              { label: "Voir l'analyse IA", icon: <Eye />, onClick: () => nav({ to: "/app/demandes/$id", params: { id: r.id } }) },
              { label: "Générer le devis", icon: <Wand2 />, onClick: () => nav({ to: "/app/demandes/$id", params: { id: r.id } }) },
              ...COMMERCIAUX.filter((x) => x !== r.owner).map((x, i) => ({ label: `Assigner à ${x}`, icon: <UserRound />, onClick: () => assign(r.id, x), separator: i === 0 })),
            ]} /></div></Td>
          </tr>
        ); })}
      </DataTable>
    </div>
  );
}
