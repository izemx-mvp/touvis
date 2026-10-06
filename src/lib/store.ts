import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import * as M from "./mock";

export type ReminderStep = { id: string; day: number; channel: "Email" | "WhatsApp"; message: string };

const initial = () => ({
  clients: M.clients, invoices: M.invoices, products: M.products, stockAlerts: M.stockAlerts, conversations: M.conversations,
  quoteRequests: M.quoteRequests, quotes: M.quotes, campaigns: M.campaigns, notifications: M.notifications, faqs: M.faqs,
  docs: M.docs, users: M.users, logs: M.logs, agents: M.agents, syncRuns: M.syncRuns,
  sage: { connected: true, lastSync: M.syncRuns[0].date, frequency: "15 min" },
  invoiceRules: [
    { id: "r1", day: -5, channel: "Email", message: "Bonjour {{nom}}, votre facture {{facture}} arrive à échéance dans 5 jours." },
    { id: "r2", day: 0, channel: "Email", message: "Bonjour {{nom}}, votre facture {{facture}} arrive à échéance aujourd'hui." },
    { id: "r3", day: 3, channel: "WhatsApp", message: "Bonjour {{nom}}, sauf erreur la facture {{facture}} reste impayée." },
    { id: "r4", day: 7, channel: "WhatsApp", message: "Bonjour {{nom}}, merci de régulariser la facture {{facture}} au plus vite." },
  ] as ReminderStep[],
  quoteSequence: [
    { id: "s1", day: 3, channel: "Email", message: "Bonjour {{nom}}, avez-vous pu consulter notre devis {{devis}} ?" },
    { id: "s2", day: 7, channel: "Email", message: "Bonjour {{nom}}, notre offre {{devis}} reste valable. Souhaitez-vous l'ajuster ?" },
    { id: "s3", day: 10, channel: "WhatsApp", message: "Bonjour {{nom}}, je me permets de revenir vers vous concernant le devis {{devis}}." },
  ] as ReminderStep[],
  serviceAgent: {
    name: "Amal — Assistante TOUVIS", greeting: "Bonjour et bienvenue chez TOUVIS ! Comment puis-je vous aider ?", tone: "professionnel",
    languages: ["Français", "Arabe"], days: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"], start: "08:00", end: "18:30",
    offHours: "Nos équipes sont disponibles de 8h à 18h30. L'assistant IA reste à votre écoute.",
    escalation: ["client mécontent", "demande de remise exceptionnelle"], channels: ["Email", "WhatsApp", "Site web"],
  },
  settings: {
    company: "TOUVIS SARL", email: "contact@touvis.ma", phone: "+212 522 00 00 00", address: "Zone Industrielle Sidi Bernoussi, Casablanca",
    sender: "TOUVIS <noreply@touvis.ma>", signature: "L'équipe TOUVIS — Fournitures industrielles", whatsapp: "+212 661 00 00 00", whatsappConnected: true,
    autonomy: 70, aiLanguage: "Français", aiTone: "professionnel", humanValidation: true, notifEmail: true, notifWhatsapp: true, notifInApp: true,
  },
  currentUser: { name: "Mounir Touzani", role: "Administrateur" as M.Role, email: "mounir.touzani@touvis.ma" },
});

export type State = ReturnType<typeof initial>;
let state: State = initial();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const getState = () => state;

export function update(fn: (s: State) => void) {
  const next = { ...state } as State;
  // shallow-clone collections so mutations inside fn produce new references
  for (const k of Object.keys(next) as (keyof State)[]) {
    const v = next[k] as unknown;
    if (Array.isArray(v)) (next as Record<string, unknown>)[k] = v.map((x) => (typeof x === "object" ? { ...x } : x));
    else if (v && typeof v === "object") (next as Record<string, unknown>)[k] = { ...(v as object) };
  }
  fn(next);
  state = next;
  listeners.forEach((l) => l());
}

export function useStore() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export const nowIso = () => {
  const d = new Date(M.TODAY); const n = new Date();
  d.setHours(n.getHours(), n.getMinutes(), n.getSeconds()); return d.toISOString();
};
let counter = 1000;
export const uid = (p: string) => `${p}-${++counter}`;

