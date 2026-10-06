import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge, RowMenu, ConfirmDialog, Field, Avatar } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, update, log, nowIso } from "@/lib/store";
import { COMMERCIAUX, type Client } from "@/lib/mock";
import { fDate, mad } from "@/lib/format";

export const Route = createFileRoute("/app/clients/")({
  head: () => ({ meta: [{ title: "Clients — TOUVIS AI" }, { name: "description", content: "CRM clients synchronisé avec Sage, vue 360°." }, { property: "og:title", content: "Clients — TOUVIS AI" }, { property: "og:description", content: "Tous vos clients B2B en un coup d'œil." }] }),
  component: Clients,
});

const blank: Client = { id: "", name: "", company: "", email: "", phone: "", city: "Casablanca", sector: "BTP", status: "Prospect", sales: COMMERCIAUX[0], ca: 0, sage: "En attente", lastActivity: "", notes: "" };

function Clients() {
  const s = useStore();
  const nav = useNavigate();
  const [form, setForm] = useState<Client | null>(null);
  const [del, setDel] = useState<Client | null>(null);
  const t = useTable(s.clients, { search: (c) => `${c.name} ${c.company} ${c.email} ${c.city}`, sorters: { ca: (c) => c.ca, company: (c) => c.company, act: (c) => c.lastActivity }, initialSort: { key: "ca", dir: "desc" } });
  const save = () => {
    const f = form!;
    if (!f.company.trim() || !f.name.trim() || !f.email.includes("@")) { toast.error("Société, contact et email valides requis"); return; }
    update((st) => {
      if (f.id) st.clients = st.clients.map((c) => (c.id === f.id ? f : c));
      else st.clients = [{ ...f, id: `CL-${1001 + st.clients.length + Math.floor(Math.random() * 900)}`, lastActivity: nowIso() }, ...st.clients];
      log(st, { module: "Clients", action: f.id ? "Client modifié" : "Client ajouté", client: f.company });
    });
    toast.success(f.id ? "Client modifié" : "Client ajouté", { description: "Envoyé à Sage pour synchronisation." }); setForm(null);
  };
  const usedIds = new Set([...s.invoices.map((i) => i.clientId), ...s.quotes.map((q) => q.clientId), ...s.conversations.map((c) => c.clientId), ...s.quoteRequests.map((r) => r.clientId)]);
  return (
    <div>
      <PageHeader icon={<Users />} eyebrow="CRM" title="Clients" subtitle="Vue 360° de chaque client : devis, factures, conversations et campagnes." actions={<Button onClick={() => setForm({ ...blank })}><Plus />Ajouter un client</Button>} />
      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} />
        <FilterSelect label="Statut" options={["Actif", "Inactif", "Prospect"]} {...t.filter("st", (c, v) => c.status === v)} />
        <FilterSelect label="Commercial" options={COMMERCIAUX} {...t.filter("sa", (c, v) => c.sales === v)} />
        <FilterSelect label="Ville" options={[...new Set(s.clients.map((c) => c.city))].sort()} {...t.filter("ci", (c, v) => c.city === v)} />
      </Toolbar>
      <DataTable count={t.rows.length} empty={!t.rows.length} head={<><Th>Client</Th><Th sort={t.sortProps("company")}>Société</Th><Th>Email</Th><Th>Téléphone</Th><Th>Statut</Th><Th>Commercial</Th><Th sort={t.sortProps("ca")}>CA</Th><Th>Devis</Th><Th>Factures</Th><Th sort={t.sortProps("act")}>Dernière activité</Th><Th className="text-right">Actions</Th></>}>
        {t.rows.map((c) => (
          <tr key={c.id} className="cursor-pointer" onClick={() => nav({ to: "/app/clients/$id", params: { id: c.id } })}>
            <Td><div className="flex items-center gap-2"><Avatar name={c.name} /><span className="font-medium">{c.name}</span></div></Td><Td>{c.company}</Td><Td className="text-xs text-muted-foreground">{c.email}</Td><Td className="text-xs">{c.phone}</Td>
            <Td><StatusBadge status={c.status} /></Td><Td>{c.sales}</Td><Td className="tabular-nums">{mad(c.ca)}</Td>
            <Td className="text-center">{s.quotes.filter((q) => q.clientId === c.id).length}</Td><Td className="text-center">{s.invoices.filter((i) => i.clientId === c.id).length}</Td><Td className="text-xs text-muted-foreground">{fDate(c.lastActivity)}</Td>
            <Td className="text-right"><div onClick={(e) => e.stopPropagation()}><RowMenu items={[
              { label: "Vue 360°", icon: <Eye />, onClick: () => nav({ to: "/app/clients/$id", params: { id: c.id } }) },
              { label: "Modifier", icon: <Pencil />, onClick: () => setForm({ ...c }) },
              { label: "Supprimer", icon: <Trash2 />, onClick: () => { if (usedIds.has(c.id)) toast.error("Ce client a des factures ou devis liés", { description: "Passez-le en Inactif plutôt." }); else setDel(c); }, danger: true, separator: true },
            ]} /></div></Td>
          </tr>
        ))}
      </DataTable>
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="glass max-w-xl">
          <DialogHeader><DialogTitle>{form?.id ? "Modifier le client" : "Nouveau client"}</DialogTitle></DialogHeader>
          {form && <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Société"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
            <Field label="Contact"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Téléphone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+212 6…" /></Field>
            <Field label="Ville"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Statut"><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Client["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Actif", "Inactif", "Prospect"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Commercial"><Select value={form.sales} onValueChange={(v) => setForm({ ...form, sales: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMMERCIAUX.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
          </div>}
          <DialogFooter><Button variant="ghost" onClick={() => setForm(null)}>Annuler</Button><Button onClick={save}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger title="Supprimer ce client ?" description={del?.company} confirmLabel="Supprimer" onConfirm={() => { update((st) => { st.clients = st.clients.filter((c) => c.id !== del!.id); log(st, { module: "Clients", action: "Client supprimé", client: del!.company }); }); toast.success("Client supprimé"); setDel(null); }} />
    </div>
  );
}
