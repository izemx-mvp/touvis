import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Bot, Boxes, CheckCircle2, FileInput, FileText, Headset, Megaphone, MessagesSquare, PackageX, Repeat, Settings2, Sparkles, Wallet, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Kpi, Panel, PageHeader, StatusBadge, axis, chartTooltip } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useStore, update, stockStatus, log } from "@/lib/store";
import { mad, fDateTime } from "@/lib/format";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Tableau de bord — TOUVIS AI" }, { name: "description", content: "Vue d'ensemble des 6 agents IA TOUVIS connectés à Sage." }, { property: "og:title", content: "Tableau de bord — TOUVIS AI" }, { property: "og:description", content: "KPI, alertes et activité des agents IA." }] }),
  component: Dashboard,
});

const AGENT_ICONS: Record<string, typeof Wallet> = { recouvrement: Wallet, stock: Boxes, service: Headset, devis: FileText, relance: Repeat, campagnes: Megaphone };
const C = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--steel)"];
const MONTHS = ["Mai", "Juin", "Juil", "Août", "Sept", "Oct"];

function Dashboard() {
  const s = useStore();
  const nav = useNavigate();
  const unpaid = s.invoices.filter((i) => i.status !== "Payée");
  const toCollect = unpaid.reduce((a, i) => a + i.remaining, 0);
  const under = s.products.filter((p) => ["Seuil atteint", "Stock faible"].includes(stockStatus(p))).length;
  const out = s.products.filter((p) => p.stock === 0).length;
  const openConv = s.conversations.filter((c) => !["Résolue", "Fermée"].includes(c.status)).length;
  const aiConv = s.conversations.filter((c) => c.assignee === "Agent IA").length;
  const newReq = s.quoteRequests.filter((r) => ["Nouvelle", "Analyse IA"].includes(r.analysis)).length;
  const toRelance = s.quotes.filter((q) => q.status === "À relancer").length;
  const accepted = s.quotes.filter((q) => q.status === "Accepté" || q.status === "Transformé en commande").length;
  const activeCamp = s.campaigns.filter((c) => c.status === "En cours").length;

  const invByStatus = ["À venir", "Proche échéance", "Échue", "En retard", "Relancée", "Payée"].map((st) => ({ name: st, value: s.invoices.filter((i) => i.status === st).length }));
  const recov = MONTHS.map((m, i) => ({ m, recouvre: [410, 455, 390, 520, 610, 0][i] * 1000 + (i === 5 ? s.invoices.filter((x) => x.status === "Payée").reduce((a, x) => a + x.amount, 0) : 0), du: [620, 640, 590, 700, 760, 0][i] * 1000 + (i === 5 ? toCollect : 0) }));
  const stockEvo = Array.from({ length: 12 }, (_, i) => ({ w: `S${i + 30}`, total: s.products.reduce((a, p) => a + p.history[i], 0) }));
  const convDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d, i) => ({ d, ia: [42, 51, 47, 60, 55, 28, 14][i], humain: [9, 12, 8, 14, 11, 4, 2][i] }));
  const split = [{ name: "IA", value: aiConv }, { name: "Humain", value: s.conversations.length - aiConv }];
  const funnel = [
    { name: "Demandes", value: s.quoteRequests.length * 6, fill: C[0] },
    { name: "Devis", value: s.quotes.length * 4, fill: C[1] },
    { name: "Acceptés", value: accepted * 9, fill: C[2] },
  ];
  const campPerf = s.campaigns.filter((c) => c.sent).map((c) => ({ name: c.name.split(" — ")[0].slice(0, 16), reponses: c.replies, interesses: c.interested }));

  return (
    <div>
      <PageHeader eyebrow="Mardi 6 octobre 2026" title="Bonjour, voici votre plateforme TOUVIS AI" subtitle="Vos 6 agents IA travaillent ensemble autour de Sage. Voici leur activité en temps réel."
        actions={<Button className="bg-brand shadow-glow" onClick={() => nav({ to: "/app/notifications" })}><Sparkles />{s.notifications.filter((n) => !n.read).length} nouveautés</Button>} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {s.agents.map((a) => {
          const I = AGENT_ICONS[a.id];
          return (
            <div key={a.id} className="glass glass-hover group relative overflow-hidden rounded-2xl p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-brand opacity-60" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><I className="size-5" /></div>
                  <div>
                    <div className="font-display text-[15px] font-semibold">{a.name}</div>
                    <StatusBadge status={a.active ? "Actif" : "Pause"} className="mt-1" />
                  </div>
                </div>
                <Switch checked={a.active} aria-label="Activer l'agent" onCheckedChange={(v) => { update((st) => { st.agents = st.agents.map((x) => (x.id === a.id ? { ...x, active: v } : x)); log(st, { agent: a.name, module: "Agents", action: v ? "Agent activé" : "Agent mis en pause" }); }); toast.success(`${a.name} ${v ? "activé" : "en pause"}`); }} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{a.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-secondary/30 p-2.5"><div className="text-[11px] text-muted-foreground">Tâches effectuées</div><div className="font-display text-lg font-semibold">{a.tasks.toLocaleString("fr-FR")}</div></div>
                <div className="rounded-xl border border-border bg-secondary/30 p-2.5">
                  <div className="text-[11px] text-muted-foreground">Taux de réussite</div>
                  <div className="flex items-center gap-2"><span className="font-display text-lg font-semibold">{a.success}%</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-brand" style={{ width: `${a.success}%` }} /></div></div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Bot className="size-3.5 text-primary" />{a.recent}</div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => nav({ to: a.route })}>Voir l'agent</Button>
                <Button size="sm" variant="outline" className="bg-transparent" onClick={() => nav({ to: a.configRoute })}><Settings2 />Configurer</Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Factures impayées" value={unpaid.length} icon={<Receipt />} tone="red" to="/app/recouvrement" />
        <Kpi label="Montant à recouvrer" value={toCollect} format={mad} icon={<Wallet />} tone="amber" to="/app/recouvrement" />
        <Kpi label="Produits sous seuil" value={under} icon={<AlertTriangle />} tone="amber" to="/app/stocks" />
        <Kpi label="Produits en rupture" value={out} icon={<PackageX />} tone="red" to="/app/stocks" />
        <Kpi label="Conversations ouvertes" value={openConv} icon={<MessagesSquare />} tone="blue" to="/app/conversations" />
        <Kpi label="Traitées par IA" value={aiConv} icon={<Bot />} tone="cyan" to="/app/conversations" />
        <Kpi label="Nouvelles demandes de devis" value={newReq} icon={<FileInput />} tone="cyan" to="/app/demandes" />
        <Kpi label="Devis à relancer" value={toRelance} icon={<Repeat />} tone="amber" to="/app/relances" />
        <Kpi label="Devis acceptés" value={accepted} icon={<CheckCircle2 />} tone="green" to="/app/devis" />
        <Kpi label="Campagnes actives" value={activeCamp} icon={<Megaphone />} tone="blue" to="/app/campagnes" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Évolution du recouvrement" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={recov}>
              <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="m" {...axis} /><YAxis {...axis} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip {...chartTooltip} formatter={(v: number) => mad(v)} />
              <Area dataKey="du" name="Dû" stroke="var(--chart-2)" fill="transparent" strokeDasharray="4 4" />
              <Area dataKey="recouvre" name="Recouvré" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gr)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Factures par statut">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={invByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">{invByStatus.map((_, i) => <Cell key={i} fill={C[i]} />)}</Pie><Tooltip {...chartTooltip} /></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">{invByStatus.map((x, i) => <span key={x.name} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: C[i] }} />{x.name} ({x.value})</span>)}</div>
        </Panel>
        <Panel title="Évolution du stock (unités)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stockEvo}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="w" {...axis} /><YAxis {...axis} /><Tooltip {...chartTooltip} /><Line dataKey="total" name="Stock" stroke="var(--chart-1)" strokeWidth={2} dot={false} /></LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Alertes stock" action={<Link to="/app/stocks" className="text-xs text-primary">Tout voir</Link>} bodyClass="p-0">
          <ul className="divide-y divide-border">
            {s.stockAlerts.filter((a) => !a.treated).slice(0, 5).map((a) => { const p = s.products.find((x) => x.id === a.productId)!; return (
              <li key={a.id} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm"><div className="min-w-0"><div className="truncate font-medium">{p.name}</div><div className="font-mono text-[11px] text-muted-foreground">{p.ref} · {p.stock}/{p.threshold}</div></div><StatusBadge status={stockStatus(p)} /></li>
            ); })}
          </ul>
        </Panel>
        <Panel title="Conversations par jour">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={convDays}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="d" {...axis} /><YAxis {...axis} /><Tooltip {...chartTooltip} /><Bar dataKey="ia" name="IA" stackId="a" fill="var(--chart-1)" /><Bar dataKey="humain" name="Humain" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Répartition IA / humain">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={split} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} stroke="none"><Cell fill="var(--chart-1)" /><Cell fill="var(--chart-2)" /></Pie><Tooltip {...chartTooltip} /></PieChart>
          </ResponsiveContainer>
          <div className="text-center text-sm text-muted-foreground"><span className="font-display text-xl font-semibold text-primary">{Math.round((aiConv / s.conversations.length) * 100)}%</span> des conversations gérées par l'IA</div>
        </Panel>
        <Panel title="Funnel demandes → devis → acceptation">
          <ResponsiveContainer width="100%" height={220}>
            <FunnelChart><Tooltip {...chartTooltip} /><Funnel dataKey="value" data={funnel} isAnimationActive><LabelList position="center" fill="var(--primary-foreground)" stroke="none" dataKey="name" fontSize={12} /></Funnel></FunnelChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Performance des campagnes">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={campPerf} layout="vertical"><XAxis type="number" {...axis} /><YAxis type="category" dataKey="name" width={110} {...axis} /><Tooltip {...chartTooltip} /><Bar dataKey="reponses" name="Réponses" fill="var(--chart-2)" radius={4} /><Bar dataKey="interesses" name="Intéressés" fill="var(--chart-1)" radius={4} /></BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Activité récente des agents" action={<Link to="/app/historique" className="text-xs text-primary">Historique</Link>} bodyClass="p-0">
          <ul className="divide-y divide-border">
            {s.logs.slice(0, 7).map((l) => (
              <li key={l.id} className="flex gap-3 px-5 py-2.5"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary shadow-glow" /><div className="min-w-0 text-sm"><div className="truncate">{l.action}{l.client !== "—" && <span className="text-muted-foreground"> · {l.client}</span>}</div><div className="text-[11px] text-muted-foreground">{l.agent} · {fDateTime(l.date)}</div></div></li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
