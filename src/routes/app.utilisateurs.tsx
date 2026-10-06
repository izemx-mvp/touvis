import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Power, Shield, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Toolbar, SearchInput, FilterSelect, useTable, DataTable, Th, Td, StatusBadge, RowMenu, ConfirmDialog, Field, Avatar } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, update, uid, nowIso, log } from "@/lib/store";
import { ROLES, type User, type Role } from "@/lib/mock";
import { fDateTime } from "@/lib/format";

export const Route = createFileRoute("/app/utilisateurs")({
  head: () => ({ meta: [{ title: "Utilisateurs — TOUVIS AI" }, { name: "description", content: "Gestion des utilisateurs et des rôles." }, { property: "og:title", content: "Utilisateurs — TOUVIS AI" }, { property: "og:description", content: "Rôles et accès de l'équipe TOUVIS." }] }),
  component: Users,
});

function Users() {
  const s = useStore();
  const [form, setForm] = useState<User | null>(null);
  const [del, setDel] = useState<User | null>(null);
  const t = useTable(s.users, { search: (u) => `${u.name} ${u.email}`, sorters: { name: (u) => u.name, last: (u) => u.lastLogin } });
  const patch = (id: string, p: Partial<User>, msg: string) => { update((st) => { st.users = st.users.map((u) => (u.id === id ? { ...u, ...p } : u)); log(st, { module: "Utilisateurs", action: msg }); }); toast.success(msg); };
  const save = () => {
    const f = form!;
    if (!f.name.trim() || !f.email.includes("@")) { toast.error("Nom et email valides requis"); return; }
    update((st) => { st.users = f.id ? st.users.map((u) => (u.id === f.id ? f : u)) : [{ ...f, id: uid("U"), lastLogin: nowIso() }, ...st.users]; log(st, { module: "Utilisateurs", action: f.id ? `Utilisateur modifié : ${f.name}` : `Utilisateur ajouté : ${f.name}` }); });
    toast.success(f.id ? "Utilisateur modifié" : "Invitation envoyée", { description: f.email }); setForm(null);
  };
  return (
    <div>
      <PageHeader icon={<UserCog />} eyebrow="Administration" title="Utilisateurs" subtitle="Gérez les accès de votre équipe par rôle." actions={<Button onClick={() => setForm({ id: "", name: "", email: "", role: "Commercial", active: true, lastLogin: "" })}><Plus />Ajouter</Button>} />
      <Toolbar>
        <SearchInput value={t.q} onChange={t.setQ} />
        <FilterSelect label="Rôle" options={ROLES} {...t.filter("r", (u, v) => u.role === v)} />
        <FilterSelect label="Statut" options={["Actif", "Inactif"]} {...t.filter("s", (u, v) => (v === "Actif") === u.active)} />
      </Toolbar>
      <DataTable count={t.rows.length} empty={!t.rows.length} head={<><Th sort={t.sortProps("name")}>Nom</Th><Th>Email</Th><Th>Rôle</Th><Th>Statut</Th><Th sort={t.sortProps("last")}>Dernière connexion</Th><Th className="text-right">Actions</Th></>}>
        {t.rows.map((u) => (
          <tr key={u.id}>
            <Td><div className="flex items-center gap-2"><Avatar name={u.name} /><span className="font-medium">{u.name}</span></div></Td><Td className="text-muted-foreground">{u.email}</Td>
            <Td><span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-xs"><Shield className="size-3 text-primary" />{u.role}</span></Td>
            <Td><StatusBadge status={u.active ? "Actif" : "Inactif"} /></Td><Td className="text-xs text-muted-foreground">{fDateTime(u.lastLogin)}</Td>
            <Td className="text-right"><RowMenu items={[
              { label: "Modifier", icon: <Pencil />, onClick: () => setForm({ ...u }) },
              ...ROLES.filter((r) => r !== u.role).map((r, i) => ({ label: `Rôle : ${r}`, icon: <Shield />, onClick: () => patch(u.id, { role: r as Role }, `${u.name} → ${r}`), separator: i === 0 })),
              { label: u.active ? "Désactiver" : "Activer", icon: <Power />, onClick: () => patch(u.id, { active: !u.active }, `${u.name} ${u.active ? "désactivé" : "activé"}`), separator: true },
              { label: "Supprimer", icon: <Trash2 />, onClick: () => setDel(u), danger: true },
            ]} /></Td>
          </tr>
        ))}
      </DataTable>
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle>{form?.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle></DialogHeader>
          {form && <div className="space-y-3">
            <Field label="Nom complet"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="prenom.nom@touvis.ma" /></Field>
            <Field label="Rôle"><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></Field>
          </div>}
          <DialogFooter><Button variant="ghost" onClick={() => setForm(null)}>Annuler</Button><Button onClick={save}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger title="Supprimer cet utilisateur ?" description={del?.email} confirmLabel="Supprimer" onConfirm={() => { update((st) => { st.users = st.users.filter((u) => u.id !== del!.id); log(st, { module: "Utilisateurs", action: `Utilisateur supprimé : ${del!.name}` }); }); toast.success("Utilisateur supprimé"); setDel(null); }} />
    </div>
  );
}
