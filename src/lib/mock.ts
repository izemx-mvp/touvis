// Deterministic mock data for the TOUVIS MVP (same output on server and client).
export const TODAY = new Date("2026-10-06T09:50:00");

let seed = 42;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const iso = (d: Date) => d.toISOString();
const daysFromToday = (n: number, h = int(8, 18), m = int(0, 59)) => {
  const d = addDays(TODAY, n); d.setHours(h, m, 0, 0); return iso(d);
};

export type TimelineEvent = { date: string; label: string; channel?: string; by?: string };

export const COMMERCIAUX = ["Youssef Alami", "Salma Bennani", "Karim Tazi", "Nadia Idrissi"];
const CITIES = ["Casablanca", "Rabat", "Tanger", "Kénitra", "Mohammedia", "Agadir", "Fès", "Marrakech", "El Jadida", "Settat"];
const SECTORS = ["BTP", "Agroalimentaire", "Automobile", "Énergie", "Maintenance industrielle", "Logistique", "Mines", "Textile"];
const COMPANIES = [
  "Atlas Industrie", "Maghreb Steel Services", "Sotramec", "Casa Métal Pro", "Riad Construction", "Nord Équipements",
  "Souss Hydraulique", "Fès Mécanique", "Tanger Auto Parts", "Ouarzazate Énergie", "Sidi Maarouf Logistique", "Al Amane BTP",
  "Rabat Maintenance", "Kénitra Agro Process", "Médina Outillage", "Delta Ferronnerie", "Oasis Pompes", "Chaouia Bâtiment",
  "Atlantique Levage", "Jorf Process", "Moulouya Industries", "Ifrane Mécatronique", "Doukkala Soudure", "Settat Pneumatique", "Zénith Manutention",
];
const FIRST = ["Hicham", "Fatima Zahra", "Omar", "Imane", "Rachid", "Khadija", "Mehdi", "Sanaa", "Abdelilah", "Meryem", "Anas", "Laila", "Hamza", "Zineb", "Driss", "Houda", "Amine", "Ghita", "Tarik", "Asmae", "Reda", "Siham", "Nabil", "Btissam", "Adil"];
const LAST = ["El Fassi", "Berrada", "Chraibi", "Lahlou", "Benjelloun", "Amrani", "Squalli", "Kettani", "Sefrioui", "Tahiri", "Ouazzani", "Naciri", "Bennis", "Filali", "Mernissi", "Skalli", "Alaoui", "Guessous", "Lazrak", "Hajji", "Zniber", "Benkirane", "Sbai", "Raji", "Daoudi"];

export type Client = {
  id: string; name: string; company: string; email: string; phone: string; city: string; sector: string;
  status: "Actif" | "Inactif" | "Prospect"; sales: string; ca: number; sage: "Synchronisé" | "En attente"; lastActivity: string; notes: string;
};
export const clients: Client[] = COMPANIES.map((company, i) => {
  const name = `${FIRST[i]} ${LAST[i]}`;
  const slug = company.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  return {
    id: `CL-${1001 + i}`, name, company,
    email: `${FIRST[i].split(" ")[0].toLowerCase()}.${LAST[i].split(" ").pop()!.toLowerCase()}@${slug}.ma`,
    phone: `+212 6${int(10, 99)} ${int(10, 99)} ${int(10, 99)} ${int(10, 99)}`,
    city: pick(CITIES), sector: pick(SECTORS),
    status: i % 7 === 6 ? "Inactif" : i % 9 === 8 ? "Prospect" : "Actif",
    sales: COMMERCIAUX[i % 4], ca: int(80, 1900) * 1000, sage: i % 11 === 10 ? "En attente" : "Synchronisé",
    lastActivity: daysFromToday(-int(0, 40)), notes: "Client historique, sensible aux délais de livraison.",
  };
});

