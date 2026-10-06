import {
  LayoutDashboard, Wallet, Boxes, Headset, MessagesSquare, FileInput, FileText, Repeat, Megaphone, Users, HelpCircle, Library,
  Bell, History, Database, UserCog, Settings, type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon; badge?: "notif" | "conv" | "relance" };
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Pilotage", items: [{ to: "/app", label: "Tableau de bord", icon: LayoutDashboard }] },
  {
    group: "Agents IA",
    items: [
      { to: "/app/recouvrement", label: "Recouvrement", icon: Wallet },
      { to: "/app/stocks", label: "Stocks", icon: Boxes },
      { to: "/app/service-client", label: "Service Client", icon: Headset },
      { to: "/app/conversations", label: "Conversations", icon: MessagesSquare, badge: "conv" },
      { to: "/app/demandes", label: "Demandes de devis", icon: FileInput },
      { to: "/app/devis", label: "Devis", icon: FileText },
      { to: "/app/relances", label: "Relance devis", icon: Repeat, badge: "relance" },
      { to: "/app/campagnes", label: "Campagnes", icon: Megaphone },
    ],
  },
  {
    group: "Données",
    items: [
      { to: "/app/clients", label: "Clients", icon: Users },
      { to: "/app/faq", label: "FAQ", icon: HelpCircle },
      { to: "/app/connaissances", label: "Base de connaissances", icon: Library },
      { to: "/app/notifications", label: "Notifications", icon: Bell, badge: "notif" },
      { to: "/app/historique", label: "Historique", icon: History },
    ],
  },
  {
    group: "Administration",
    items: [
      { to: "/app/sage", label: "Intégration Sage", icon: Database },
      { to: "/app/utilisateurs", label: "Utilisateurs", icon: UserCog },
      { to: "/app/parametres", label: "Paramètres", icon: Settings },
    ],
  },
];
