import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getState, stockStatus, clientOf } from "@/lib/store";
import { mad, daysTo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Msg = { from: "user" | "ai"; text: string; action?: { label: string; to: string } };

const SUGGESTIONS = [
  "Quels clients dois-je relancer aujourd'hui ?",
  "Quels produits sont sous le seuil ?",
  "Quels devis sont à relancer ?",
  "Résume-moi les conversations urgentes.",
  "Quels devis ont été acceptés cette semaine ?",
  "Prépare une campagne pour les clients inactifs.",
];

function answer(q: string): Msg {
  const s = getState(); const t = q.toLowerCase();
  if (t.includes("client") && t.includes("relancer")) {
    const inv = s.invoices.filter((i) => ["Échue", "En retard"].includes(i.status));
    const names = [...new Set(inv.map((i) => clientOf(s, i.clientId).company))].slice(0, 5);
    return { from: "ai", text: `**${inv.length} factures** échues sont à relancer, pour ${mad(inv.reduce((a, i) => a + i.remaining, 0))}.\nPriorités : ${names.join(", ")}.`, action: { label: "Voir le recouvrement", to: "/app/recouvrement" } };
  }
  if (t.includes("produit") || t.includes("seuil") || t.includes("stock")) {
    const p = s.products.filter((x) => stockStatus(x) === "Rupture" || stockStatus(x) === "Seuil atteint");
    return { from: "ai", text: `**${p.length} produits** sont sous le seuil ou en rupture :\n${p.slice(0, 5).map((x) => `• ${x.ref} — ${x.name} (${x.stock}/${x.threshold})`).join("\n")}`, action: { label: "Voir les stocks", to: "/app/stocks" } };
  }
  if (t.includes("accept")) {
    const a = s.quotes.filter((x) => x.status === "Accepté");
    return { from: "ai", text: `**${a.length} devis** ont été acceptés cette semaine : ${a.map((x) => x.id).join(", ")}.`, action: { label: "Voir les devis", to: "/app/devis" } };
  }
  if (t.includes("devis")) {
    const r = s.quotes.filter((x) => ["À relancer", "Envoyé"].includes(x.status) && x.nextReminder && daysTo(x.nextReminder) <= 0);
    const n = Math.max(r.length, s.quotes.filter((x) => x.status === "À relancer").length);
    return { from: "ai", text: `**${n} devis doivent être relancés aujourd'hui.** La séquence J+3 / J+7 / J+10 est prête.`, action: { label: "Voir les devis", to: "/app/relances" } };
  }
  if (t.includes("conversation") || t.includes("urgent")) {
    const c = s.conversations.filter((x) => x.priority === "Haute" && !["Résolue", "Fermée"].includes(x.status));
    return { from: "ai", text: `**${c.length} conversations urgentes** ouvertes :\n${c.slice(0, 4).map((x) => `• ${clientOf(s, x.clientId).company} (${x.channel}) — ${x.messages[0].text.slice(0, 60)}…`).join("\n")}`, action: { label: "Ouvrir les conversations", to: "/app/conversations" } };
  }
  if (t.includes("campagne") || t.includes("inactif")) {
    const n = s.clients.filter((c) => c.status === "Inactif").length;
    return { from: "ai", text: `J'ai identifié **${n} clients inactifs**. Je propose une campagne « Réactivation » par email avec une remise de 8 % sur la boulonnerie.`, action: { label: "Créer la campagne", to: "/app/campagnes/nouvelle" } };
  }
  return { from: "ai", text: "Je peux vous aider sur le recouvrement, les stocks, les devis, les conversations et les campagnes. Essayez une des suggestions ci-dessous." };
}

function Rich({ text }: { text: string }) {
  return <>{text.split("\n").map((line, i) => <p key={i} className="leading-relaxed">{line.split(/\*\*(.+?)\*\*/g).map((p, k) => (k % 2 ? <strong key={k} className="text-primary">{p}</strong> : p))}</p>)}</>;
}

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "ai", text: "Bonjour Mounir 👋 Je suis **TOUVIS AI**. Je supervise vos 6 agents connectés à Sage. Que voulez-vous savoir ?" }]);
  const nav = useNavigate();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { from: "user", text: q }]); setInput(""); setTyping(true);
    setTimeout(() => { setTyping(false); setMsgs((m) => [...m, answer(q)]); }, 750);
  };
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Ouvrir l'assistant TOUVIS AI" className="float-glow fixed bottom-6 right-6 z-40 grid size-14 place-items-center rounded-full bg-brand text-primary-foreground transition-transform hover:scale-105">
        <Sparkles className="size-6" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="glass flex w-full flex-col gap-0 border-l border-border p-0 sm:max-w-md [&>button]:hidden">
          <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-brand text-primary-foreground"><Bot className="size-5" /></div>
              <div>
                <SheetTitle className="text-base">Assistant TOUVIS AI</SheetTitle>
                <div className="flex items-center gap-1.5 text-xs text-success"><span className="size-1.5 rounded-full bg-success pulse-dot" />6 agents connectés</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fermer"><X /></Button>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={cn("max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm page-enter", m.from === "user" ? "ml-auto bg-primary text-primary-foreground" : "border border-border bg-secondary/60 text-foreground")}>
                <Rich text={m.text} />
                {m.action && <Button size="sm" className="mt-2.5" onClick={() => { setOpen(false); nav({ to: m.action!.to }); }}>{m.action.label}</Button>}
              </div>
            ))}
            {typing && <div className="flex w-16 gap-1 rounded-2xl border border-border bg-secondary/60 px-3.5 py-3">{[0, 1, 2].map((k) => <span key={k} className="size-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${k * 120}ms` }} />)}</div>}
            <div ref={end} />
          </div>
          <div className="border-t border-border p-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] text-primary transition-colors hover:bg-primary/15">{s}</button>)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez une question…" className="bg-secondary/50" />
              <Button type="submit" size="icon" aria-label="Envoyer"><Send /></Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