export const CATEGORIES = ["Boulonnerie", "Visserie", "Tiges filetées", "Rondelles", "Écrous", "Outillage", "Électroportatif", "Pneumatique", "BTP", "Graissage", "Abrasifs", "Soudage", "Levage", "Manutention", "Protection individuelle"];
const PRODUCT_NAMES: [string, string, number][] = [
  ["Boulon HM 12x50 acier 8.8 zingué", "Boulonnerie", 4.2], ["Vis TH M10x30 inox A2", "Visserie", 2.1], ["Tige filetée M16 1m classe 8.8", "Tiges filetées", 38],
  ["Rondelle plate M12 large", "Rondelles", 0.6], ["Écrou frein Nylstop M10", "Écrous", 0.9], ["Clé dynamométrique 40-200 Nm", "Outillage", 1450],
  ["Perceuse visseuse 18V brushless", "Électroportatif", 2390], ["Raccord rapide pneumatique 1/2\"", "Pneumatique", 85], ["Cheville chimique 300 ml", "BTP", 129],
  ["Graisse lithium EP2 5 kg", "Graissage", 420], ["Disque à tronçonner 230 mm inox", "Abrasifs", 28], ["Électrode rutile 3,2 mm (5 kg)", "Soudage", 310],
  ["Palan à chaîne manuel 2 t", "Levage", 3200], ["Transpalette manuel 2,5 t", "Manutention", 4650], ["Gants anti-coupure niveau 5", "Protection individuelle", 45],
  ["Boulon tête fraisée M8x40", "Boulonnerie", 1.8], ["Vis autoforeuse 6,3x25", "Visserie", 0.7], ["Meuleuse d'angle 125 mm 1200W", "Électroportatif", 1190],
  ["Compresseur 100 L 3 CV", "Pneumatique", 5900], ["Élingue textile 3 t 2 m", "Levage", 260], ["Casque de chantier ventilé", "Protection individuelle", 95],
  ["Pompe à graisse pneumatique", "Graissage", 2150], ["Poste à souder Inverter 200A", "Soudage", 3890], ["Écrou hexagonal M20 inox", "Écrous", 3.4], ["Coffret douilles 1/2\" 24 pcs", "Outillage", 890],
];
export type Product = {
  id: string; ref: string; name: string; category: string; serial: string; stock: number; reserved: number; threshold: number;
  price: number; lastAlert: string | null; lastIn: string; lastOut: string; history: number[]; treated: boolean;
};
export const products: Product[] = PRODUCT_NAMES.map(([name, category, price], i) => {
  const threshold = int(2, 12) * 10;
  const mode = i % 5;
  const stock = mode === 0 ? 0 : mode === 1 ? Math.round(threshold * 0.8) : mode === 2 ? Math.round(threshold * 1.3) : threshold * int(2, 6);
  const history = Array.from({ length: 12 }, (_, k) => Math.max(0, Math.round(stock + (11 - k) * int(2, 12) * (mode < 2 ? 1 : 0.4) - int(0, 10))));
  history[11] = stock;
  return {
    id: `P-${i + 1}`, ref: `REF-${1030 + i * 3}`, name, category, serial: `SN-${int(100000, 999999)}`, stock,
    reserved: int(0, 30), threshold, price, lastAlert: mode < 2 ? daysFromToday(-int(0, 6)) : null,
    lastIn: daysFromToday(-int(3, 30)), lastOut: daysFromToday(-int(0, 4)), history, treated: false,
  };
});

export type StockAlert = { id: string; productId: string; date: string; type: "Rupture" | "Seuil atteint" | "Stock faible"; channels: string[]; treated: boolean };
export const stockAlerts: StockAlert[] = products.filter((_, i) => i % 5 < 2).concat(products.slice(2, 4)).slice(0, 12).map((p, i) => ({
  id: `AL-${301 + i}`, productId: p.id, date: daysFromToday(-int(0, 8)),
  type: p.stock === 0 ? "Rupture" : p.stock <= p.threshold ? "Seuil atteint" : "Stock faible",
  channels: ["Application", "WhatsApp"], treated: i > 8,
}));

