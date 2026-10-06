import { createFileRoute } from "@tanstack/react-router";
import { ServiceAgentSettings } from "@/components/touvis/ServiceAgentSettings";

export const Route = createFileRoute("/app/agent-parametres")({
  head: () => ({ meta: [{ title: "Paramètres de l’agent Service Client — TOUVIS AI" }, { name: "description", content: "Ton, langues, horaires et escalade de l’assistant client." }, { property: "og:title", content: "Paramètres agent — TOUVIS AI" }, { property: "og:description", content: "Configurez l’agent Service Client." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ServiceAgentSettings,
});
