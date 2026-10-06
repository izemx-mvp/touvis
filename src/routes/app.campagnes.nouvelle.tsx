import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, Mail, MessageCircle, Rocket, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { Panel, Field, ConfirmDialog, AnimatedNumber } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, update, log, uid, notify } from "@/lib/store";
import { CATEGORIES } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/campagnes/nouvelle")({
  head: () => ({ meta: [{ title: "Nouvelle campagne — TOUVIS AI" }, { name: "description", content: "Assistant de création de campagne en 6 étapes." }, { property: "og:title", content: "Nouvelle campagne — TOUVIS AI" }, { property: "og:description", content: "Ciblez, rédigez avec l'IA et lancez." }] }),
  component: Wizard,
});

const STEPS = ["Informations", "Audience", "Canal", "Message", "Programmation", "Résumé"];
const OBJ = ["Promotion", "Nouveau produit", "Réactivation", "Fidélisation", "Relance"];
const AUD: { key: string; label: string; options: string[] }[] = [
  { key: "type", label: "Client / prospect", options: ["Clients", "Prospects", "Tous"] },
  { key: "sector", label: "Secteur", options: ["BTP", "Agroalimentaire", "Automobile", "Énergie", "Maintenance industrielle", "Mines"] },
  { key: "city", label: "Ville", options: ["Casablanca", "Rabat", "Tanger", "Kénitra", "Agadir", "Fès"] },
  { key: "cat", label: "Catégorie", options: CATEGORIES },
  { key: "history", label: "Historique d'achat", options: ["< 3 mois", "3-12 mois", "> 12 mois"] },
  { key: "activity", label: "Activité", options: ["Client actif", "Client inactif"] },
  { key: "quote", label: "Devis", options: ["Devis accepté", "Devis refusé", "Devis sans réponse"] },
];
const VARS = ["{{nom}}", "{{societe}}", "{{produit}}", "{{offre}}", "{{commercial}}"];