export type InvoiceStatus = "À venir" | "Proche échéance" | "Échue" | "En retard" | "Relancée" | "Payée";
export type Invoice = {
  id: string; clientId: string; date: string; due: string; amount: number; remaining: number; status: InvoiceStatus;
  lastReminder: string | null; nextAction: string; channel: "Email" | "WhatsApp"; paused: boolean; history: TimelineEvent[];
};
export const invoices: Invoice[] = Array.from({ length: 35 }, (_, i) => {
  const offset = [-40, -25, -12, -6, -2, 0, 2, 4, 9, 20, 30][i % 11] + int(-2, 2);
  const due = addDays(TODAY, offset);
  const amount = int(8, 380) * 1000 + int(0, 9) * 100;
  const paid = i % 8 === 7;
  const status: InvoiceStatus = paid ? "Payée" : offset < -10 ? "En retard" : offset < 0 ? (i % 3 === 0 ? "Relancée" : "Échue") : offset <= 5 ? "Proche échéance" : "À venir";
  const history: TimelineEvent[] = [{ date: iso(addDays(due, -60)), label: "Facture émise depuis Sage", by: "Sage" }];
  if (offset < 5) history.push({ date: iso(addDays(due, -5)), label: "Rappel J-5 envoyé", channel: "Email", by: "Agent Recouvrement" });
  if (offset < 0) history.push({ date: iso(due), label: "Rappel d'échéance J0", channel: "Email", by: "Agent Recouvrement" });
  if (offset < -3) history.push({ date: iso(addDays(due, 3)), label: "Relance J+3", channel: "WhatsApp", by: "Agent Recouvrement" });
  if (paid) history.push({ date: daysFromToday(-2), label: "Paiement reçu et rapproché", by: "Sage" });
  return {
    id: `FA-2026-${String(812 + i).padStart(4, "0")}`, clientId: clients[i % 25].id, date: iso(addDays(due, -60)), due: iso(due),
    amount, remaining: paid ? 0 : i % 6 === 5 ? Math.round(amount * 0.4) : amount, status,
    lastReminder: history.length > 1 ? history[history.length - 1].date : null,
    nextAction: paid ? "—" : offset > 5 ? "Email J-5" : offset >= 0 ? "Email J0" : offset > -3 ? "WhatsApp J+3" : "WhatsApp J+7",
    channel: offset < -3 ? "WhatsApp" : "Email", paused: false, history,
  };
});

export type ConvStatus = "Nouvelle" | "Traitée par IA" | "En cours" | "En attente client" | "Transférée humain" | "Résolue" | "Fermée";
export type Message = { from: "client" | "ia" | "agent" | "note"; text: string; time: string; author?: string };
export type Conversation = {
  id: string; clientId: string; channel: "WhatsApp" | "Email" | "Web" | "Réseaux sociaux"; status: ConvStatus;
  priority: "Haute" | "Moyenne" | "Basse"; assignee: string; messages: Message[]; updated: string; unread: boolean;
};
const CONV_TOPICS: [string, string][] = [
  ["Bonjour, avez-vous des boulons HM 12x50 en stock ? Il m'en faut 2000.", "Bonjour ! Oui, la référence REF-1030 est disponible : 1 200 unités en stock immédiat, le reste sous 5 jours. Souhaitez-vous un devis ?"],
  ["Ma commande BL-4471 n'est pas encore arrivée, c'est urgent.", "Je comprends l'urgence. Votre commande est en cours de livraison, arrivée prévue demain avant 12h. Je vous envoie le suivi."],
  ["Pouvez-vous m'envoyer votre catalogue soudage ?", "Bien sûr, voici le catalogue Soudage 2026 en PDF. Je reste disponible pour toute question."],
  ["Quels sont vos délais de livraison sur Tanger ?", "Les livraisons sur Tanger se font en 48h ouvrées pour les produits en stock."],
  ["Je souhaite une remise sur une commande de 3 transpalettes.", "Merci pour votre demande. Une remise exceptionnelle nécessite la validation d'un commercial, je transfère à votre interlocuteur."],
  ["La perceuse reçue ne fonctionne pas, je veux un échange.", "Désolé pour ce désagrément. J'ouvre un dossier SAV et un collaborateur vous rappelle dans l'heure."],
  ["Quel est le prix de la graisse EP2 en seau de 5 kg ?", "Le seau de 5 kg de graisse lithium EP2 est à 420 MAD HT. Remise dès 10 unités."],
];
export const conversations: Conversation[] = Array.from({ length: 25 }, (_, i) => {
  const [q, a] = CONV_TOPICS[i % CONV_TOPICS.length];
  const statuses: ConvStatus[] = ["Nouvelle", "Traitée par IA", "En cours", "En attente client", "Transférée humain", "Résolue", "Fermée", "Traitée par IA"];
  const status = statuses[i % statuses.length];
  const updated = daysFromToday(-Math.floor(i / 4), 9 - (i % 4), int(0, 59));
  const messages: Message[] = [{ from: "client", text: q, time: updated }];
  if (status !== "Nouvelle") messages.push({ from: "ia", text: a, time: updated, author: "Agent Service Client" });
  if (status === "Transférée humain" || status === "En cours") messages.push({ from: "agent", text: "Je prends le relais, je reviens vers vous rapidement.", time: updated, author: COMMERCIAUX[i % 4] });
  return {
    id: `CV-${501 + i}`, clientId: clients[(i * 3) % 25].id, channel: (["WhatsApp", "Email", "Web", "Réseaux sociaux", "WhatsApp"] as const)[i % 5],
    status, priority: i % 5 === 1 || i % 7 === 4 ? "Haute" : i % 3 === 0 ? "Moyenne" : "Basse",
    assignee: status === "Transférée humain" || status === "En cours" ? COMMERCIAUX[i % 4] : "Agent IA", messages, updated, unread: i < 6,
  };
});

