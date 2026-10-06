import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CheckCheck, MessageSquareReply, Pause, Play, Send, Star, Users, VolumeX } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Kpi, Panel, StatusBadge, DataTable, Th, Td, axis, chartTooltip, EmptyState } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, update, clientOf, log } from "@/lib/store";
import type { Recipient } from "@/lib/mock";

export const Route = createFileRoute("/app/campagnes/$id")({
  head: () => ({ meta: [{ title: "Analytics campagne — TOUVIS AI" }, { name: "description", content: "Performance détaillée d'une campagne." }, { property: "og:title", content: "Analytics campagne — TOUVIS AI" }, { property: "og:description", content: "Envois, réponses et intérêts." }] }),
  component: CampaignDetail,
});

const R_ST: Recipient["status"][] = ["Intéressé", "À rappeler", "Non intéressé", "Sans réponse"];
const COLORS = ["var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--steel)"];

function CampaignDetail() {
  const { id } = Route.useParams();
  const s = useStore();
  const c = s.campaigns.find((x) => x.id === id);
  if (!c) return <EmptyState title="Campagne introuvable" />;
  const perf = ["J1", "J2", "J3", "J4", "J5", "J6", "J7"].map((d, i) => ({ d, envois: c.daily[i], reponses: Math.round(c.daily[i] * 0.2) }));
  const pie = R_ST.map((st) => ({ name: st, value: c.recipients.filter((r) => r.status === st).length }));
  const rate = [{ n: "Délivrés", v: c.sent ? Math.round((c.delivered / c.sent) * 100) : 0 }, { n: "Réponses", v: c.delivered ? Math.round((c.replies / c.delivered) * 100) : 0 }, { n: "Intéressés", v: c.replies ? Math.round((c.interested / c.replies) * 100) : 0 }];
  const toggle = () => { const ns = c.status === "En cours" ? "Suspendue" : "En cours"; update((st) => { st.campaigns = st.campaigns.map((x) => (x.id === id ? { ...x, status: ns } : x)); log(st, { agent: "Agent Campagnes", module: "Campagnes", action: `${c.name} : ${ns}` }); }); toast.success(ns === "En cours" ? "Campagne relancée" : "Campagne suspendue"); };
  return (
    <div>
      <Link to="/app/campagnes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Campagnes</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">{c.name}</h1><div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><StatusBadge status={c.status} />{c.objective} · {c.channel} · {c.segment}</div></div>
        {c.status !== "Terminée" && <Button variant="outline" className="bg-transparent" onClick={toggle}>{c.status === "En cours" ? <><Pause />Suspendre</> : <><Play />Lancer / reprendre</>}</Button>}
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Contacts ciblés" value={c.contacts} icon={<Users />} />
        <Kpi label="Envoyés" value={c.sent} icon={<Send />} tone="blue" />
        <Kpi label="Délivrés" value={c.delivered} icon={<CheckCheck />} tone="green" />
        <Kpi label="Réponses" value={c.replies} icon={<MessageSquareReply />} tone="blue" />
        <Kpi label="Intéressés" value={c.interested} icon={<Star />} tone="green" />
        <Kpi label="Sans réponse" value={Math.max(0, c.delivered - c.replies)} icon={<VolumeX />} tone="steel" />
        <Kpi label="Erreurs" value={c.errors} icon={<AlertCircle />} tone="red" />
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Performance dans le temps" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={200}><AreaChart data={perf}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="d" {...axis} /><YAxis {...axis} /><Tooltip {...chartTooltip} /><Area dataKey="envois" name="Envois" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} /><Area dataKey="reponses" name="Réponses" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} /></AreaChart></ResponsiveContainer>
        </Panel>
        <Panel title="Taux (%)"><ResponsiveContainer width="100%" height={200}><BarChart data={rate}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="n" {...axis} /><YAxis {...axis} domain={[0, 100]} /><Tooltip {...chartTooltip} /><Bar dataKey="v" name="Taux" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></Panel>
        <Panel title="Statut des destinataires"><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} stroke="none">{pie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip {...chartTooltip} /></PieChart></ResponsiveContainer></Panel>
      </div>
      <DataTable count={c.recipients.length} head={<><Th>Client</Th><Th>Société</Th><Th>Statut</Th><Th>Réponse</Th><Th>Commercial</Th></>}>
        {c.recipients.map((r, i) => { const cl = clientOf(s, r.clientId); return (
          <tr key={i}>
            <Td className="font-medium">{cl.name}</Td><Td>{cl.company}</Td>
            <Td><Select value={r.status} onValueChange={(v) => { update((st) => { st.campaigns = st.campaigns.map((x) => (x.id === id ? { ...x, recipients: x.recipients.map((y, k) => (k === i ? { ...y, status: v as Recipient["status"] } : y)), interested: x.interested + (v === "Intéressé" ? 1 : r.status === "Intéressé" ? -1 : 0) } : x)); }); toast.success("Statut mis à jour"); }}><SelectTrigger className="h-8 w-40 border-none bg-transparent p-0"><StatusBadge status={r.status} /></SelectTrigger><SelectContent>{R_ST.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Td>
            <Td className="max-w-[300px] truncate text-muted-foreground">{r.reply}</Td><Td>{cl.sales}</Td>
          </tr>
        ); })}
      </DataTable>
    </div>
  );
}
