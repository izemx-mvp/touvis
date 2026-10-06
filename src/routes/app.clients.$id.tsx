import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Phone, MapPin, Wallet, FileText, MessagesSquare } from "lucide-react";
import { Panel, StatusBadge, Avatar, Timeline, Kpi, EmptyState } from "@/components/touvis/kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, quoteTotals } from "@/lib/store";
import type { TimelineEvent } from "@/lib/mock";
import { fDate, mad } from "@/lib/format";

export const Route = createFileRoute("/app/clients/$id")({
  head: () => ({ meta: [{ title: "Fiche client 360° — TOUVIS AI" }, { name: "description", content: "Toute l'histoire d'un client en un seul écran." }, { property: "og:title", content: "Fiche client 360° — TOUVIS AI" }, { property: "og:description", content: "Vue 360° client." }] }),
  component: Client360,
});

const Row = ({ a, b, c, d, to }: { a: string; b: string; c?: string; d: string; to?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 text-sm last:border-0"><div className="min-w-0"><div className="font-mono text-xs text-primary">{to ?? a}</div><div className="truncate text-muted-foreground">{b}</div></div><div className="flex shrink-0 items-center gap-3">{c && <span className="tabular-nums">{c}</span>}<StatusBadge status={d} /></div></div>
);

function Client360() {
  const { id } = Route.useParams();
  const s = useStore();
  const c = s.clients.find((x) => x.id === id);
  if (!c) return <EmptyState title="Client introuvable" />;
  const inv = s.invoices.filter((i) => i.clientId === id);
  const qs = s.quotes.filter((q) => q.clientId === id);
  const reqs = s.quoteRequests.filter((r) => r.clientId === id);
  const convs = s.conversations.filter((x) => x.clientId === id);
  const camps = s.campaigns.filter((x) => x.recipients.some((r) => r.clientId === id));
  const logs = s.logs.filter((l) => l.client === c.company);
  const events: TimelineEvent[] = [
    ...reqs.map((r) => ({ date: r.date, label: `Demande de devis reçue (${r.id})`, by: "Agent Devis" })),
    ...qs.flatMap((q) => q.history.map((h) => ({ ...h, label: `${q.id} — ${h.label}` }))),
    ...inv.flatMap((i) => i.history.map((h) => ({ ...h, label: `${i.id} — ${h.label}` }))),
    ...convs.map((x) => ({ date: x.updated, label: `Conversation ${x.channel} — ${x.status}`, channel: x.channel })),
  ];
  return (
    <div>
      <Link to="/app/clients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Clients</Link>
      <div className="glass mb-6 flex flex-wrap items-center gap-5 rounded-2xl p-6">
        <Avatar name={c.name} className="size-16 text-lg" />
        <div className="flex-1"><h1 className="text-2xl font-semibold">{c.company}</h1><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"><span>{c.name}</span><span className="flex items-center gap-1"><Mail className="size-3.5" />{c.email}</span><span className="flex items-center gap-1"><Phone className="size-3.5" />{c.phone}</span><span className="flex items-center gap-1"><MapPin className="size-3.5" />{c.city} · {c.sector}</span></div></div>
        <div className="flex gap-2"><StatusBadge status={c.status} /><StatusBadge status={c.sage} /></div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Chiffre d'affaires" value={c.ca} format={mad} icon={<Wallet />} />
        <Kpi label="Encours" value={inv.reduce((a, i) => a + i.remaining, 0)} format={mad} icon={<Wallet />} tone="amber" />
        <Kpi label="Devis" value={qs.length} icon={<FileText />} tone="blue" />
        <Kpi label="Conversations" value={convs.length} icon={<MessagesSquare />} tone="cyan" />
      </div>
      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start">{["overview:Vue générale", "conv:Conversations", "req:Demandes de devis", "quotes:Devis", "inv:Factures", "pay:Paiements", "rel:Relances", "camp:Campagnes", "hist:Historique"].map((x) => { const [v, l] = x.split(":"); return <TabsTrigger key={v} value={v}>{l}</TabsTrigger>; })}</TabsList>
        <TabsContent value="overview"><div className="grid gap-4 lg:grid-cols-[1fr_360px]"><Panel title="Timeline 360°">{events.length ? <Timeline events={events} /> : <EmptyState title="Aucune activité" text="" />}</Panel><Panel title="Informations"><div className="space-y-2 text-sm"><div><span className="text-muted-foreground">Commercial :</span> {c.sales}</div><div><span className="text-muted-foreground">Dernière activité :</span> {fDate(c.lastActivity)}</div><div className="text-muted-foreground">{c.notes}</div></div></Panel></div></TabsContent>
        <TabsContent value="conv"><Panel>{convs.map((x) => <Row key={x.id} a={x.id} to={<Link to="/app/conversations" search={{ id: x.id }}>{x.id} · {x.channel}</Link>} b={x.messages[x.messages.length - 1].text} d={x.status} />)}{!convs.length && <EmptyState />}</Panel></TabsContent>
        <TabsContent value="req"><Panel>{reqs.map((r) => <Row key={r.id} a={r.id} to={<Link to="/app/demandes/$id" params={{ id: r.id }}>{r.id}</Link>} b={r.subject} d={r.analysis} />)}{!reqs.length && <EmptyState />}</Panel></TabsContent>
        <TabsContent value="quotes"><Panel>{qs.map((q) => <Row key={q.id} a={q.id} to={<Link to="/app/devis/$id" params={{ id: q.id }}>{q.id}</Link>} b={fDate(q.date)} c={mad(quoteTotals(q.lines).ttc)} d={q.status} />)}{!qs.length && <EmptyState />}</Panel></TabsContent>
        <TabsContent value="inv"><Panel>{inv.map((i) => <Row key={i.id} a={i.id} b={`Échéance ${fDate(i.due)}`} c={mad(i.amount)} d={i.status} />)}{!inv.length && <EmptyState />}</Panel></TabsContent>
        <TabsContent value="pay"><Panel>{inv.filter((i) => i.status === "Payée" || i.remaining < i.amount).map((i) => <Row key={i.id} a={i.id} b="Paiement rapproché dans Sage" c={mad(i.amount - i.remaining)} d="Succès" />)}{!inv.some((i) => i.remaining < i.amount) && <EmptyState title="Aucun paiement" text="" />}</Panel></TabsContent>
        <TabsContent value="rel"><Panel>{[...inv.flatMap((i) => i.history.filter((h) => h.channel).map((h) => ({ ...h, label: `${i.id} — ${h.label}` }))), ...qs.flatMap((q) => q.history.filter((h) => h.label.includes("Relance")).map((h) => ({ ...h, label: `${q.id} — ${h.label}` })))].length ? <Timeline events={[...inv.flatMap((i) => i.history.filter((h) => h.channel).map((h) => ({ ...h, label: `${i.id} — ${h.label}` }))), ...qs.flatMap((q) => q.history.filter((h) => h.label.includes("Relance")).map((h) => ({ ...h, label: `${q.id} — ${h.label}` })))]} /> : <EmptyState />}</Panel></TabsContent>
        <TabsContent value="camp"><Panel>{camps.map((x) => <Row key={x.id} a={x.id} to={<Link to="/app/campagnes/$id" params={{ id: x.id }}>{x.name}</Link>} b={x.channel} d={x.recipients.find((r) => r.clientId === id)!.status} />)}{!camps.length && <EmptyState />}</Panel></TabsContent>
        <TabsContent value="hist"><Panel>{logs.map((l) => <Row key={l.id} a={fDate(l.date)} b={`${l.action} · ${l.agent}`} d={l.result} />)}{!logs.length && <EmptyState />}</Panel></TabsContent>
      </Tabs>
    </div>
  );
}