export type RequestLine = { ref: string | null; name: string; qty: number | null };
export type QuoteRequest = {
  id: string; clientId: string; subject: string; date: string; lines: RequestLine[]; analysis: string; quoteStatus: string;
  owner: string; body: string; attachments: string[]; confidence: number; missing: string[]; deadline: string; address: string | null; quoteId: string | null;
};
const REQ_STATUSES = ["Nouvelle", "Analyse IA", "Informations manquantes", "En préparation", "À valider", "Devis envoyé", "Accepté", "Refusé"];
export const quoteRequests: QuoteRequest[] = Array.from({ length: 20 }, (_, i) => {
  const c = clients[(i * 2 + 1) % 25];
  const p1 = products[i % 25], p2 = products[(i + 7) % 25];
  const missing = i % 4 === 2 ? ["Quantité manquante pour " + p2.name, "Adresse de livraison absente"] : i % 6 === 5 ? ["Référence non reconnue : « vis spéciale TX40 »"] : [];
  const analysis = missing.length ? "Informations manquantes" : REQ_STATUSES[i % REQ_STATUSES.length];
  const lines: RequestLine[] = [{ ref: p1.ref, name: p1.name, qty: int(5, 500) }, { ref: p2.ref, name: p2.name, qty: missing.length && i % 4 === 2 ? null : int(2, 200) }];
  return {
    id: `DDV-2026-${String(101 + i).padStart(3, "0")}`, clientId: c.id,
    subject: pick(["Demande de prix urgente", "Besoin pour chantier", "Consultation fournisseurs", "Réapprovisionnement atelier", "Demande de devis"]) + ` — ${p1.category}`,
    date: daysFromToday(-Math.floor(i / 2)), lines, analysis, quoteStatus: ["Devis envoyé", "Accepté", "Refusé"].includes(analysis) ? analysis : analysis === "À valider" ? "Brouillon" : "—",
    owner: COMMERCIAUX[i % 4],
    body: `Bonjour,\n\nNous aurions besoin de votre meilleure offre pour :\n- ${lines[0].qty} x ${p1.name} (${p1.ref})\n- ${lines[1].qty ?? "?"} x ${p2.name}\n\nLivraison souhaitée sous 10 jours${missing.length ? "" : " à notre site de " + c.city}.\n\nCordialement,\n${c.name}\n${c.company}`,
    attachments: i % 3 === 0 ? ["cahier_des_charges.pdf"] : [], confidence: missing.length ? int(68, 82) : int(88, 98), missing,
    deadline: "10 jours", address: i % 4 === 2 ? null : `Zone industrielle, ${c.city}`, quoteId: null,
  };
});