export function log(s: State, entry: { agent?: string; module: string; action: string; client?: string; result?: M.Log["result"] }) {
  s.logs = [{ id: uid("LG"), date: nowIso(), user: s.currentUser.name, agent: entry.agent ?? "—", module: entry.module, action: entry.action, client: entry.client ?? "—", result: entry.result ?? "Succès" }, ...s.logs];
}
export function notify(s: State, n: { category: M.NotifCategory; title: string; body: string; link: string }) {
  s.notifications = [{ id: uid("N"), date: nowIso(), read: false, ...n }, ...s.notifications];
}

export const clientOf = (s: State, id: string) => s.clients.find((c) => c.id === id)!;

// ---------- Domain rules ----------
export const stockStatus = (p: { stock: number; threshold: number }) =>
  p.stock === 0 ? "Rupture" : p.stock <= p.threshold ? "Seuil atteint" : p.stock <= p.threshold * 1.5 ? "Stock faible" : "Normal";

export const quoteTotals = (lines: M.QuoteLine[], vat = 0.2) => {
  const ht = lines.reduce((t, l) => t + l.qty * l.price * (1 - l.discount / 100), 0);
  return { ht, tva: ht * vat, ttc: ht * (1 + vat) };
};

export const FOLLOWUP_STOP: M.QuoteStatus[] = ["Accepté", "Refusé", "Expiré", "Transformé en commande"];

export function setQuoteStatus(id: string, status: M.QuoteStatus) {
  update((s) => {
    const q = s.quotes.find((x) => x.id === id)!;
    q.status = status;
    if (status === "Envoyé") { q.sentDate = nowIso(); q.nextReminder = new Date(M.addDays(M.TODAY, 3)).toISOString(); }
    if (FOLLOWUP_STOP.includes(status)) { q.nextReminder = null; }
    q.history = [...q.history, { date: nowIso(), label: `Statut : ${status}`, by: s.currentUser.name }];
    log(s, { agent: "Agent Devis", module: "Devis", action: `Devis ${id} → ${status}`, client: clientOf(s, q.clientId).company });
    if (status === "Accepté") notify(s, { category: "Devis", title: "Devis accepté", body: `${id} — relances arrêtées`, link: `/app/devis/${id}` });
  });
}

export function relaunchQuote(id: string, channel = "Email") {
  update((s) => {
    const q = s.quotes.find((x) => x.id === id)!;
    q.status = "Relancé"; q.lastReminder = nowIso(); q.nextReminder = M.addDays(M.TODAY, 4).toISOString();
    q.history = [...q.history, { date: nowIso(), label: "Relance envoyée", channel, by: "Agent Relance Devis" }];
    log(s, { agent: "Agent Relance Devis", module: "Relance devis", action: `Relance ${channel} ${id}`, client: clientOf(s, q.clientId).company });
  });
  toast.success(`Relance envoyée pour ${id}`);
}

export function remindInvoice(id: string) {
  update((s) => {
    const inv = s.invoices.find((x) => x.id === id)!;
    inv.status = "Relancée"; inv.lastReminder = nowIso();
    inv.history = [...inv.history, { date: nowIso(), label: "Relance manuelle envoyée", channel: inv.channel, by: s.currentUser.name }];
    log(s, { agent: "Agent Recouvrement", module: "Recouvrement", action: `Relance ${inv.channel} ${id}`, client: clientOf(s, inv.clientId).company });
  });
  toast.success("Relance envoyée", { description: id });
}

export function markInvoicePaid(id: string) {
  update((s) => {
    const inv = s.invoices.find((x) => x.id === id)!;
    inv.status = "Payée"; inv.remaining = 0; inv.nextAction = "—";
    inv.history = [...inv.history, { date: nowIso(), label: "Marquée comme payée", by: s.currentUser.name }];
    log(s, { agent: "Agent Recouvrement", module: "Recouvrement", action: `Facture ${id} payée`, client: clientOf(s, inv.clientId).company });
    notify(s, { category: "Recouvrement", title: "Paiement reçu", body: `${id} — ${clientOf(s, inv.clientId).company}`, link: "/app/recouvrement" });
  });
  toast.success("Facture marquée comme payée");
}

export function runSageSync() {
  update((s) => {
    const records = 400 + Math.floor(Math.random() * 900);
    s.sage = { ...s.sage, lastSync: nowIso() };
    s.syncRuns = [{ id: uid("SY"), date: nowIso(), duration: `${20 + Math.floor(Math.random() * 30)} s`, records, result: "Succès" }, ...s.syncRuns];
    log(s, { module: "Intégration Sage", action: `Synchronisation complète (${records} enregistrements)` });
  });
}

export function resetStore() { state = initial(); listeners.forEach((l) => l()); }
