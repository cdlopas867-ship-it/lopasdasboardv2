import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import Apresentacao from "./Apresentacao";
import CenasForaDeLinha from "./CenasForaDeLinha";
import { ITENS_FORA_DE_LINHA, type ItemForaDeLinha } from "@/data/fora-de-linha";
import { useDadosSync } from "@/hooks/use-dados-sync";
import { initialSyncData } from "@/lib/initial-sync-data";

/* Tela Fora de linha — mesma estrutura das outras telas do app:
   wrapper Apresentacao (fundo da marca, controles, painel de vidro).
   Cena 0: resumo com KPIs. Cena 1: lista interativa com filtros. */

const TOTAL_CENAS = 2;
const DURACOES = [8000, 12000];

export default function ForaDeLinha() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { dados } = useDadosSync<Record<string, unknown>>(initialSyncData as Record<string, unknown>);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [origem, setOrigem] = useState("");

  const itensBase = (dados as Record<string, unknown>)["foraDeLinha"] as { itens: ItemForaDeLinha[] } | undefined;
  const itensForaDeLinha = itensBase?.itens ?? ITENS_FORA_DE_LINHA;

  const itens = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return itensForaDeLinha.filter((i) => {
      if (categoria && i.categoria !== categoria) return false;
      if (origem && i.origem !== origem) return false;
      if (!q) return true;
      return (
        i.desc.toLowerCase().includes(q) ||
        i.chave.toLowerCase().includes(q) ||
        i.mascara.toLowerCase().includes(q)
      );
    }).sort((a, b) => b.valorEstoque - a.valorEstoque);
  }, [busca, categoria, origem]);

  const valorFiltrado = itens.reduce((s, i) => s + i.valorEstoque, 0);

  return (
    <Apresentacao
      totalCenas={TOTAL_CENAS}
      duracoes={DURACOES}
      titulo="Fora de linha · CD Lopas"
      onLogout={() => {
        logout();
        navigate({ to: "/login", replace: true });
      }}
    >
      {({ cena, anim }) => (
        <CenasForaDeLinha
          cena={cena}
          anim={anim}
          busca={busca}
          setBusca={setBusca}
          categoria={categoria}
          setCategoria={setCategoria}
          origem={origem}
          setOrigem={setOrigem}
          itens={itens}
          valorFiltrado={valorFiltrado}
        />
      )}
    </Apresentacao>
  );
}