export type QuoteLine = { id: string; ref: string; name: string; qty: number; price: number; discount: number };
export type QuoteStatus = "Brouillon" | "À valider" | "Envoyé" | "À relancer" | "Relancé" | "Accepté" | "Refusé" | "Expiré" | "Transformé en commande";
export type Quote = {
  id: string; clientId: string; requestId: string | null; date: string; validity: string; sales: string; lines: QuoteLine[];
  status: QuoteStatus; sentDate: string | null; lastReminder: string | null; nextReminder: string | null; paused: boolean; archived: boolean; history: TimelineEvent[];
};
const Q_STATUSES: QuoteStatus[] = ["Brouillon", "À valider", "Envoyé", "À relancer", "Relancé", "Accepté", "Refusé", "Expiré", "Transformé en commande", "À relancer"];
export const quotes: Quote[] = Array.from({ length: 20 }, (_, i) => {
  const status = Q_STATUSES[i % Q_STATUSES.length];
  const sentOffset = -int(2, 18);
  const sent = ["Brouillon", "À valider"].includes(status) ? null : daysFromToday(sentOffset);
  const lines = Array.from({ length: int(2, 4) }, (_, k) => {
    const p = products[(i * 3 + k * 5) % 25];
    return { id: `L${k}`, ref: p.ref, name: p.name, qty: int(2, 120), price: p.price, discount: pick([0, 0, 5, 10]) };
  });
  const history: TimelineEvent[] = [{ date: daysFromToday(sentOffset - 1), label: "Devis généré par l'IA", by: "Agent Devis" }];
  if (sent) history.push({ date: sent, label: "Devis envoyé au client", channel: "Email", by: COMMERCIAUX[i % 4] });
  const relanced = status === "Relancé" || status === "Accepté";
  if (relanced) history.push({ date: daysFromToday(sentOffset + 3), label: "Relance J+3", channel: "Email", by: "Agent Relance" });
  if (status === "Accepté") history.push({ date: daysFromToday(-1), label: "Devis accepté par le client", by: "Client" });
  const active = ["Envoyé", "À relancer", "Relancé"].includes(status);
  return {
    id: `DEV-2026-${String(30 + i).padStart(3, "0")}`, clientId: clients[(i * 4 + 2) % 25].id, requestId: null,
    date: daysFromToday(sentOffset - 1), validity: daysFromToday(sentOffset + 29), sales: COMMERCIAUX[i % 4], lines, status,
    sentDate: sent, lastReminder: relanced ? daysFromToday(sentOffset + 3) : null,
    nextReminder: active ? daysFromToday(status === "À relancer" ? 0 : int(1, 4)) : null, paused: false, archived: false, history,
  };
});
// Wire a few requests to quotes
quoteRequests.forEach((r, i) => { if (r.quoteStatus !== "—" && quotes[i]) { r.quoteId = quotes[i].id; quotes[i].requestId = r.id; quotes[i].clientId = r.clientId; } });

export type CampaignStatus = "Brouillon" | "Planifiée" | "En cours" | "Terminée" | "Suspendue";
export type Recipient = { clientId: string; status: "Intéressé" | "À rappeler" | "Non intéressé" | "Sans réponse"; reply: string };
export type Campaign = {
  id: string; name: string; objective: string; segment: string; channel: "Email" | "WhatsApp"; contacts: number; date: string; status: CampaignStatus;
  sent: number; delivered: number; replies: number; interested: number; errors: number; message: string; recipients: Recipient[]; daily: number[];
};
const CAMP: [string, string, string, "Email" | "WhatsApp", CampaignStatus][] = [
  ["Campagne Octobre — Boulonnerie", "Promotion", "Clients BTP actifs", "Email", "En cours"],
  ["Lancement poste Inverter 200A", "Nouveau produit", "Ateliers soudure", "WhatsApp", "En cours"],
  ["Réactivation clients inactifs", "Réactivation", "Clients inactifs > 6 mois", "Email", "Planifiée"],
  ["Fidélisation grands comptes", "Fidélisation", "CA > 500 000 MAD", "Email", "Terminée"],
  ["Relance devis sans réponse", "Relance", "Devis sans réponse", "WhatsApp", "Terminée"],
  ["Semaine EPI sécurité", "Promotion", "Industrie & Mines", "Email", "Brouillon"],
];
export const campaigns: Campaign[] = CAMP.map(([name, objective, segment, channel, status], i) => {
  const contacts = int(80, 320);
  const sent = ["Brouillon", "Planifiée"].includes(status) ? 0 : status === "En cours" ? Math.round(contacts * 0.7) : contacts;
  const delivered = Math.round(sent * 0.96), replies = Math.round(delivered * (0.12 + rnd() * 0.15)), interested = Math.round(replies * 0.55);
  const recipients: Recipient[] = clients.slice(i, i + 12).map((c, k) => ({
    clientId: c.id, status: sent ? (["Intéressé", "À rappeler", "Non intéressé", "Sans réponse", "Sans réponse"] as const)[k % 5] : "Sans réponse",
    reply: sent && k % 5 < 3 ? ["Intéressé, merci de me rappeler.", "Pouvez-vous me rappeler la semaine prochaine ?", "Pas de besoin actuellement."][k % 5] : "—",
  }));
  return {
    id: `CP-${21 + i}`, name, objective, segment, channel, contacts, date: daysFromToday([-3, -1, 4, -20, -12, 10][i]), status,
    sent, delivered, replies, interested, errors: sent - delivered,
    message: "Bonjour {{nom}}, TOUVIS vous propose {{offre}} sur {{produit}}. Votre commercial {{commercial}} reste à votre disposition.",
    recipients, daily: Array.from({ length: 7 }, () => (sent ? int(5, 40) : 0)),
  };
});

