import { createFileRoute } from "@tanstack/react-router";
import { Download, History } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { fDate, fTime, daysTo } from "@/lib/format";

export const Route = createFileRoute("/app/historique")({
  head: () => ({ meta: [{ title: "Historique global — TOUVIS AI" }, { name: "description", content: "Journal complet des actions des agents IA et des utilisateurs." }, { property: "og:title", content: "Historique — TOUVIS AI" }, { property: "og:description", content: "Journal d'audit complet." }] }),
  component: Hist,
});

function Hist() {
  const s = useStore();
  const t = useTable(s.logs, { search: (l) => `${l.action} ${l.client} ${l.user}`, sorters: { date: (l) => l.date }, initialSort: { key: "date", dir: "desc" } });
  const uniq = (k: "agent" | "user" | "module") => [...new Set(s.logs.map((l) => l[k]))].filter((x) => x !== "—").sort();
  return (
    <div>
      <PageHeader icon={<History />} title="Historique global" subtitle="Chaque action des agents IA et de vos équipes est tracée." actions={<Button variant="outline" className="bg-transparent" onClick={() => toast.success("Export CSV généré", { description: `${t.rows.length} lignes` })}><Download />Exporter</Button>} />
      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} />
        <FilterSelect label="Date" options={["Aujourd'hui", "7 derniers jours", "Plus ancien"]} {...t.filter("d", (l, v) => { const d = -daysTo(l.date); return v === "Aujourd'hui" ? d === 0 : v === "7 derniers jours" ? d <= 7 : d > 7; })} />
        <FilterSelect label="Agent" options={uniq("agent")} {...t.filter("a", (l, v) => l.agent === v)} />
        <FilterSelect label="Utilisateur" options={uniq("user")} {...t.filter("u", (l, v) => l.user === v)} />
        <FilterSelect label="Module" options={uniq("module")} {...t.filter("m", (l, v) => l.module === v)} />
        <FilterSelect label="Type d'action" options={["Relance", "Alerte", "Devis", "Synchronisation", "Campagne", "Conversation"]} {...t.filter("ty", (l, v) => l.action.toLowerCase().includes(v.toLowerCase()))} />
      </Toolbar>
      <DataTable count={t.rows.length} empty={!t.rows.length} head={<><Th sort={t.sortProps("date")}>Date</Th><Th>Heure</Th><Th>Utilisateur</Th><Th>Agent IA</Th><Th>Module</Th><Th>Action</Th><Th>Client</Th><Th>Résultat</Th></>}>
        {t.rows.map((l) => <tr key={l.id}><Td>{fDate(l.date)}</Td><Td className="font-mono text-xs">{fTime(l.date)}</Td><Td>{l.user}</Td><Td className="text-primary">{l.agent}</Td><Td>{l.module}</Td><Td className="max-w-[320px] truncate">{l.action}</Td><Td className="text-muted-foreground">{l.client}</Td><Td><StatusBadge status={l.result} /></Td></tr>)}
      </DataTable>
    </div>
  );
}
