import { useState } from "react";
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Bot, Loader2, Mail, Paperclip, RefreshCw, Send, Sparkles, Wand2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Panel, StatusBadge, InfoRow } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useStore, update, clientOf, log, uid, nowIso, getState } from "@/lib/store";
import { addDays, TODAY } from "@/lib/mock";
import { fDateTime } from "@/lib/format";

export const Route = createFileRoute("/app/demandes/$id")({
  loader: ({ params }) => { if (!getState().quoteRequests.some((r) => r.id === params.id)) throw notFound(); return null; },
  head: ({ params }) => ({ meta: [{ title: `Analyse ${params.id} — TOUVIS AI` }, { name: "description", content: "Analyse IA d'une demande de devis." }, { property: "og:title", content: `Analyse ${params.id} — TOUVIS AI` }, { property: "og:description", content: "Informations extraites par l'IA." }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const s = useStore();
  const nav = useNavigate();
  const r = s.quoteRequests.find((x) => x.id === id)!;
  const c = clientOf(s, r.clientId);
  const [email, setEmail] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [gen, setGen] = useState(0);
  const draftEmail = () => `Bonjour ${c.name.split(" ")[0]},\n\nMerci pour votre demande ${r.id}. Afin de finaliser votre devis, pourriez-vous nous préciser :\n${r.missing.map((m) => `- ${m.toLowerCase()}`).join("\n")}\n\nNous vous enverrons votre offre dès réception.\n\nCordialement,\n${r.owner} — TOUVIS`;
  const generateQuote = () => {
    let p = 0; setGen(1);
    const iv = setInterval(() => {
      p += 20; setGen(p);
      if (p >= 100) {
        clearInterval(iv);
        const qid = `DEV-2026-${String(100 + getState().quotes.length).padStart(3, "0")}`;
        update((st) => {
          const lines = r.lines.map((l, i) => { const prod = st.products.find((x) => x.ref === l.ref); return { id: uid("L") + i, ref: l.ref ?? "—", name: l.name, qty: l.qty ?? 1, price: prod?.price ?? 100, discount: (l.qty ?? 0) > 100 ? 5 : 0 }; });
          st.quotes = [{ id: qid, clientId: r.clientId, requestId: r.id, date: nowIso(), validity: addDays(TODAY, 30).toISOString(), sales: r.owner, lines, status: "Brouillon", sentDate: null, lastReminder: null, nextReminder: null, paused: false, archived: false, history: [{ date: nowIso(), label: `Devis généré par l'IA depuis ${r.id}`, by: "Agent Devis" }] }, ...st.quotes];
          st.quoteRequests = st.quoteRequests.map((x) => (x.id === r.id ? { ...x, analysis: "À valider", quoteStatus: "Brouillon", quoteId: qid } : x));
          log(st, { agent: "Agent Devis", module: "Devis", action: `Devis ${qid} généré`, client: c.company });
        });
        toast.success(`Devis ${qid} généré par l'IA`);
        nav({ to: "/app/devis/$id", params: { id: qid } });
      }
    }, 280);
  };
  const extracted: [string, string | null][] = [["Client", c.name], ["Société", c.company], ["Email", c.email], ["Téléphone", c.phone], ["Besoin", r.subject.split(" — ")[0]], ["Délai", r.deadline], ["Adresse", r.address], ["Infos complémentaires", r.attachments.length ? "Cahier des charges joint" : "—"]];
  return (
    <div>
      <Link to="/app/demandes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Demandes de devis</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><div className="font-mono text-xs text-primary">{r.id}</div><h1 className="text-2xl font-semibold">{r.subject}</h1><div className="mt-1 flex gap-2"><StatusBadge status={r.analysis} />{r.quoteId && <Link to="/app/devis/$id" params={{ id: r.quoteId }} className="text-xs text-primary">→ {r.quoteId}</Link>}</div></div>
        <Button className="bg-brand shadow-glow" disabled={gen > 0} onClick={generateQuote}>{gen > 0 ? <Loader2 className="animate-spin" /> : <Wand2 />}Générer le devis avec IA</Button>
      </div>
      {gen > 0 && <div className="glass mb-4 rounded-2xl p-4"><div className="mb-2 flex items-center gap-2 text-sm"><Sparkles className="size-4 text-primary" />L'IA récupère les prix Sage, les remises et les conditions…</div><Progress value={gen} className="h-1.5" /></div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={<span className="flex items-center gap-2"><Mail className="size-4 text-primary" />Email original</span>}>
          <div className="divide-y divide-border text-sm"><InfoRow label="Expéditeur" value={`${c.name} <${c.email}>`} /><InfoRow label="Objet" value={r.subject} /><InfoRow label="Date" value={fDateTime(r.date)} /></div>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-background/40 p-4 font-sans text-sm leading-relaxed text-foreground/90">{r.body}</pre>
          {r.attachments.map((a) => <button key={a} onClick={() => toast(`Ouverture de ${a}`)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary/40"><Paperclip className="size-3.5" />{a}</button>)}
        </Panel>
        <div className="space-y-4">
          <Panel title={<span className="flex items-center gap-2"><Bot className="size-4 text-primary" />Informations extraites par l'IA</span>} action={<span className="font-mono text-xs text-primary">Confiance IA : {r.confidence} %</span>}>
            <Progress value={r.confidence} className="mb-4 h-1.5" />
            <div className="grid gap-x-6 sm:grid-cols-2">{extracted.map(([l, v]) => <InfoRow key={l} label={l} value={v ?? <span className="text-warning">Non détecté</span>} />)}</div>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm"><thead className="bg-secondary/40 text-[11px] uppercase text-muted-foreground"><tr><th className="px-3 py-2 text-left">Produit</th><th className="px-3 py-2 text-left">Référence</th><th className="px-3 py-2 text-right">Quantité</th></tr></thead>
                <tbody className="divide-y divide-border">{r.lines.map((l, i) => <tr key={i}><td className="px-3 py-2">{l.name}</td><td className="px-3 py-2 font-mono text-xs text-primary">{l.ref ?? "—"}</td><td className="px-3 py-2 text-right">{l.qty ?? <span className="text-warning">?</span>}</td></tr>)}</tbody></table>
            </div>
          </Panel>
          {r.missing.length > 0 && (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
              <div className="flex items-center gap-2 font-semibold text-warning"><AlertTriangle className="size-4" />Informations manquantes</div>
              <ul className="mt-2 list-inside list-disc text-sm text-foreground/90">{r.missing.map((m) => <li key={m}>{m}</li>)}</ul>
              {email === null ? <Button size="sm" className="mt-4" onClick={() => setEmail(draftEmail())}><Sparkles />Générer une demande de complément</Button> : (
                <div className="mt-4 space-y-2">
                  {editing ? <Textarea rows={9} value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/50" /> : <pre className="whitespace-pre-wrap rounded-xl border border-border bg-background/50 p-3 font-sans text-sm">{email}</pre>}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="bg-transparent" onClick={() => setEditing(!editing)}><Pencil />{editing ? "Terminer" : "Modifier"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEmail(draftEmail().replace("Merci pour", "Nous vous remercions pour")); toast("Email régénéré"); }}><RefreshCw />Régénérer</Button>
                    <Button size="sm" onClick={() => { update((st) => { st.quoteRequests = st.quoteRequests.map((x) => (x.id === r.id ? { ...x, analysis: "En préparation" } : x)); log(st, { agent: "Agent Devis", module: "Devis", action: `Demande de complément envoyée (${r.id})`, client: c.company }); }); setEmail(null); toast.success("Demande de complément envoyée", { description: c.email }); }}><Send />Envoyer</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
