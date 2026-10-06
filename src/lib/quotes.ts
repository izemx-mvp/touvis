import { toast } from "sonner";
import { update, log, nowIso, getState } from "./store";
import type { QuoteStatus } from "./mock";

export const Q_STATUSES: QuoteStatus[] = ["Brouillon", "À valider", "Envoyé", "À relancer", "Relancé", "Accepté", "Refusé", "Expiré", "Transformé en commande"];

export const nextQuoteId = () => `DEV-2026-${String(100 + getState().quotes.length).padStart(3, "0")}`;

export function duplicateQuote(id: string) {
  const s = getState(); const q = s.quotes.find((x) => x.id === id)!;
  const nid = nextQuoteId();
  update((st) => { st.quotes = [{ ...q, id: nid, status: "Brouillon", date: nowIso(), sentDate: null, lastReminder: null, nextReminder: null, archived: false, history: [{ date: nowIso(), label: `Dupliqué depuis ${id}`, by: st.currentUser.name }] }, ...st.quotes]; log(st, { module: "Devis", action: `Devis ${id} dupliqué en ${nid}` }); });
  toast.success(`Devis dupliqué : ${nid}`);
  return nid;
}

export const pdfMock = (id: string) => {
  toast.promise(new Promise((r) => setTimeout(r, 1200)), { loading: "Génération du PDF…", success: `${id}.pdf téléchargé`, error: "Erreur" });
};
