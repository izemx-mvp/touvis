import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Archive, BellRing, CheckCircle2, Copy, Download, Eye, FileText, Pencil, Plus, Send, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge, RowMenu, Kpi } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { useStore, update, clientOf, quoteTotals, setQuoteStatus, relaunchQuote } from "@/lib/store";
import { COMMERCIAUX } from "@/lib/mock";
import { fDate, mad } from "@/lib/format";
import { Q_STATUSES, duplicateQuote, pdfMock } from "@/lib/quotes";

export const Route = createFileRoute("/app/devis/")({
  head: () => ({ meta: [{ title: "Devis — TOUVIS AI" }, { name: "description", content: "Tous les devis générés et suivis par les agents IA." }, { property: "og:title", content: "Devis — TOUVIS AI" }, { property: "og:description", content: "Suivi complet des devis." }] }),
  component: DevisList,
});

function DevisList() {
  const s = useStore();
  const nav = useNavigate();
  const rows = s.quotes.filter((q) => !q.archived);
  const t = useTable(rows, { search: (q) => `${q.id} ${clientOf(s, q.clientId).company}`, sorters: { date: (q) => q.date, amount: (q) => quoteTotals(q.lines).ttc, id: (q) => q.id }, initialSort: { key: "date", dir: "desc" } });
  const open = (id: string) => nav({ to: "/app/devis/$id", params: { id } });
  const total = rows.reduce((a, q) => a + quoteTotals(q.lines).ttc, 0);
  return (
    <div>
      <PageHeader icon={<FileText />} eyebrow="Agent IA Devis" title="Devis" subtitle="Créez, validez, envoyez et suivez vos devis." actions={<Button onClick={() => nav({ to: "/app/devis/$id", params: { id: "nouveau" } })}><Plus />Nouveau devis</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Montant total des devis" value={total} format={mad} icon={<FileText />} />
        <Kpi label="En attente de réponse" value={rows.filter((q) => ["Envoyé", "À relancer", "Relancé"].includes(q.status)).length} icon={<Clock />} tone="blue" />
        <Kpi label="Acceptés" value={rows.filter((q) => ["Accepté", "Transformé en commande"].includes(q.status)).length} icon={<CheckCircle2 />} tone="green" />
        <Kpi label="Refusés / expirés" value={rows.filter((q) => ["Refusé", "Expiré"].includes(q.status)).length} icon={<XCircle />} tone="red" />
      </div>
      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} placeholder="N° devis, client…" />
        <FilterSelect label="Statut" options={Q_STATUSES} {...t.filter("st", (q, v) => q.status === v)} />
        <FilterSelect label="Commercial" options={COMMERCIAUX} {...t.filter("sa", (q, v) => q.sales === v)} />
      </Toolbar>
      <DataTable count={t.rows.length} empty={!t.rows.length} head={<><Th sort={t.sortProps("id")}>N° devis</Th><Th>Client</Th><Th sort={t.sortProps("date")}>Date</Th><Th sort={t.sortProps("amount")}>Montant TTC</Th><Th>Statut</Th><Th>Dernière relance</Th><Th>Prochaine relance</Th><Th>Commercial</Th><Th className="text-right">Actions</Th></>}>
        {t.rows.map((q) => (
          <tr key={q.id} className="cursor-pointer" onClick={() => open(q.id)}>
            <Td className="font-mono text-xs text-primary">{q.id}</Td><Td className="font-medium">{clientOf(s, q.clientId).company}</Td><Td>{fDate(q.date)}</Td>
            <Td className="tabular-nums">{mad(quoteTotals(q.lines).ttc)}</Td><Td><StatusBadge status={q.status} /></Td>
            <Td className="text-xs text-muted-foreground">{fDate(q.lastReminder)}</Td><Td className="text-xs">{fDate(q.nextReminder)}</Td><Td>{q.sales}</Td>
            <Td className="text-right"><div onClick={(e) => e.stopPropagation()}><RowMenu items={[
              { label: "Voir", icon: <Eye />, onClick: () => open(q.id) },
              { label: "Modifier", icon: <Pencil />, onClick: () => open(q.id) },
              { label: "Valider", icon: <CheckCircle2 />, onClick: () => { setQuoteStatus(q.id, "À valider"); toast.success("Devis validé"); }, disabled: q.status !== "Brouillon" },
              { label: "Envoyer", icon: <Send />, onClick: () => { setQuoteStatus(q.id, "Envoyé"); toast.success("Devis envoyé au client"); }, disabled: !["Brouillon", "À valider"].includes(q.status) },
              { label: "Relancer", icon: <BellRing />, onClick: () => relaunchQuote(q.id), disabled: !["Envoyé", "À relancer", "Relancé"].includes(q.status) },
              { label: "Dupliquer", icon: <Copy />, onClick: () => duplicateQuote(q.id) },
              { label: "Télécharger PDF", icon: <Download />, onClick: () => pdfMock(q.id) },
              { label: "Archiver", icon: <Archive />, onClick: () => { update((st) => { st.quotes = st.quotes.map((x) => (x.id === q.id ? { ...x, archived: true } : x)); }); toast("Devis archivé", { action: { label: "Annuler", onClick: () => update((st) => { st.quotes = st.quotes.map((x) => (x.id === q.id ? { ...x, archived: false } : x)); }) } }); }, separator: true, danger: true },
            ]} /></div></Td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