export type NotifCategory = "Recouvrement" | "Stock" | "Service Client" | "Devis" | "Campagnes" | "Système";
export type Notification = { id: string; category: NotifCategory; title: string; body: string; date: string; read: boolean; link: string };
const NOTIFS: [NotifCategory, string, string, string][] = [
  ["Recouvrement", "Facture arrivée à échéance", "FA-2026-0817 — Al Amane BTP — 48 300 MAD", "/app/recouvrement"],
  ["Recouvrement", "Paiement reçu", "Atlas Industrie a réglé FA-2026-0819", "/app/recouvrement"],
  ["Stock", "Produit sous seuil", "REF-1033 Vis TH M10x30 inox A2", "/app/stocks"],
  ["Stock", "Rupture de stock", "REF-1030 Boulon HM 12x50 — 0 unité", "/app/stocks"],
  ["Service Client", "Nouvelle conversation", "Sotramec via WhatsApp", "/app/conversations"],
  ["Service Client", "Conversation transférée", "Remise exceptionnelle — transférée à Salma Bennani", "/app/conversations"],
  ["Devis", "Nouvelle demande de devis", "DDV-2026-101 analysée par l'IA (94 %)", "/app/demandes"],
  ["Devis", "Devis à relancer", "DEV-2026-033 sans réponse depuis 7 jours", "/app/relances"],
  ["Devis", "Devis accepté", "DEV-2026-035 accepté — 64 200 MAD", "/app/devis"],
  ["Campagnes", "Client intéressé par campagne", "Riad Construction — Campagne Octobre", "/app/campagnes"],
  ["Système", "Synchronisation Sage réussie", "1 284 enregistrements mis à jour", "/app/sage"],
  ["Stock", "Seuil atteint", "REF-1045 Raccord rapide pneumatique", "/app/stocks"],
  ["Recouvrement", "Relance WhatsApp envoyée", "Delta Ferronnerie — J+7", "/app/recouvrement"],
];
export const notifications: Notification[] = Array.from({ length: 25 }, (_, i) => {
  const [category, title, body, link] = NOTIFS[i % NOTIFS.length];
  return { id: `N-${i + 1}`, category, title, body, date: daysFromToday(-Math.floor(i / 5), 10 - (i % 5) * 2 > 0 ? 10 - (i % 5) : 8, int(0, 59)), read: i > 7, link };
});

