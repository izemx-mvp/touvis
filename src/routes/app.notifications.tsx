import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Boxes, CheckCheck, ExternalLink, FileText, Headset, Megaphone, Settings, Wallet, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "@/components/touvis/kit";
import { Button } from "@/components/ui/button";
import { useStore, update } from "@/lib/store";
import type { NotifCategory } from "@/lib/mock";
import { fDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — TOUVIS AI" }, { name: "description", content: "Centre de notifications des agents IA." }, { property: "og:title", content: "Notifications — TOUVIS AI" }, { property: "og:description", content: "Alertes et évènements des agents." }] }),
  component: Notifications,
});

const CATS: { k: NotifCategory; icon: typeof Bell }[] = [{ k: "Recouvrement", icon: Wallet }, { k: "Stock", icon: Boxes }, { k: "Service Client", icon: Headset }, { k: "Devis", icon: FileText }, { k: "Campagnes", icon: Megaphone }, { k: "Système", icon: Settings }];

function Notifications() {
  const s = useStore();
  const nav = useNavigate();
  const [cat, setCat] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const list = s.notifications.filter((n) => (cat === "all" || n.category === cat) && (!unreadOnly || !n.read));
  const read = (id: string) => update((st) => { st.notifications = st.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)); });
  return (
    <div>
      <PageHeader icon={<Bell />} title="Notifications" subtitle={`${s.notifications.filter((n) => !n.read).length} non lues`} actions={<Button variant="outline" className="bg-transparent" onClick={() => { update((st) => { st.notifications = st.notifications.map((n) => ({ ...n, read: true })); }); toast.success("Toutes les notifications sont lues"); }}><CheckCheck />Tout marquer comme lu</Button>} />
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>Toutes</Chip>
        {CATS.map((c) => <Chip key={c.k} active={cat === c.k} onClick={() => setCat(c.k)}><c.icon className="size-3.5" />{c.k} <span className="opacity-60">{s.notifications.filter((n) => n.category === c.k && !n.read).length || ""}</span></Chip>)}
        <Chip active={unreadOnly} onClick={() => setUnreadOnly(!unreadOnly)} className="ml-auto">Non lues uniquement</Chip>
      </div>
      <div className="glass divide-y divide-border overflow-hidden rounded-2xl">
        {list.map((n) => { const I = CATS.find((c) => c.k === n.category)!.icon; return (
          <div key={n.id} className={cn("flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-primary/[0.04]", !n.read && "bg-primary/[0.05]")}>
            <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl border", n.read ? "border-border text-muted-foreground" : "border-primary/30 bg-primary/10 text-primary")}><I className="size-4" /></div>
            <div className="min-w-0 flex-1"><div className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</div><div className="truncate text-xs text-muted-foreground">{n.body} · {fDateTime(n.date)}</div></div>
            {!n.read && <span className="size-2 rounded-full bg-primary shadow-glow" />}
            <Button size="sm" variant="ghost" onClick={() => { read(n.id); nav({ to: n.link }); }}><ExternalLink />Ouvrir</Button>
            {!n.read && <Button size="sm" variant="ghost" onClick={() => read(n.id)}><Check />Lu</Button>}
          </div>
        ); })}
        {!list.length && <EmptyState title="Aucune notification" />}
      </div>
    </div>
  );
}
const Chip = ({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => <button onClick={onClick} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all", active ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground", className)}>{children}</button>;
