import { TODAY } from "./mock";

const madFmt = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 });
export const mad = (n: number) => `${madFmt.format(Math.round(n))} MAD`;
export const num = (n: number) => madFmt.format(Math.round(n));
export const fDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");
export const fShort = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—");
export const fTime = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
export const fDateTime = (iso: string | null | undefined) => (iso ? `${fDate(iso)} ${fTime(iso)}` : "—");
export const daysTo = (iso: string) => {
  const a = new Date(iso); a.setHours(0, 0, 0, 0);
  const b = new Date(TODAY); b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
};
export const relDays = (iso: string) => {
  const d = daysTo(iso);
  return d === 0 ? "Aujourd'hui" : d > 0 ? `J-${d}` : `J+${-d}`;
};
export const initials = (s: string) => s.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
