import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, CheckCircle2, Lock, Mail, MessageCircle, Paperclip, RotateCcw, Send, Share2, StickyNote, UserRound, Globe, ThumbsUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SearchInput, FilterSelect, StatusBadge, Avatar, InfoRow, EmptyState } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStore, update, clientOf, log, nowIso } from "@/lib/store";
import { fTime, fShort, mad, norm } from "@/lib/format";
import { COMMERCIAUX, type ConvStatus } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/conversations")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => ({ id: typeof s["id"] === "string" ? (s["id"] as string) : undefined }),
  head: () => ({ meta: [{ title: "Conversations — TOUVIS AI" }, { name: "description", content: "Boîte de réception unifiée WhatsApp, email, web et réseaux sociaux." }, { property: "og:title", content: "Conversations — TOUVIS AI" }, { property: "og:description", content: "Conversations clients gérées par l'IA et vos équipes." }] }),
  component: Conversations,
});

const CH_ICON = { WhatsApp: MessageCircle, Email: Mail, Web: Globe, "Réseaux sociaux": ThumbsUp };
const STATUSES: ConvStatus[] = ["Nouvelle", "Traitée par IA", "En cours", "En attente client", "Transférée humain", "Résolue", "Fermée"];

function Conversations() {
  const s = useStore();
  const { id } = Route.useSearch();
  const [sel, setSel] = useState<string>(id ?? s.conversations[0].id);
  const [q, setQ] = useState(""); const [ch, setCh] = useState("all"); const [st, setSt] = useState("all"); const [pr, setPr] = useState("all");
  const [text, setText] = useState(""); const [note, setNote] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (id) setSel(id); }, [id]);
  const list = s.conversations.filter((c) => {
    const cl = clientOf(s, c.clientId);
    return (!q || norm(`${cl.name} ${cl.company} ${c.messages.map((m) => m.text).join(" ")}`).includes(norm(q))) && (ch === "all" || c.channel === ch) && (st === "all" || c.status === st) && (pr === "all" || c.priority === pr);
  });
  const conv = s.conversations.find((c) => c.id === sel);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv?.messages.length, sel]);
  const cl = conv ? clientOf(s, conv.clientId) : null;
  const patch = (fn: (c: NonNullable<typeof conv>) => void, action: string) => update((x) => { const c = x.conversations.find((y) => y.id === sel)!; fn(c); c.updated = nowIso(); log(x, { agent: "Agent Service Client", module: "Service Client", action, client: clientOf(x, c.clientId).company }); });
  const send = () => {
    if (!text.trim()) return;
    patch((c) => { c.messages = [...c.messages, { from: note ? "note" : "agent", text, time: nowIso(), author: s.currentUser.name }]; if (!note && c.status === "Nouvelle") c.status = "En cours"; c.unread = false; }, note ? "Note interne ajoutée" : "Réponse collaborateur envoyée");
    setText(""); toast.success(note ? "Note interne ajoutée" : "Message envoyé");
  };
  const suggest = () => setText(`Bonjour ${cl?.name.split(" ")[0]}, merci pour votre message. Je vérifie la disponibilité dans Sage et je vous confirme le délai dans l'heure.`);

  return (
    <div className="glass grid h-[calc(100vh-7.5rem)] min-h-[560px] overflow-hidden rounded-2xl md:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr_300px]">
      <div className="flex min-h-0 flex-col border-r border-border">
        <div className="space-y-2 border-b border-border p-3">
          <div className="flex items-center justify-between"><h1 className="text-lg font-semibold">Conversations</h1><span className="text-xs text-muted-foreground">{list.length}</span></div>
          <div className="flex [&>div]:max-w-none"><SearchInput value={q} onChange={setQ} /></div>
          <div className="grid grid-cols-3 gap-1.5 [&_button]:min-w-0 [&_button]:text-xs">
            <FilterSelect label="Canal" options={["WhatsApp", "Email", "Web", "Réseaux sociaux"]} value={ch} onChange={setCh} />
            <FilterSelect label="Statut" options={STATUSES} value={st} onChange={setSt} />
            <FilterSelect label="Priorité" options={["Haute", "Moyenne", "Basse"]} value={pr} onChange={setPr} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.map((c) => { const x = clientOf(s, c.clientId); const I = CH_ICON[c.channel]; return (
            <button key={c.id} onClick={() => { setSel(c.id); update((st2) => { st2.conversations.find((y) => y.id === c.id)!.unread = false; }); }} className={cn("flex w-full gap-3 border-b border-border px-3 py-3 text-left transition-colors", sel === c.id ? "bg-primary/10" : "hover:bg-secondary/40")}>
              <div className="relative"><Avatar name={x.name} /><span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-background text-primary"><I className="size-2.5" /></span></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><span className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{x.name}</span><span className="shrink-0 text-[10px] text-muted-foreground">{fTime(c.updated)}</span></div>
                <div className="truncate text-[11px] text-muted-foreground">{x.company}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{c.messages[c.messages.length - 1].text}</div>
                <div className="mt-1.5 flex items-center gap-1.5"><StatusBadge status={c.status} />{c.priority === "Haute" && <StatusBadge status="Haute" />}{c.unread && <span className="ml-auto size-2 rounded-full bg-primary" />}</div>
              </div>
            </button>
          ); })}
          {!list.length && <EmptyState />}
        </div>
      </div>

      {conv && cl ? (
        <div className="flex min-h-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <div className="flex items-center gap-3"><Avatar name={cl.name} /><div><div className="text-sm font-semibold">{cl.name} · {cl.company}</div><div className="text-xs text-muted-foreground">{conv.channel} · Responsable : <span className="text-foreground">{conv.assignee}</span></div></div></div>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={conv.status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="bg-transparent"><Share2 />Transférer</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">{COMMERCIAUX.concat("Nadia Idrissi").filter((v, i, a) => a.indexOf(v) === i).map((u) => <DropdownMenuItem key={u} onSelect={() => { patch((c) => { c.assignee = u; c.status = "Transférée humain"; c.messages = [...c.messages, { from: "note", text: `Conversation transférée à ${u}`, time: nowIso(), author: "Système" }]; }, `Conversation transférée à ${u}`); toast.success(`Transférée à ${u}`); }}><UserRound />{u}</DropdownMenuItem>)}</DropdownMenuContent>
              </DropdownMenu>
              {["Résolue", "Fermée"].includes(conv.status)
                ? <Button size="sm" variant="ghost" onClick={() => { patch((c) => { c.status = "En cours"; }, "Conversation rouverte"); toast("Conversation rouverte"); }}><RotateCcw />Rouvrir</Button>
                : <Button size="sm" onClick={() => { patch((c) => { c.status = "Fermée"; }, "Conversation clôturée"); toast.success("Conversation clôturée"); }}><CheckCircle2 />Clôturer</Button>}
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {conv.messages.map((m, i) => (
              <div key={i} className={cn("flex page-enter", m.from === "client" ? "justify-start" : "justify-end")}>
                <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
                  m.from === "client" && "rounded-bl-sm border border-border bg-secondary/70",
                  m.from === "ia" && "rounded-br-sm border border-primary/30 bg-primary/10",
                  m.from === "agent" && "rounded-br-sm bg-info/20 border border-info/30",
                  m.from === "note" && "rounded-br-sm border border-dashed border-warning/40 bg-warning/10")}>
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {m.from === "ia" && <><Bot className="size-3 text-primary" />Réponse IA</>}{m.from === "agent" && <><UserRound className="size-3" />{m.author}</>}{m.from === "note" && <><Lock className="size-3 text-warning" />Note interne</>}{m.from === "client" && cl.name}
                    <span className="ml-auto normal-case">{fTime(m.time)}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="border-t border-border p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Button size="sm" variant={note ? "ghost" : "secondary"} onClick={() => setNote(false)}><Send />Réponse</Button>
              <Button size="sm" variant={note ? "secondary" : "ghost"} onClick={() => setNote(true)}><StickyNote />Note interne</Button>
              <Button size="sm" variant="ghost" className="ml-auto text-primary" onClick={suggest}><Sparkles />Suggestion IA</Button>
            </div>
            <div className="flex items-end gap-2">
              <Textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={2} placeholder={note ? "Note visible uniquement par l'équipe…" : "Écrire un message…"} className="min-h-[44px] resize-none bg-secondary/50" />
              <Button variant="ghost" size="icon" aria-label="Joindre un fichier" onClick={() => { patch((c) => { c.messages = [...c.messages, { from: "agent", text: "📎 fiche_technique_REF-1030.pdf", time: nowIso(), author: s.currentUser.name }]; }, "Pièce jointe envoyée"); toast.success("Pièce jointe envoyée"); }}><Paperclip /></Button>
              <Button onClick={send} aria-label="Envoyer"><Send />Envoyer</Button>
            </div>
          </div>
        </div>
      ) : <EmptyState title="Sélectionnez une conversation" />}

      {conv && cl && (
        <aside className="hidden min-h-0 overflow-y-auto border-l border-border p-4 xl:block">
          <div className="text-center"><Avatar name={cl.name} className="mx-auto size-14 text-base" /><div className="mt-2 font-semibold">{cl.name}</div><div className="text-xs text-muted-foreground">{cl.company}</div><Link to="/app/clients/$id" params={{ id: cl.id }} className="mt-2 inline-block text-xs text-primary">Vue 360° →</Link></div>
          <div className="mt-4 divide-y divide-border text-xs"><InfoRow label="Email" value={<span className="text-xs">{cl.email}</span>} /><InfoRow label="Téléphone" value={cl.phone} /><InfoRow label="Statut Sage" value={<StatusBadge status={cl.sage} />} /><InfoRow label="Commercial" value={cl.sales} /></div>
          <Section title="Derniers devis">{s.quotes.filter((x) => x.clientId === cl.id).slice(0, 3).map((x) => <Row key={x.id} a={x.id} b={x.status} />)}</Section>
          <Section title="Factures">{s.invoices.filter((x) => x.clientId === cl.id).slice(0, 3).map((x) => <Row key={x.id} a={x.id} b={x.status} />)}</Section>
          <Section title="Paiements">{s.invoices.filter((x) => x.clientId === cl.id && x.status === "Payée").map((x) => <div key={x.id} className="flex justify-between py-1 text-xs"><span>{fShort(x.due)}</span><span className="text-success">{mad(x.amount)}</span></div>)}</Section>
          <Section title="Conversations">{s.conversations.filter((x) => x.clientId === cl.id).map((x) => <Row key={x.id} a={`${x.id} · ${x.channel}`} b={x.status} />)}</Section>
          <Section title="Notes"><p className="text-xs text-muted-foreground">{cl.notes}</p></Section>
        </aside>
      )}
    </div>
  );
}
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="mt-4"><div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>{children}</div>;
const Row = ({ a, b }: { a: string; b: string }) => <div className="flex items-center justify-between gap-2 py-1 text-xs"><span className="truncate font-mono">{a}</span><StatusBadge status={b} /></div>;
