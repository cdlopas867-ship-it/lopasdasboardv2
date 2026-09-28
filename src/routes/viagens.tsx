import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/* A página de viagens foi desativada. Redireciona acessos antigos para o
   dashboard principal sem buscar dados nem carregar a apresentação. */
export const Route = createFileRoute("/viagens")({
  head: () => ({ meta: [{ title: "Viagens · Lopas 2026" }, { name: "description", content: "Atalho desativado do controle de viagens Lopas." }, { property: "og:title", content: "Viagens · Lopas 2026" }, { property: "og:description", content: "Atalho do controle de viagens do Centro de Distribuição Lopas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ViagensDesativada,
});

function ViagensDesativada() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/", replace: true });
  }, [navigate]);

  return null;
}
