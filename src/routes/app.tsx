import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronsLeft, Command as CmdIcon, LogOut, Plus, RefreshCw, Search, Settings, User, Zap } from "lucide-react";
import { toast } from "sonner";
import { Background } from "@/components/touvis/Background";
import { Logo } from "@/components/touvis/Logo";
import { Assistant } from "@/components/touvis/Assistant";
import { NAV } from "@/components/touvis/nav";
import { Avatar } from "@/components/touvis/kit";
import { useStore, runSageSync } from "@/lib/store";
import { fTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [cmd, setCmd] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd((o) => !o); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <TooltipProvider delayDuration={150}>
      <Background />
      <div className="flex min-h-screen">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onSearch={() => setCmd(true)} />
          <main key={loc.pathname} className="page-enter mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 md:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandBar open={cmd} onOpenChange={setCmd} />
      <Assistant />
    </TooltipProvider>
  );
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const s = useStore();
  const loc = useLocation();
  const badges = {
    notif: s.notifications.filter((n) => !n.read).length,
    conv: s.conversations.filter((c) => c.status === "Nouvelle" || c.unread).length,
    relance: s.quotes.filter((q) => q.status === "À relancer").length,
  };
  return (
    <aside className={cn("sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-[width] duration-300 md:flex", collapsed ? "w-[72px]" : "w-[248px]")}>
      <div className="flex h-16 items-center justify-between px-4">
        <Link to="/app"><Logo compact={collapsed} /></Link>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 pb-4">
        {NAV.map((g) => (
          <div key={g.group}>
            {!collapsed && <div className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{g.group}</div>}
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const active = it.to === "/app" ? loc.pathname === "/app" || loc.pathname === "/app/" : loc.pathname.startsWith(it.to);
                const count = it.badge ? badges[it.badge] : 0;
                const link = (
                  <Link to={it.to} className={cn("group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] transition-all", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-secondary/50 hover:text-sidebar-foreground")}>
                    {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-primary shadow-glow" />}
                    <it.icon className={cn("size-[17px] shrink-0", active && "text-primary")} />
                    {!collapsed && <span className="truncate">{it.label}</span>}
                    {count > 0 && (collapsed ? <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" /> : <span className="ml-auto rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">{count}</span>)}
                  </Link>
                );
                return collapsed ? (
                  <Tooltip key={it.to}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{it.label}</TooltipContent></Tooltip>
                ) : <div key={it.to}>{link}</div>;
              })}
            </div>
          </div>
        ))}
      </nav>
      <button onClick={onToggle} className="m-3 flex h-9 items-center justify-center gap-2 rounded-lg border border-border text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Réduire"}
      </button>
    </aside>
  );
}

function Topbar({ onSearch }: { onSearch: () => void }) {
  const s = useStore();
  const nav = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const unread = s.notifications.filter((n) => !n.read);
  const activeAgents = s.agents.filter((a) => a.active).length;
  const sync = () => { setSyncing(true); setTimeout(() => { runSageSync(); setSyncing(false); toast.success("Synchronisation Sage terminée"); }, 1600); };
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/60 px-4 backdrop-blur-xl md:px-8">
      <div className="md:hidden"><Logo compact /></div>
      <button onClick={onSearch} className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/30 md:max-w-md">
        <Search className="size-4" /><span className="truncate">Rechercher client, facture, devis, produit…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-border px-1.5 font-mono text-[10px] sm:flex"><CmdIcon className="size-3" />K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="sm" className="hidden gap-1.5 sm:inline-flex"><Zap />Actions rapides</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => nav({ to: "/app/devis/nouveau" })}><Plus />Nouveau devis</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => nav({ to: "/app/campagnes/nouvelle" })}><Plus />Nouvelle campagne</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => nav({ to: "/app/clients", search: { new: true } as never })}><Plus />Nouveau client</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => nav({ to: "/app/faq" })}><Plus />Nouvelle FAQ</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={sync}><RefreshCw />Synchroniser Sage</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={sync} className="hidden h-9 items-center gap-2 rounded-lg border border-success/25 bg-success/10 px-3 text-xs font-medium text-success lg:flex">
              <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />{syncing ? "Synchronisation…" : `Sage · ${fTime(s.sage.lastSync)}`}
            </button>
          </TooltipTrigger>
          <TooltipContent>Sage connecté — cliquer pour synchroniser</TooltipContent>
        </Tooltip>
        <Link to="/app" className="hidden h-9 items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 text-xs font-medium text-primary xl:flex">
          <span className="size-1.5 rounded-full bg-primary pulse-dot" />{activeAgents}/6 agents actifs
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell />{unread.length > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{unread.length}</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications non lues</DropdownMenuLabel>
            {unread.slice(0, 5).map((n) => (
              <DropdownMenuItem key={n.id} onSelect={() => nav({ to: n.link })} className="flex-col items-start gap-0.5">
                <span className="text-sm font-medium">{n.title}</span><span className="text-xs text-muted-foreground">{n.body}</span>
              </DropdownMenuItem>
            ))}
            {unread.length === 0 && <div className="px-2 py-3 text-xs text-muted-foreground">Tout est lu.</div>}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => nav({ to: "/app/notifications" })} className="justify-center text-primary">Voir toutes les notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button aria-label="Profil" className="flex items-center gap-2 rounded-lg p-1 hover:bg-secondary/50"><Avatar name={s.currentUser.name} /><span className="hidden text-left text-xs leading-tight lg:block"><span className="block font-medium text-foreground">{s.currentUser.name}</span><span className="text-muted-foreground">{s.currentUser.role}</span></span></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>{s.currentUser.email}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => nav({ to: "/app/parametres" })}><User />Mon profil</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => nav({ to: "/app/parametres" })}><Settings />Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { toast("Vous êtes déconnecté"); nav({ to: "/" }); }}><LogOut />Se déconnecter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function CommandBar({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useStore();
  const nav = useNavigate();
  const go = (to: string) => { onOpenChange(false); nav({ to }); };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher une page, un client, une facture, un devis…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Pages">
          {NAV.flatMap((g) => g.items).map((it) => <CommandItem key={it.to} onSelect={() => go(it.to)}><it.icon />{it.label}</CommandItem>)}
        </CommandGroup>
        <CommandGroup heading="Clients">
          {s.clients.map((c) => <CommandItem key={c.id} value={`${c.company} ${c.name}`} onSelect={() => go(`/app/clients/${c.id}`)}>{c.company}<span className="ml-auto text-xs text-muted-foreground">{c.name}</span></CommandItem>)}
        </CommandGroup>
        <CommandGroup heading="Devis">
          {s.quotes.map((q) => <CommandItem key={q.id} onSelect={() => go(`/app/devis/${q.id}`)}>{q.id}<span className="ml-auto text-xs text-muted-foreground">{q.status}</span></CommandItem>)}
        </CommandGroup>
        <CommandGroup heading="Factures">
          {s.invoices.map((i) => <CommandItem key={i.id} onSelect={() => go(`/app/recouvrement`)}>{i.id}<span className="ml-auto text-xs text-muted-foreground">{i.status}</span></CommandItem>)}
        </CommandGroup>
        <CommandGroup heading="Produits">
          {s.products.map((p) => <CommandItem key={p.id} value={`${p.ref} ${p.name}`} onSelect={() => go(`/app/stocks`)}>{p.ref} — {p.name}</CommandItem>)}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
