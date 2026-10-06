import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BellRing, CheckCircle2, Copy, Download, Loader2, Plus, Save, Send, Sparkles, Trash2, XCircle, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Panel, StatusBadge, Timeline } from "@/components/touvis/kit";
import { Logo } from "@/components/touvis/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, update, clientOf, quoteTotals, setQuoteStatus, relaunchQuote, log, uid, nowIso, getState } from "@/lib/store";
import { nextQuoteId, duplicateQuote, pdfMock } from "@/lib/quotes";
import { addDays, TODAY, COMMERCIAUX, type Quote, type QuoteLine } from "@/lib/mock";
import { fDate, mad } from "@/lib/format";

export const Route = createFileRoute("/app/devis/$id")({
  head: ({ params }) => ({ meta: [{ title: `Devis ${params.id} — TOUVIS AI` }, { name: "description", content: "Constructeur de devis assisté par l'IA." }, { property: "og:title", content: `Devis ${params.id} — TOUVIS AI` }, { property: "og:description", content: "Générez et envoyez vos devis." }] }),
  component: Builder,
});

function Builder() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const s = useStore();
  useEffect(() => {
    if (id !== "nouveau") return;
    const nid = nextQuoteId();
    update((st) => { st.quotes = [{ id: nid, clientId: st.clients[0].id, requestId: null, date: nowIso(), validity: addDays(TODAY, 30).toISOString(), sales: COMMERCIAUX[0], lines: [], status: "Brouillon", sentDate: null, lastReminder: null, nextReminder: null, paused: false, archived: false, history: [{ date: nowIso(), label: "Devis créé", by: st.currentUser.name }] }, ...st.quotes]; });
    nav({ to: "/app/devis/$id", params: { id: nid }, replace: true });
  }, [id, nav]);
  const q = s.quotes.find((x) => x.id === id);
  const [draft, setDraft] = useState<Quote | null>(q ?? null);
  const [ai, setAi] = useState(false);
  useEffect(() => { setDraft(q ?? null); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, q?.status, q?.history.length]);
  if (id === "nouveau" || !draft || !q) return <div className="grid h-64 place-items-center text-muted-foreground">{id === "nouveau" ? <Loader2 className="animate-spin" /> : <div className="text-center">Devis introuvable. <Link to="/app/devis" className="text-primary">Retour</Link></div>}</div>;

  const c = clientOf(s, draft.clientId);
  const tot = quoteTotals(draft.lines);
  const setLine = (lid: string, p: Partial<QuoteLine>) => setDraft({ ...draft, lines: draft.lines.map((l) => (l.id === lid ? { ...l, ...p } : l)) });
  const save = (silent = false) => { update((st) => { st.quotes = st.quotes.map((x) => (x.id === draft.id ? { ...draft, history: x.history, status: x.status } : x)); log(st, { agent: "Agent Devis", module: "Devis", action: `Devis ${draft.id} sauvegardé`, client: c.company }); }); if (!silent) toast.success("Devis sauvegardé"); };
  const generate = () => {
    setAi(true);
    setTimeout(() => {
      const st = getState();
      const req = draft.requestId ? st.quoteRequests.find((r) => r.id === draft.requestId) : null;
      const source = req ? req.lines.map((l) => st.products.find((p) => p.ref === l.ref) ? { p: st.products.find((p) => p.ref === l.ref)!, qty: l.qty ?? 10 } : null).filter(Boolean) as { p: (typeof st.products)[0]; qty: number }[]
        : st.products.filter((_, i) => (i + c.id.charCodeAt(5)) % 6 === 0).slice(0, 3).map((p, i) => ({ p, qty: [50, 20, 8][i] }));
      setDraft({ ...draft, lines: source.map(({ p, qty }) => ({ id: uid("L"), ref: p.ref, name: p.name, qty, price: p.price, discount: qty >= 50 ? 5 : c.ca > 1000000 ? 3 : 0 })) });
      setAi(false); toast.success("Devis généré par l'IA", { description: "Prix Sage, remises client et TVA appliqués." });
    }, 1400);
  };
  const editable = ["Brouillon", "À valider"].includes(q.status);

  return (
    <div>
      <Link to="/app/devis" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Devis</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><h1 className="font-mono text-2xl font-semibold">{q.id}</h1><StatusBadge status={q.status} /></div>
        <div className="flex flex-wrap gap-2">
          {editable && <Button className="bg-brand shadow-glow" onClick={generate} disabled={ai}>{ai ? <Loader2 className="animate-spin" /> : <Sparkles />}Générer le devis avec IA</Button>}
          {editable && <Button variant="outline" className="bg-transparent" onClick={() => save()}><Save />Sauvegarder</Button>}
          {q.status === "Brouillon" && <Button variant="outline" className="bg-transparent" onClick={() => { save(true); setQuoteStatus(q.id, "À valider"); toast.success("Devis validé"); }}><CheckCircle2 />Valider</Button>}
          {editable && <Button onClick={() => { if (!draft.lines.length) { toast.error("Ajoutez au moins une ligne"); return; } save(true); setQuoteStatus(q.id, "Envoyé"); toast.success("Devis envoyé au client", { description: c.email }); }}><Send />Envoyer au client</Button>}
          {["Envoyé", "À relancer", "Relancé"].includes(q.status) && <>
            <Button variant="outline" className="bg-transparent" onClick={() => relaunchQuote(q.id)}><BellRing />Relancer</Button>
            <Button onClick={() => { setQuoteStatus(q.id, "Accepté"); toast.success("Devis accepté — relances arrêtées"); }}><CheckCircle2 />Accepté</Button>
            <Button variant="ghost" onClick={() => { setQuoteStatus(q.id, "Refusé"); toast("Devis refusé — relances arrêtées"); }}><XCircle />Refusé</Button>
          </>}
          {q.status === "Accepté" && <Button onClick={() => { setQuoteStatus(q.id, "Transformé en commande"); toast.success("Commande créée dans Sage"); }}><PackageCheck />Transformer en commande</Button>}
          <Button variant="ghost" onClick={() => pdfMock(q.id)}><Download />PDF</Button>
          <Button variant="ghost" onClick={() => { const n = duplicateQuote(q.id); nav({ to: "/app/devis/$id", params: { id: n } }); }}><Copy />Dupliquer</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Panel title="Informations">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5 text-xs text-muted-foreground">Client<Select disabled={!editable} value={draft.clientId} onValueChange={(v) => setDraft({ ...draft, clientId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{s.clients.map((x) => <SelectItem key={x.id} value={x.id}>{x.company}</SelectItem>)}</SelectContent></Select></label>
              <label className="space-y-1.5 text-xs text-muted-foreground">Commercial<Select disabled={!editable} value={draft.sales} onValueChange={(v) => setDraft({ ...draft, sales: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMMERCIAUX.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></label>
              <div className="space-y-1.5 text-xs text-muted-foreground">Date<div className="flex h-9 items-center rounded-md border border-input px-3 text-sm text-foreground">{fDate(draft.date)}</div></div>
              <div className="space-y-1.5 text-xs text-muted-foreground">Validité<div className="flex h-9 items-center rounded-md border border-input px-3 text-sm text-foreground">{fDate(draft.validity)}</div></div>
            </div>
          </Panel>
          <Panel title="Lignes du devis" bodyClass="p-0" action={editable && <Button size="sm" variant="ghost" onClick={() => { const p = s.products[draft.lines.length % 25]; setDraft({ ...draft, lines: [...draft.lines, { id: uid("L"), ref: p.ref, name: p.name, qty: 1, price: p.price, discount: 0 }] }); }}><Plus />Ajouter ligne</Button>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2 text-left">Produit</th><th className="px-3 py-2 text-left">Référence</th><th className="px-3 py-2 text-right">Qté</th><th className="px-3 py-2 text-right">Prix unit. HT</th><th className="px-3 py-2 text-right">Remise %</th><th className="px-3 py-2 text-right">Total HT</th><th /></tr></thead>
                <tbody className="divide-y divide-border">
                  {draft.lines.map((l) => (
                    <tr key={l.id} className="page-enter">
                      <td className="px-3 py-2">{editable ? <Select value={l.ref} onValueChange={(v) => { const p = s.products.find((x) => x.ref === v)!; setLine(l.id, { ref: p.ref, name: p.name, price: p.price }); }}><SelectTrigger className="h-8 min-w-[220px]"><SelectValue>{l.name}</SelectValue></SelectTrigger><SelectContent>{s.products.map((p) => <SelectItem key={p.ref} value={p.ref}>{p.name}</SelectItem>)}</SelectContent></Select> : l.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-primary">{l.ref}</td>
                      <td className="px-3 py-2"><Input disabled={!editable} type="number" min={1} value={l.qty} onChange={(e) => setLine(l.id, { qty: Math.max(0, Number(e.target.value)) })} className="ml-auto h-8 w-20 text-right" /></td>
                      <td className="px-3 py-2"><Input disabled={!editable} type="number" min={0} step="0.1" value={l.price} onChange={(e) => setLine(l.id, { price: Number(e.target.value) })} className="ml-auto h-8 w-28 text-right" /></td>
                      <td className="px-3 py-2"><Input disabled={!editable} type="number" min={0} max={100} value={l.discount} onChange={(e) => setLine(l.id, { discount: Math.min(100, Math.max(0, Number(e.target.value))) })} className="ml-auto h-8 w-20 text-right" /></td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">{mad(l.qty * l.price * (1 - l.discount / 100))}</td>
                      <td className="px-2">{editable && <Button variant="ghost" size="icon" className="size-8" aria-label="Supprimer la ligne" onClick={() => setDraft({ ...draft, lines: draft.lines.filter((x) => x.id !== l.id) })}><Trash2 /></Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!draft.lines.length && <div className="p-10 text-center text-sm text-muted-foreground">Aucune ligne. Cliquez sur <span className="text-primary">Générer le devis avec IA</span> ou ajoutez une ligne.</div>}
            </div>
            <div className="ml-auto w-full max-w-xs space-y-1.5 border-t border-border p-5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total HT</span><span className="tabular-nums">{mad(tot.ht)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">TVA 20 %</span><span className="tabular-nums">{mad(tot.tva)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-semibold"><span>Total TTC</span><span className="text-primary tabular-nums">{mad(tot.ttc)}</span></div>
            </div>
          </Panel>
          <Panel title="Historique"><Timeline events={q.history} /></Panel>
        </div>

        <Panel title="Aperçu du devis" className="h-fit xl:sticky xl:top-24" bodyClass="p-4">
          <div className="rounded-xl bg-foreground p-6 text-[11px] text-background shadow-glow">
            <div className="flex items-start justify-between"><div className="rounded-lg bg-background p-1.5"><Logo /></div><div className="text-right"><div className="font-display text-base font-bold">DEVIS</div><div className="font-mono">{q.id}</div><div>{fDate(draft.date)}</div></div></div>
            <div className="mt-5 grid grid-cols-2 gap-4"><div><div className="font-semibold">TOUVIS SARL</div><div className="opacity-70">ZI Sidi Bernoussi, Casablanca</div></div><div className="text-right"><div className="font-semibold">{c.company}</div><div className="opacity-70">{c.name}<br />{c.city}</div></div></div>
            <table className="mt-5 w-full"><thead><tr className="border-b border-background/20 text-left opacity-70"><th className="py-1">Désignation</th><th className="text-right">Qté</th><th className="text-right">Total</th></tr></thead>
              <tbody>{draft.lines.map((l) => <tr key={l.id} className="border-b border-background/10"><td className="py-1 pr-2">{l.name}{l.discount > 0 && <span className="opacity-60"> (-{l.discount}%)</span>}</td><td className="text-right">{l.qty}</td><td className="text-right">{mad(l.qty * l.price * (1 - l.discount / 100))}</td></tr>)}</tbody></table>
            <div className="mt-3 space-y-0.5 text-right"><div>HT : {mad(tot.ht)}</div><div>TVA : {mad(tot.tva)}</div><div className="text-sm font-bold">TTC : {mad(tot.ttc)}</div></div>
            <div className="mt-4 opacity-60">Validité jusqu'au {fDate(draft.validity)} · Paiement à 60 jours · Livraison 48h · Commercial : {draft.sales}</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