export type Faq = { id: string; q: string; a: string; category: string; active: boolean; updated: string };
const FAQS: [string, string, string][] = [
  ["Quels sont vos délais de livraison ?", "48h ouvrées à Casablanca et Rabat, 72h pour le reste du Maroc sur les produits en stock.", "Livraison"],
  ["Livrez-vous partout au Maroc ?", "Oui, via notre flotte et nos transporteurs partenaires.", "Livraison"],
  ["Comment obtenir un devis ?", "Envoyez votre besoin par email, WhatsApp ou via le site : l'IA prépare votre devis en quelques minutes.", "Devis"],
  ["Quelle est la durée de validité d'un devis ?", "30 jours à compter de la date d'émission.", "Devis"],
  ["Quels moyens de paiement acceptez-vous ?", "Virement, chèque, effet de commerce et paiement à 60 jours pour les comptes agréés.", "Paiement"],
  ["Puis-je obtenir un duplicata de facture ?", "Oui, demandez-le à l'assistant : il est extrait directement de Sage.", "Facturation"],
  ["Proposez-vous des remises volume ?", "Oui, à partir de 10 unités ou 20 000 MAD HT de commande.", "Tarifs"],
  ["Comment connaître la disponibilité d'un produit ?", "L'assistant consulte le stock Sage en temps réel.", "Disponibilité"],
  ["Quelle est la garantie de l'électroportatif ?", "24 mois pièces et main-d'œuvre, 36 mois pour les gammes pro.", "SAV"],
  ["Comment faire un retour produit ?", "Ouvrez une demande SAV ; un bon de retour vous est envoyé sous 24h.", "SAV"],
  ["Vendez-vous de la boulonnerie inox A4 ?", "Oui, toute la gamme M6 à M24 en A2 et A4.", "Produits"],
  ["Avez-vous des fiches techniques ?", "Oui, toutes les fiches produits sont disponibles en PDF.", "Produits"],
  ["Le stock affiché est-il fiable ?", "Il est synchronisé avec Sage toutes les 15 minutes.", "Stock"],
  ["Puis-je réserver du stock ?", "Oui, pour 72h sur validation d'un devis.", "Stock"],
  ["Comment modifier mes informations de facturation ?", "Contactez le service client, la mise à jour est faite dans Sage.", "Facturation"],
];
export const faqs: Faq[] = FAQS.map(([q, a, category], i) => ({ id: `FAQ-${i + 1}`, q, a, category, active: i !== 13, updated: daysFromToday(-int(1, 60)) }));
export const FAQ_CATEGORIES = ["Produits", "Tarifs", "Disponibilité", "Livraison", "SAV", "Devis", "Facturation", "Paiement", "Stock"];

export type Doc = { id: string; name: string; type: "PDF" | "Excel" | "Word"; category: string; size: string; date: string; index: "Indexé" | "En cours" | "Erreur"; active: boolean; usedByAI: number };
export const DOC_CATEGORIES = ["Catalogues", "Fiches produits", "Tarifs", "Procédures internes", "Conditions commerciales", "Documentation SAV"];
export const docs: Doc[] = [
  ["Catalogue général TOUVIS 2026.pdf", "PDF", "Catalogues", "24,8 Mo"], ["Grille tarifaire Q4 2026.xlsx", "Excel", "Tarifs", "1,2 Mo"],
  ["Fiches techniques Boulonnerie.pdf", "PDF", "Fiches produits", "6,4 Mo"], ["Conditions générales de vente.docx", "Word", "Conditions commerciales", "320 Ko"],
  ["Procédure SAV électroportatif.pdf", "PDF", "Documentation SAV", "2,1 Mo"], ["Catalogue Soudage & Abrasifs.pdf", "PDF", "Catalogues", "11,3 Mo"],
  ["Procédure de retour produit.docx", "Word", "Procédures internes", "180 Ko"], ["Tarifs Levage & Manutention.xlsx", "Excel", "Tarifs", "640 Ko"],
  ["Fiches EPI normes EN.pdf", "PDF", "Fiches produits", "3,9 Mo"], ["Politique remises grands comptes.docx", "Word", "Conditions commerciales", "210 Ko"],
].map(([name, type, category, size], i) => ({ id: `DOC-${i + 1}`, name, type: type as Doc["type"], category, size, date: daysFromToday(-int(3, 90)), index: i === 7 ? "Erreur" : "Indexé", active: i !== 9, usedByAI: int(12, 480) }));

export type Role = "Administrateur" | "Commercial" | "Finance" | "Service Client" | "Responsable Stock";
export const ROLES: Role[] = ["Administrateur", "Commercial", "Finance", "Service Client", "Responsable Stock"];
export type User = { id: string; name: string; email: string; role: Role; active: boolean; lastLogin: string };
export const users: User[] = [
  ["Mounir Touzani", "Administrateur"], ["Youssef Alami", "Commercial"], ["Salma Bennani", "Commercial"], ["Karim Tazi", "Commercial"],
  ["Nadia Idrissi", "Service Client"], ["Leila Amrani", "Finance"], ["Othmane Kabbaj", "Responsable Stock"], ["Sara Ennaji", "Service Client"],
].map(([name, role], i) => ({ id: `U-${i + 1}`, name, email: name.toLowerCase().replace(" ", ".") + "@touvis.ma", role: role as Role, active: i !== 7, lastLogin: daysFromToday(-int(0, 5)) }));

