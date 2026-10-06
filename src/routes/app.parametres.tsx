import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save, Settings, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Field, StatusBadge } from "@/components/touvis/kit";
import { Logo } from "@/components/touvis/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, update, log } from "@/lib/store";

export const Route = createFileRoute("/app/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — TOUVIS AI" }, { name: "description", content: "Paramètres entreprise, Sage, email, WhatsApp, IA et notifications." }, { property: "og:title", content: "Paramètres — TOUVIS AI" }, { property: "og:description", content: "Configurez la plateforme TOUVIS AI." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useStore();
  const [f, setF] = useState(s.settings);
  const [freq, setFreq] = useState(s.sage.frequency);
  const save = () => { update((st) => { st.settings = f; st.sage = { ...st.sage, frequency: freq }; log(st, { module: "Paramètres", action: "Paramètres mis à jour" }); }); toast.success("Paramètres enregistrés"); };
  const sw = (k: keyof typeof f, label: string, desc?: string) => <label className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"><div><div className="text-sm">{label}</div>{desc && <div className="text-xs text-muted-foreground">{desc}</div>}</div><Switch checked={f[k] as boolean} onCheckedChange={(v) => setF({ ...f, [k]: v })} /></label>;
  return (
    <div>
      <PageHeader icon={<Settings />} eyebrow="Administration" title="Paramètres" actions={<Button onClick={save}><Save />Enregistrer</Button>} />
      <Tabs defaultValue="company">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start"><TabsTrigger value="company">Entreprise</TabsTrigger><TabsTrigger value="sage">Sage</TabsTrigger><TabsTrigger value="email">Email</TabsTrigger><TabsTrigger value="wa">WhatsApp</TabsTrigger><TabsTrigger value="ai">IA</TabsTrigger><TabsTrigger value="notif">Notifications</TabsTrigger></TabsList>
        <TabsContent value="company"><Panel title="Entreprise"><div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="space-y-2"><div className="grid size-28 place-items-center rounded-2xl border border-border bg-background/40"><Logo compact /></div><Button size="sm" variant="outline" className="w-28 bg-transparent" onClick={() => toast.success("Logo mis à jour")}><UploadCloud />Logo</Button></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Nom"><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Field><Field label="Email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field><Field label="Téléphone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field><Field label="Adresse"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field></div>
        </div></Panel></TabsContent>
        <TabsContent value="sage"><Panel title="Sage"><div className="space-y-4"><div className="flex items-center gap-2 text-sm">Statut : <StatusBadge status="Synchronisé" /> Sage 100cloud connecté</div><Field label="Fréquence de synchronisation"><Select value={freq} onValueChange={setFreq}><SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger><SelectContent>{["5 min", "15 min", "30 min", "1 h", "Quotidienne"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field></div></Panel></TabsContent>
        <TabsContent value="email"><Panel title="Email"><div className="space-y-3"><Field label="Expéditeur"><Input value={f.sender} onChange={(e) => setF({ ...f, sender: e.target.value })} /></Field><Field label="Signature"><Textarea rows={3} value={f.signature} onChange={(e) => setF({ ...f, signature: e.target.value })} /></Field></div></Panel></TabsContent>
        <TabsContent value="wa"><Panel title="WhatsApp Business"><div className="space-y-3"><Field label="Numéro"><Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></Field><div className="flex items-center justify-between rounded-xl border border-border p-3"><div className="flex items-center gap-2 text-sm">Statut : <StatusBadge status={f.whatsappConnected ? "Actif" : "Inactive"} /></div><Button size="sm" variant="outline" className="bg-transparent" onClick={() => { setF({ ...f, whatsappConnected: !f.whatsappConnected }); toast.success(f.whatsappConnected ? "WhatsApp déconnecté" : "WhatsApp connecté"); }}>{f.whatsappConnected ? "Déconnecter" : "Connecter"}</Button></div></div></Panel></TabsContent>
        <TabsContent value="ai"><Panel title="Intelligence artificielle"><div className="space-y-5">
          <div><div className="mb-2 flex justify-between text-sm"><span>Niveau d'autonomie</span><span className="font-mono text-primary">{f.autonomy} %</span></div><Slider value={[f.autonomy]} max={100} step={5} onValueChange={([v]) => setF({ ...f, autonomy: v })} /><div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>Suggestions uniquement</span><span>Totalement autonome</span></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Langue"><Select value={f.aiLanguage} onValueChange={(v) => setF({ ...f, aiLanguage: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Français", "Arabe", "Anglais"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field><Field label="Ton"><Select value={f.aiTone} onValueChange={(v) => setF({ ...f, aiTone: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["professionnel", "chaleureux", "direct"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field></div>
          {sw("humanValidation", "Validation humaine", "Les devis et relances sensibles sont validés avant envoi")}
        </div></Panel></TabsContent>
        <TabsContent value="notif"><Panel title="Notifications"><div className="space-y-2">{sw("notifEmail", "Email")}{sw("notifWhatsapp", "WhatsApp")}{sw("notifInApp", "In-app")}</div></Panel></TabsContent>
      </Tabs>
    </div>
  );
}
