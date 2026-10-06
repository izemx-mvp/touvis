import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge, RowMenu, ConfirmDialog, Field } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, update, uid, nowIso, log } from "@/lib/store";
import { FAQ_CATEGORIES, type Faq } from "@/lib/mock";
import { fDate } from "@/lib/format";

export const Route = createFileRoute("/app/faq")({
  head: () => ({ meta: [{ title: "FAQ — TOUVIS AI" }, { name: "description", content: "Questions fréquentes utilisées par l'agent Service Client." }, { property: "og:title", content: "FAQ — TOUVIS AI" }, { property: "og:description", content: "Gérez les réponses de l'assistant client." }] }),
  component: FaqPage,
});

const empty: Faq = { id: "", q: "", a: "", category: "Produits", active: true, updated: "" };

function FaqPage() {
  const s = useStore();
  const [form, setForm] = useState<Faq | null>(null);
  const [del, setDel] = useState<Faq | null>(null);
  const t = useTable(s.faqs, { search: (f) => `${f.q} ${f.a}`, sorters: { updated: (f) => f.updated, q: (f) => f.q } });
  const save = () => {
    if (!form!.q.trim() || !form!.a.trim()) { toast.error("Question et réponse obligatoires"); return; }
    update((st) => {
      if (form!.id) st.faqs = st.faqs.map((f) => (f.id === form!.id ? { ...form!, updated: nowIso() } : f));
      else st.faqs = [{ ...form!, id: uid("FAQ"), updated: nowIso() }, ...st.faqs];
      log(st, { agent: "Agent Service Client", module: "FAQ", action: form!.id ? "FAQ modifiée" : "FAQ ajoutée" });
    });
    toast.success(form!.id ? "FAQ modifiée" : "FAQ ajoutée"); setForm(null);
  };
  const toggle = (f: Faq) => { update((st) => { st.faqs = st.faqs.map((x) => (x.id === f.id ? { ...x, active: !x.active, updated: nowIso() } : x)); }); toast.success(f.active ? "FAQ désactivée" : "FAQ activée"); };
  return (
    <div>
      <PageHeader icon={<HelpCircle />} eyebrow="Service Client" title="FAQ" subtitle="Les réponses validées que l'assistant utilise en priorité." actions={<Button onClick={() => setForm({ ...empty })}><Plus />Ajouter</Button>} />
      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} />
        <FilterSelect label="Catégorie" options={FAQ_CATEGORIES} {...t.filter("cat", (f, v) => f.category === v)} />
        <FilterSelect label="Statut" options={["Active", "Inactive"]} {...t.filter("st", (f, v) => (v === "Active") === f.active)} />
      </Toolbar>
      <DataTable count={t.rows.length} empty={!t.rows.length} head={<><Th sort={t.sortProps("q")}>Question</Th><Th>Réponse</Th><Th>Catégorie</Th><Th>Statut</Th><Th sort={t.sortProps("updated")}>Modifiée le</Th><Th className="text-right">Actions</Th></>}>
        {t.rows.map((f) => (
          <tr key={f.id}>
            <Td className="max-w-[280px] whitespace-normal font-medium">{f.q}</Td><Td className="max-w-[380px] whitespace-normal text-muted-foreground">{f.a}</Td>
            <Td>{f.category}</Td><Td><StatusBadge status={f.active ? "Active" : "Inactive"} /></Td><Td className="text-xs text-muted-foreground">{fDate(f.updated)}</Td>
            <Td className="text-right"><RowMenu items={[
              { label: "Modifier", icon: <Pencil />, onClick: () => setForm({ ...f }) },
              { label: f.active ? "Désactiver" : "Activer", icon: <Power />, onClick: () => toggle(f) },
              { label: "Supprimer", icon: <Trash2 />, onClick: () => setDel(f), danger: true, separator: true },
            ]} /></Td>
          </tr>
        ))}
      </DataTable>
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle>{form?.id ? "Modifier la FAQ" : "Nouvelle FAQ"}</DialogTitle></DialogHeader>
          {form && <div className="space-y-3">
            <Field label="Question"><Input value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} /></Field>
            <Field label="Réponse"><Textarea rows={4} value={form.a} onChange={(e) => setForm({ ...form, a: e.target.value })} /></Field>
            <Field label="Catégorie"><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FAQ_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
          </div>}
          <DialogFooter><Button variant="ghost" onClick={() => setForm(null)}>Annuler</Button><Button onClick={save}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger title="Supprimer cette FAQ ?" description={del?.q} confirmLabel="Supprimer" onConfirm={() => { update((st) => { st.faqs = st.faqs.filter((f) => f.id !== del!.id); log(st, { module: "FAQ", action: "FAQ supprimée" }); }); toast.success("FAQ supprimée"); setDel(null); }} />
    </div>
  );
}
