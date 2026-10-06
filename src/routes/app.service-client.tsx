import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Clock, Headset, HelpCircle, Library, MessagesSquare, Settings2, UserRoundCheck, Gauge } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Kpi, Panel, StatusBadge, Avatar } from "@/components/touvis/kit";
import { Switch } from "@/components/ui/switch";
import { useStore, update, clientOf, log } from "@/lib/store";
import { fDateTime } from "@/lib/format";

export const Route = createFileRoute("/app/service-client")({
  head: () => ({ meta: [{ title: "Agent IA Service Client — TOUVIS AI" }, { name: "description", content: "Assistant client 24/7 multicanal relié à la base de connaissances TOUVIS." }, { property: "og:title", content: "Agent IA Service Client — TOUVIS AI" }, { property: "og:description", content: "Conversations, FAQ et base de connaissances." }] }),
  component: Service,
});

function Service() {
  const s = useStore();
  const a = s.agents.find((x) => x.id === "service")!;
  const handled = s.conversations.filter((c) => c.status !== "Nouvelle").length;
  const aiResolved = s.conversations.filter((c) => c.assignee === "Agent IA" && ["Résolue", "Fermée", "Traitée par IA"].includes(c.status)).length;
  const transfers = s.conversations.filter((c) => c.assignee !== "Agent IA").length;
  const tiles = [
    { to: "/app/conversations", icon: MessagesSquare, title: "Conversations", text: `${s.conversations.filter((c) => !["Résolue", "Fermée"].includes(c.status)).length} ouvertes` },
    { to: "/app/faq", icon: HelpCircle, title: "FAQ", text: `${s.faqs.filter((f) => f.active).length} réponses actives` },
    { to: "/app/connaissances", icon: Library, title: "Base de connaissances", text: `${s.docs.length} documents indexés` },
    { to: "/app/agent-parametres", icon: Settings2, title: "Paramètres agent", text: `Ton ${s.serviceAgent.tone}` },
  ];
  return (
    <div>
      <PageHeader icon={<Headset />} eyebrow="Agent IA" title="Service Client" subtitle="Un assistant disponible 24/7 sur WhatsApp, email, web et réseaux sociaux." />
      <div className="glass mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative grid size-14 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-glow"><Bot className="size-7" /></div>
          <div><div className="font-display text-lg font-semibold">{s.serviceAgent.name}</div><div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><StatusBadge status={a.active ? "Actif" : "Pause"} />Dernière activité : {fDateTime(s.conversations[0].updated)}</div></div>
        </div>
        <label className="flex items-center gap-3 text-sm">{a.active ? "Agent actif" : "Agent en pause"}<Switch checked={a.active} onCheckedChange={(v) => { update((st) => { st.agents = st.agents.map((x) => (x.id === "service" ? { ...x, active: v } : x)); log(st, { agent: a.name, module: "Service Client", action: v ? "Agent activé" : "Agent mis en pause" }); }); toast.success(v ? "Agent activé" : "Agent en pause"); }} /></label>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Conversations traitées" value={handled * 48} icon={<MessagesSquare />} hint="30 derniers jours" />
        <Kpi label="Taux de résolution IA" value={Math.round((aiResolved / Math.max(1, handled)) * 100)} format={(n) => `${Math.round(n)} %`} icon={<Gauge />} tone="green" />
        <Kpi label="Temps moyen de réponse" value={14} format={(n) => `${Math.round(n)} s`} icon={<Clock />} tone="blue" />
        <Kpi label="Transferts humains" value={transfers} icon={<UserRoundCheck />} tone="amber" />
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => <Link key={t.to} to={t.to} className="glass glass-hover rounded-2xl p-5"><t.icon className="size-6 text-primary" /><div className="mt-3 font-display font-semibold">{t.title}</div><div className="text-sm text-muted-foreground">{t.text}</div></Link>)}
      </div>
      <Panel title="Dernières conversations" action={<Link to="/app/conversations" className="text-xs text-primary">Tout voir</Link>} bodyClass="p-0">
        <ul className="divide-y divide-border">
          {s.conversations.slice(0, 6).map((c) => { const cl = clientOf(s, c.clientId); return (
            <li key={c.id}><Link to="/app/conversations" search={{ id: c.id }} className="flex items-center gap-3 px-5 py-3 hover:bg-primary/[0.04]"><Avatar name={cl.name} /><div className="min-w-0 flex-1"><div className="text-sm font-medium">{cl.company} <span className="text-xs text-muted-foreground">· {c.channel}</span></div><div className="truncate text-xs text-muted-foreground">{c.messages[c.messages.length - 1].text}</div></div><StatusBadge status={c.status} /></Link></li>
          ); })}
        </ul>
      </Panel>
    </div>
  );
}
