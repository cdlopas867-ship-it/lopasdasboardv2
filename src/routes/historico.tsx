import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import Apresentacao from "@/components/Apresentacao";
import CenasHistorico, { type RegistroHistorico } from "@/components/CenasHistorico";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [{ title: "Histórico de Estoque · Lopas 2026" }, { name: "description", content: "Evolução histórica do estoque do Centro de Distribuição Lopas." }, { property: "og:title", content: "Histórico de Estoque · Lopas 2026" }, { property: "og:description", content: "Evolução dos valores, volumes e reservas do estoque Lopas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }],
  }),
  component: HistoricoPage,
});

const TOTAL_CENAS = 3;
const DURACOES = [6000, 5000, 8000];

function HistoricoPage() {
  const { autenticado, pronto, logout } = useAuth();
  const navigate = useNavigate();

  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [valorFaturado, setValorFaturadoState] = useState<number>(0);

  const carregar = useCallback(() => {
    fetch("/api/historico")
      .then((r) => r.json())
      .then((data: RegistroHistorico[]) => setHistorico(data))
      .catch(() => {});
    fetch("/api/valor-faturado")
      .then((r) => r.json())
      .then((d: { valor: number }) => setValorFaturadoState(d.valor))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pronto && !autenticado) navigate({ to: "/login", replace: true });
  }, [pronto, autenticado, navigate]);

  useEffect(() => {
    if (!pronto || !autenticado) return;
    carregar();
    const intervalo = setInterval(carregar, 30_000);
    return () => clearInterval(intervalo);
  }, [pronto, autenticado, carregar]);

  if (!pronto || !autenticado) return null;

  const registros = [...historico].reverse();

  return (
    <Apresentacao
      totalCenas={TOTAL_CENAS}
      duracoes={DURACOES}
      titulo="Histórico · CD Lopas"
      onLogout={() => {
        void logout();
        navigate({ to: "/login", replace: true });
      }}
    >
      {({ cena, anim }) => (
        <CenasHistorico cena={cena} anim={anim} registros={registros} valorFaturado={valorFaturado} />
      )}
    </Apresentacao>
  );
}
