import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import ForaDeLinha from "@/components/ForaDeLinha";

export const Route = createFileRoute("/fora-de-linha")({
  head: () => ({
    meta: [{ title: "Itens Fora de Linha · Lopas 2026" }, { name: "description", content: "Consulta de itens fora de linha do estoque do Centro de Distribuição Lopas." }, { property: "og:title", content: "Itens Fora de Linha · Lopas 2026" }, { property: "og:description", content: "Visão resumida e consulta dos itens fora de linha da Lopas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }],
  }),
  component: ForaDeLinhaPage,
});

function ForaDeLinhaPage() {
  const { autenticado, pronto } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (pronto && !autenticado) navigate({ to: "/login", replace: true });
  }, [pronto, autenticado, navigate]);

  if (!pronto || !autenticado) return null;
  return <ForaDeLinha />;
}
