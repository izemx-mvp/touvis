import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, FileSpreadsheet, FileText, File, Library, Power, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge, RowMenu, ConfirmDialog, Kpi } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore, update, uid, nowIso, log } from "@/lib/store";
import { DOC_CATEGORIES, type Doc } from "@/lib/mock";
import { fDate } from "@/lib/format";

export const Route = createFileRoute("/app/connaissances")({
  head: () => ({ meta: [{ title: "Base de connaissances — TOUVIS AI" }, { name: "description", content: "Catalogues, tarifs et procédures indexés pour les agents IA." }, { property: "og:title", content: "Base de connaissances — TOUVIS AI" }, { property: "og:description", content: "Documents utilisés par l'IA." }] }),
  component: Knowledge,
});

const ICON = { PDF: FileText, Excel: FileSpreadsheet, Word: File };

function Knowledge() {
  const s = useStore();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [view, setView] = useState<Doc | null>(null);
  const [del, setDel] = useState<Doc | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const t = useTable(s.docs, { search: (d) => d.name, sorters: { date: (d) => d.date, name: (d) => d.name, used: (d) => d.usedByAI }, initialSort: { key: "date", dir: "desc" } });
  const index = (id: string) => {
    update((st) => { st.docs = st.docs.map((d) => (d.id === id ? { ...d, index: "En cours" } : d)); });
    let p = 0;
    const iv = setInterval(() => {
      p += 12 + Math.random() * 18; setProgress((x) => ({ ...x, [id]: Math.min(100, p) }));
      if (p >= 100) { clearInterval(iv); setProgress((x) => { const n = { ...x }; delete n[id]; return n; }); update((st) => { st.docs = st.docs.map((d) => (d.id === id ? { ...d, index: "Indexé" } : d)); log(st, { agent: "Agent Service Client", module: "Base de connaissances", action: `Document indexé : ${st.docs.find((d) => d.id === id)!.name}` }); }); toast.success("Document indexé", { description: "L'IA peut désormais l'utiliser." }); }
    }, 350);
  };
  const add = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    const id = uid("DOC");
    update((st) => { st.docs = [{ id, name, type: ext === "xlsx" || ext === "xls" || ext === "csv" ? "Excel" : ext === "docx" || ext === "doc" ? "Word" : "PDF", category: "Catalogues", size: `${(Math.random() * 8 + 0.3).toFixed(1).replace(".", ",")} Mo`, date: nowIso(), index: "En cours", active: true, usedByAI: 0 }, ...st.docs]; });
    toast("Téléversement terminé", { description: "Indexation en cours…" });
    index(id);
  };
  return (
    <div>
      <PageHeader icon={<Library />} eyebrow="Service Client" title="Base de connaissances" subtitle="Les documents que vos agents IA consultent pour répondre avec précision."
        actions={<><input ref={input} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) add(f.name); e.target.value = ""; }} /><Button onClick={() => input.current?.click()}><UploadCloud />Ajouter document</Button></>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Documents" value={s.docs.length} icon={<Library />} />
        <Kpi label="Indexés" value={s.docs.filter((d) => d.index === "Indexé").length} icon={<FileText />} tone="green" />
        <Kpi label="Actifs pour l'IA" value={s.docs.filter((d) => d.active).length} icon={<Power />} tone="blue" />
        <Kpi label="Utilisations IA" value={s.docs.reduce((a, d) => a + d.usedByAI, 0)} icon={<RefreshCw />} tone="cyan" hint="30 derniers jours" />
      </div>
      <button onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) add(f.name); }} className="mb-5 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] py-8 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/[0.06]">
        <UploadCloud className="size-7 text-primary" />Glissez un PDF, Excel ou Word ici, ou cliquez pour parcourir
      </button>
      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} />
        <FilterSelect label="Type" options={["PDF", "Excel", "Word"]} {...t.filter("type", (d, v) => d.type === v)} />
        <FilterSelect label="Catégorie" options={DOC_CATEGORIES} {...t.filter("cat", (d, v) => d.category === v)} />
        <FilterSelect label="Indexation" options={["Indexé", "En cours", "Erreur"]} {...t.filter("idx", (d, v) => d.index === v)} />
      </Toolbar>
      <DataTable count={t.rows.length} empty={!t.rows.length} head={<><Th sort={t.sortProps("name")}>Nom</Th><Th>Type</Th><Th>Catégorie</Th><Th>Taille</Th><Th sort={t.sortProps("date")}>Ajouté le</Th><Th>Indexation</Th><Th sort={t.sortProps("used")}>Utilisé par IA</Th><Th className="text-right">Actions</Th></>}>
        {t.rows.map((d) => { const I = ICON[d.type]; return (
          <tr key={d.id} className={d.active ? "" : "opacity-50"}>
            <Td><div className="flex items-center gap-2.5"><I className="size-4 text-primary" /><span className="font-medium">{d.name}</span></div></Td><Td>{d.type}</Td><Td className="text-muted-foreground">{d.category}</Td><Td className="text-muted-foreground">{d.size}</Td><Td className="text-xs">{fDate(d.date)}</Td>
            <Td>{progress[d.id] !== undefined ? <div className="w-28"><Progress value={progress[d.id]} className="h-1.5" /><div className="mt-1 text-[10px] text-primary">{Math.round(progress[d.id])} %</div></div> : <StatusBadge status={d.index} />}</Td>
            <Td className="tabular-nums">{d.usedByAI} fois</Td>
            <Td className="text-right"><RowMenu items={[
              { label: "Voir", icon: <Eye />, onClick: () => setView(d) },
              { label: "Réindexer", icon: <RefreshCw />, onClick: () => index(d.id) },
              { label: d.active ? "Désactiver" : "Activer", icon: <Power />, onClick: () => { update((st) => { st.docs = st.docs.map((x) => (x.id === d.id ? { ...x, active: !x.active } : x)); }); toast.success(d.active ? "Document désactivé" : "Document activé"); } },
              { label: "Supprimer", icon: <Trash2 />, onClick: () => setDel(d), danger: true, separator: true },
            ]} /></Td>
          </tr>
        ); })}
      </DataTable>
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader><DialogTitle>{view?.name}</DialogTitle><DialogDescription>{view?.category} · {view?.size} · {view?.usedByAI} utilisations par l'IA</DialogDescription></DialogHeader>
          <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-5 text-sm text-muted-foreground">
            <div className="font-display text-base text-foreground">Extrait indexé</div>
            <p>TOUVIS — Fournitures industrielles. Gamme complète de boulonnerie, visserie, outillage et équipements de levage. Tarifs HT en MAD, TVA 20 %. Livraison 48h sur Casablanca et Rabat…</p>
            <div className="h-2 w-3/4 rounded bg-secondary" /><div className="h-2 w-2/3 rounded bg-secondary" /><div className="h-2 w-5/6 rounded bg-secondary" />
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger title="Supprimer ce document ?" description={`${del?.name} ne sera plus utilisé par l'IA.`} confirmLabel="Supprimer" onConfirm={() => { update((st) => { st.docs = st.docs.filter((x) => x.id !== del!.id); }); toast.success("Document supprimé"); setDel(null); }} />
    </div>
  );
}
