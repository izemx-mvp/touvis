import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Boxes, Eye, EyeOff, FileText, Headset, Loader2, Lock, Mail, Megaphone, Repeat, Wallet } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/login-hero.jpg";
import { Background } from "@/components/touvis/Background";
import { Logo } from "@/components/touvis/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { update } from "@/lib/store";
import { ROLES, type Role } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — TOUVIS AI Platform" },
      { name: "description", content: "Connectez-vous à la plateforme d'agents IA TOUVIS, intégrée à Sage." },
      { property: "og:title", content: "Connexion — TOUVIS AI Platform" },
      { property: "og:description", content: "Six agents IA métier pour automatiser recouvrement, stock, service client, devis et campagnes." },
    ],
  }),
  component: Login,
});

const AGENTS = [Wallet, Boxes, Headset, FileText, Repeat, Megaphone];
const NAMES: Record<Role, string> = { Administrateur: "Mounir Touzani", Commercial: "Youssef Alami", Finance: "Leila Amrani", "Service Client": "Nadia Idrissi", "Responsable Stock": "Othmane Kabbaj" };

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("mounir.touzani@touvis.ma");
  const [pwd, setPwd] = useState("touvis2026");
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<Role>("Administrateur");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || pwd.length < 4) { toast.error("Identifiants invalides", { description: "Vérifiez votre email et votre mot de passe." }); return; }
    setLoading(true);
    setTimeout(() => {
      update((s) => { s.currentUser = { name: NAMES[role], role, email }; });
      toast.success(`Bienvenue ${NAMES[role].split(" ")[0]}`, { description: `Connecté en tant que ${role}` });
      nav({ to: "/app" });
    }, 900);
  };
  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <Background />
      <div className="relative hidden overflow-hidden lg:block">
        <img src={hero} alt="" className="absolute inset-0 size-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-background/40 to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary"><span className="size-1.5 rounded-full bg-primary pulse-dot" />Connecté à Sage</div>
            <h1 className="text-5xl font-semibold leading-[1.05] text-foreground">Plateforme <span className="text-gradient">d'agents IA</span> TOUVIS</h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">Automatisez le recouvrement, le stock, le service client, les devis et les campagnes commerciales.</p>
            <div className="mt-8 flex gap-2">
              {AGENTS.map((I, i) => (
                <div key={i} className="glass grid size-11 place-items-center rounded-xl text-primary page-enter" style={{ animationDelay: `${i * 90}ms` }}><I className="size-5" /></div>
              ))}
            </div>
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">© 2026 TOUVIS — Fournitures industrielles · Casablanca</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="glass w-full max-w-md rounded-3xl p-8 page-enter">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="text-2xl font-semibold">Connexion</h2>
          <p className="mt-1 text-sm text-muted-foreground">Accédez à votre espace TOUVIS AI.</p>

          <div className="mt-6 space-y-4">
            <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Email</span>
              <div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 bg-secondary/50 pl-10" /></div>
            </label>
            <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Mot de passe</span>
              <div className="relative"><Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input type={show ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} className="h-11 bg-secondary/50 pl-10 pr-10" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Afficher le mot de passe">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </div>
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground"><Checkbox defaultChecked />Se souvenir de moi</label>
              <button type="button" onClick={() => setForgot(true)} className="text-primary hover:underline">Mot de passe oublié ?</button>
            </div>
            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Profil de démonstration</div>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((r) => (
                  <button type="button" key={r} onClick={() => setRole(r)} className={cn("rounded-full border px-3 py-1 text-xs transition-all", role === r ? "border-primary/50 bg-primary/15 text-primary shadow-glow" : "border-border text-muted-foreground hover:text-foreground")}>{r}</button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full bg-brand text-base shadow-glow">
              {loading ? <Loader2 className="animate-spin" /> : <>Se connecter<ArrowRight /></>}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>Un lien de réinitialisation sera envoyé à votre adresse email.</DialogDescription>
          </DialogHeader>
          <Input defaultValue={email} className="bg-secondary/50" />
          <DialogFooter><Button onClick={() => { setForgot(false); toast.success("Lien envoyé", { description: "Consultez votre boîte de réception." }); }}>Envoyer le lien</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