export type Log = { id: string; date: string; user: string; agent: string; module: string; action: string; client: string; result: "Succès" | "Échec" | "En attente" };
const LOG_T: [string, string, string][] = [
  ["Agent Recouvrement", "Recouvrement", "Relance email J-5 envoyée"], ["Agent Stock", "Stocks", "Alerte seuil déclenchée"],
  ["Agent Service Client", "Service Client", "Conversation résolue automatiquement"], ["Agent Devis", "Devis", "Demande de devis analysée"],
  ["Agent Relance Devis", "Relance devis", "Relance devis envoyée"], ["Agent Campagnes", "Campagnes", "Campagne lancée"],
  ["—", "Intégration Sage", "Synchronisation complète"], ["Agent Recouvrement", "Recouvrement", "Relance WhatsApp J+7 envoyée"],
];
export const logs: Log[] = Array.from({ length: 40 }, (_, i) => {
  const [agent, module, action] = LOG_T[i % LOG_T.length];
  return { id: `LG-${i + 1}`, date: daysFromToday(-Math.floor(i / 6), 17 - (i % 6) * 1, int(0, 59)), user: agent === "—" ? "Système" : i % 4 === 0 ? COMMERCIAUX[i % 4] : "IA", agent, module, action, client: module === "Intégration Sage" ? "—" : clients[i % 25].company, result: i % 13 === 12 ? "Échec" : "Succès" };
});

export type Agent = { id: string; name: string; short: string; description: string; active: boolean; tasks: number; success: number; recent: string; route: string; configRoute: string };
export const agents: Agent[] = [
  { id: "recouvrement", name: "Agent IA Recouvrement", short: "Recouvrement", description: "Suit les échéances Sage et relance automatiquement par email et WhatsApp.", active: true, tasks: 1284, success: 92, recent: "Relance envoyée à Atlas Industrie", route: "/app/recouvrement", configRoute: "/app/recouvrement" },
  { id: "stock", name: "Agent IA Stock", short: "Stock", description: "Surveille les niveaux de stock et alerte dès qu'un seuil est atteint.", active: true, tasks: 846, success: 98, recent: "Stock critique détecté pour REF-1045", route: "/app/stocks", configRoute: "/app/stocks" },
  { id: "service", name: "Agent IA Service Client", short: "Service Client", description: "Répond aux clients 24/7 sur WhatsApp, email et web avec la base de connaissances.", active: true, tasks: 3120, success: 87, recent: "Conversation client résolue automatiquement", route: "/app/service-client", configRoute: "/app/agent-parametres" },
  { id: "devis", name: "Agent IA Générateur de Devis", short: "Devis", description: "Analyse les demandes reçues par email et génère des devis prêts à valider.", active: true, tasks: 412, success: 94, recent: "Nouvelle demande de devis analysée", route: "/app/demandes", configRoute: "/app/devis" },
  { id: "relance", name: "Agent IA Relance Devis", short: "Relance devis", description: "Relance les devis sans réponse selon une séquence multicanal.", active: true, tasks: 538, success: 81, recent: "Devis DEV-2026-045 relancé", route: "/app/relances", configRoute: "/app/relances" },
  { id: "campagnes", name: "Agent IA Campagnes", short: "Campagnes", description: "Cible, rédige et envoie des campagnes email et WhatsApp personnalisées.", active: false, tasks: 96, success: 76, recent: "Campagne Octobre lancée", route: "/app/campagnes", configRoute: "/app/campagnes/nouvelle" },
];

export type SyncRun = { id: string; date: string; duration: string; records: number; result: "Succès" | "Échec" };
export const syncRuns: SyncRun[] = Array.from({ length: 8 }, (_, i) => ({ id: `SY-${i + 1}`, date: daysFromToday(0, 9 - i, 35), duration: `${int(18, 64)} s`, records: int(120, 1400), result: i === 5 ? "Échec" : "Succès" }));