function Wizard() {
  const nav = useNavigate();
  const s = useStore();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", description: "", objective: "Promotion", channel: "Email" as "Email" | "WhatsApp", message: "", when: "now", date: "2026-10-08", time: "09:00", filters: {} as Record<string, string> });
  const [gen, setGen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const contacts = useMemo(() => { const n = Object.values(f.filters).filter((v) => v && v !== "all").length; return Math.max(12, Math.round(612 * Math.pow(0.68, n)) - n * 7); }, [f.filters]);
  const can = step === 0 ? f.name.trim().length > 2 : step === 3 ? f.message.trim().length > 10 : true;
  const generate = () => { setGen(true); setTimeout(() => { setF((x) => ({ ...x, message: x.objective === "Réactivation" ? "Bonjour {{nom}},\n\nCela fait quelque temps que nous n'avons pas eu le plaisir de servir {{societe}}. Pour votre retour, profitez de {{offre}} sur {{produit}}, valable jusqu'au 31 octobre.\n\n{{commercial}} reste à votre disposition.\n\nL'équipe TOUVIS" : `Bonjour {{nom}},\n\nTOUVIS lance une offre spéciale pour {{societe}} : {{offre}} sur toute la gamme {{produit}}. Stock disponible immédiatement, livraison 48h.\n\nRépondez à ce message pour recevoir votre devis personnalisé.\n\n{{commercial}} — TOUVIS` })); setGen(false); toast.success("Message généré par l'IA"); }, 1300); };
  const launch = () => {
    const id = uid("CP");
    const now = f.when === "now";
    update((st) => {
      st.campaigns = [{ id, name: f.name, objective: f.objective, segment: Object.values(f.filters).filter((v) => v && v !== "all").join(", ") || "Tous les clients", channel: f.channel, contacts, date: now ? new Date().toISOString() : new Date(`${f.date}T${f.time}`).toISOString(), status: now ? "En cours" : "Planifiée", sent: now ? Math.round(contacts * 0.25) : 0, delivered: now ? Math.round(contacts * 0.24) : 0, replies: 0, interested: 0, errors: 0, message: f.message, recipients: st.clients.slice(0, 10).map((c) => ({ clientId: c.id, status: "Sans réponse", reply: "—" })), daily: now ? [Math.round(contacts * 0.24), 0, 0, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0] }, ...st.campaigns];
      log(st, { agent: "Agent Campagnes", module: "Campagnes", action: `Campagne « ${f.name} » ${now ? "lancée" : "programmée"}` });
      notify(st, { category: "Campagnes", title: now ? "Campagne lancée" : "Campagne programmée", body: `${f.name} — ${contacts} contacts`, link: `/app/campagnes/${id}` });
    });
    toast.success(now ? "Campagne lancée 🚀" : "Campagne programmée", { description: `${contacts} contacts via ${f.channel}` });
    nav({ to: "/app/campagnes/$id", params: { id } });
  };
  const preview = f.message.replaceAll("{{nom}}", "Hicham").replaceAll("{{societe}}", "Atlas Industrie").replaceAll("{{produit}}", "Boulonnerie").replaceAll("{{offre}}", "-10 %").replaceAll("{{commercial}}", "Youssef Alami");

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/app/campagnes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Campagnes</Link>
      <h1 className="mb-6 text-2xl font-semibold">Nouvelle campagne</h1>
      <ol className="mb-6 grid grid-cols-6 gap-2">
        {STEPS.map((l, i) => (
          <li key={l}><button disabled={i > step} onClick={() => setStep(i)} className="w-full text-left">
            <div className={cn("h-1 rounded-full transition-all", i <= step ? "bg-brand shadow-glow" : "bg-secondary")} />
            <div className={cn("mt-2 flex items-center gap-1.5 text-xs", i === step ? "text-primary" : i < step ? "text-foreground" : "text-muted-foreground")}>{i < step ? <Check className="size-3.5" /> : <span className="font-mono">{i + 1}</span>}<span className="hidden sm:inline">{l}</span></div>
          </button></li>
        ))}
      </ol>

      <Panel key={step} className="page-enter" title={`Étape ${step + 1} — ${STEPS[step]}`}>
        {step === 0 && <div className="space-y-4">
          <Field label="Nom de la campagne"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex : Campagne Novembre — Levage" /></Field>
          <Field label="Description"><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Objectif"><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{OBJ.map((o) => <button key={o} onClick={() => setF({ ...f, objective: o })} className={cn("rounded-xl border p-3 text-sm transition-all", f.objective === o ? "border-primary/50 bg-primary/10 shadow-glow" : "border-border hover:border-primary/30")}>{o}</button>)}</div></Field>
        </div>}
        {step === 1 && <div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{AUD.map((a) => <Field key={a.key} label={a.label}><Select value={f.filters[a.key] ?? "all"} onValueChange={(v) => setF({ ...f, filters: { ...f.filters, [a.key]: v } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem>{a.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></Field>)}</div>
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4"><Users className="size-6 text-primary" /><div className="text-sm"><span className="font-display text-2xl font-semibold text-primary"><AnimatedNumber value={contacts} /></span> contacts correspondent à votre sélection</div></div>
        </div>}
        {step === 2 && <div className="grid gap-3 sm:grid-cols-2">{([["Email", Mail, "Taux d'ouverture moyen 38 %"], ["WhatsApp", MessageCircle, "Taux de lecture moyen 91 %"]] as const).map(([c, I, d]) => <button key={c} onClick={() => setF({ ...f, channel: c })} className={cn("rounded-2xl border p-5 text-left transition-all", f.channel === c ? "border-primary/50 bg-primary/10 shadow-glow" : "border-border hover:border-primary/30")}><I className="size-7 text-primary" /><div className="mt-3 font-display font-semibold">{c}</div><div className="text-xs text-muted-foreground">{d}</div></button>)}</div>}
        {step === 3 && <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2"><Button size="sm" className="bg-brand" onClick={generate} disabled={gen}>{gen ? <Loader2 className="animate-spin" /> : <Sparkles />}Générer avec IA</Button><span className="text-xs text-muted-foreground">ou écrivez manuellement</span></div>
            <Textarea rows={10} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Votre message…" />
            <div className="flex flex-wrap gap-1.5">{VARS.map((v) => <button key={v} onClick={() => setF({ ...f, message: f.message + " " + v })} className="rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 font-mono text-[11px] text-primary hover:bg-primary/15">{v}</button>)}</div>
          </div>
          <div><div className="mb-2 text-xs text-muted-foreground">Aperçu ({f.channel})</div><div className={cn("min-h-40 whitespace-pre-wrap rounded-2xl p-4 text-sm", f.channel === "WhatsApp" ? "rounded-tl-sm border border-success/30 bg-success/10" : "border border-border bg-background/40")}>{preview || <span className="text-muted-foreground">L'aperçu apparaîtra ici.</span>}</div></div>
        </div>}
        {step === 4 && <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">{[["now", "Envoyer maintenant"], ["later", "Programmer"]].map(([k, l]) => <button key={k} onClick={() => setF({ ...f, when: k })} className={cn("rounded-xl border p-4 text-left text-sm", f.when === k ? "border-primary/50 bg-primary/10 shadow-glow" : "border-border")}>{l}</button>)}</div>
          {f.when === "later" && <div className="grid grid-cols-2 gap-3"><Field label="Date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field><Field label="Heure"><Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field></div>}
        </div>}
        {step === 5 && <div className="grid gap-4 sm:grid-cols-2">
          {[["Nom", f.name], ["Objectif", f.objective], ["Audience", `${contacts} contacts`], ["Segment", Object.values(f.filters).filter((v) => v !== "all").join(", ") || "Tous les clients"], ["Canal", f.channel], ["Envoi", f.when === "now" ? "Immédiat" : `Le ${f.date} à ${f.time}`]].map(([l, v]) => <div key={l} className="rounded-xl border border-border p-3"><div className="text-xs text-muted-foreground">{l}</div><div className="mt-0.5 font-medium">{v}</div></div>)}
          <div className="whitespace-pre-wrap rounded-xl border border-border p-3 text-sm sm:col-span-2">{preview}</div>
        </div>}
      </Panel>

      <div className="mt-4 flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft />Précédent</Button>
        {step < 5 ? <Button disabled={!can} onClick={() => setStep(step + 1)}>Suivant<ArrowRight /></Button> : <Button className="bg-brand shadow-glow" onClick={() => setConfirm(true)}><Rocket />Lancer la campagne</Button>}
      </div>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Lancer la campagne ?" description={`« ${f.name} » sera ${f.when === "now" ? "envoyée immédiatement" : "programmée"} à ${contacts} contacts via ${f.channel}.`} confirmLabel="Lancer" onConfirm={launch} />
      <span className="hidden">{s.campaigns.length}</span>
    </div>
  );
}
