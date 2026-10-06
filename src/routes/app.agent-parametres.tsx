import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Field } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, update, log } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/agent-parametres")({
  head: () => ({ meta: [{ title: "Paramètres de l'agent Service Client — TOUVIS AI" }, { name: "description", content: "Ton, langues, horaires et escalade de l'assistant client." }, { property: "og:title", content: "Paramètres agent — TOUVIS AI" }, { property: "og:description", content: "Configurez l'agent Service Client." }] }),
  component: AgentSettings,
});

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const ESC = ["client mécontent", "réponse incertaine", "demande complexe", "demande commerciale importante", "demande de remise exceptionnelle"];
const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return <div className="flex flex-wrap gap-1.5">{options.map((o) => <button key={o} type="button" onClick={() => onChange(toggle(value, o))} className={cn("rounded-full border px-3 py-1 text-xs transition-all", value.includes(o) ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>{o}</button>)}</div>;
}

function AgentSettings() {
  const s = useStore();
  const [f, setF] = useState(s.serviceAgent);
  return (
    <div>
      <PageHeader icon={<Settings2 />} eyebrow="Service Client" title="Paramètres de l'agent" subtitle="Personnalisez la manière dont l'assistant répond à vos clients."
        actions={<Button onClick={() => { update((st) => { st.serviceAgent = f; log(st, { agent: "Agent Service Client", module: "Service Client", action: "Paramètres agent mis à jour" }); }); toast.success("Paramètres enregistrés"); }}><Save />Enregistrer</Button>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Panel title="Identité">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <div className="grid size-20 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-glow"><Bot className="size-9" /></div>
              <div className="space-y-3">
                <Field label="Nom de l'agent"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
                <Field label="Message d'accueil"><Textarea rows={2} value={f.greeting} onChange={(e) => setF({ ...f, greeting: e.target.value })} /></Field>
              </div>
            </div>
          </Panel>
          <Panel title="Ton et langues">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">{["professionnel", "chaleureux", "direct"].map((t) => <button key={t} onClick={() => setF({ ...f, tone: t })} className={cn("rounded-xl border p-3 text-left text-sm capitalize transition-all", f.tone === t ? "border-primary/50 bg-primary/10 shadow-glow" : "border-border hover:border-primary/30")}>Ton {t}</button>)}</div>
              <Field label="Langues"><Chips options={["Français", "Arabe", "Anglais"]} value={f.languages} onChange={(v) => setF({ ...f, languages: v })} /></Field>
            </div>
          </Panel>
          <Panel title="Horaires">
            <div className="space-y-4">
              <Field label="Jours"><Chips options={DAYS} value={f.days} onChange={(v) => setF({ ...f, days: v })} /></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Heure début"><Input type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field><Field label="Heure fin"><Input type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field></div>
              <Field label="Réponse hors horaires"><Textarea rows={2} value={f.offHours} onChange={(e) => setF({ ...f, offHours: e.target.value })} /></Field>
            </div>
          </Panel>
          <Panel title="Transfert vers un humain">
            <div className="grid gap-2 sm:grid-cols-2">{ESC.map((e) => <label key={e} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm first-letter:uppercase"><Checkbox checked={f.escalation.includes(e)} onCheckedChange={() => setF({ ...f, escalation: toggle(f.escalation, e) })} /><span className="first-letter:uppercase">{e}</span></label>)}</div>
          </Panel>
          <Panel title="Canaux"><Chips options={["Email", "WhatsApp", "Site web", "Application"]} value={f.channels} onChange={(v) => setF({ ...f, channels: v })} /></Panel>
        </div>
        <Panel title="Aperçu" className="h-fit lg:sticky lg:top-24">
          <div className="space-y-3 rounded-2xl border border-border bg-background/40 p-4">
            <div className="flex items-center gap-2"><div className="grid size-8 place-items-center rounded-full bg-brand text-primary-foreground"><Bot className="size-4" /></div><div className="text-sm font-medium">{f.name}</div></div>
            <div className="rounded-2xl rounded-tl-sm border border-primary/30 bg-primary/10 px-3 py-2 text-sm">{f.greeting}</div>
            <div className="ml-auto w-fit rounded-2xl rounded-tr-sm bg-secondary px-3 py-2 text-sm">Avez-vous des écrous M20 inox ?</div>
            <div className="rounded-2xl rounded-tl-sm border border-primary/30 bg-primary/10 px-3 py-2 text-sm">{f.tone === "direct" ? "Oui : REF-1102, 340 en stock. Devis ?" : f.tone === "chaleureux" ? "Avec plaisir ! 😊 Nous avons 340 écrous M20 inox (REF-1102) prêts à partir. Je vous prépare un devis ?" : "Oui, la référence REF-1102 est disponible (340 unités). Souhaitez-vous recevoir un devis ?"}</div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">{f.days.join(", ")} · {f.start}–{f.end} · {f.languages.join(" / ")}</div>
        </Panel>
      </div>
    </div>
  );
}
