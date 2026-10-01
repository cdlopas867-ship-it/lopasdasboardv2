/* Gera o resumo de pendências de produção (pendentesResumo) a partir dos
   registros brutos, no formato esperado pelo VideoResumoDashboard. */

import type { PendenteProducao, AlertaPendente } from "./pendentes";
import { alertaPorData } from "./pendentes";
import type { VideoPendentes } from "@/components/VideoResumoDashboard";

const CORES: Record<AlertaPendente, string> = {
  critico: "#c0473a",
  prazo: "#6B8E23",
};

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function calcularPendentesResumo(
  pendentes: PendenteProducao[] | undefined,
): VideoPendentes {
  if (!pendentes?.length) return null;

  const comAlerta = pendentes.map((p) => ({
    ...p,
    alerta: alertaPorData(p.dtFinal),
  }));

  const itens = comAlerta.length;
  const totalTon = comAlerta.reduce((s, p) => s + p.pesoPendente, 0) / 1000;

  /* Toneladas já produzidas/recebidas no estoque — calcula o peso entregue
     de cada ordem: pesoEntregue = pesoPendente × entregue ÷ pendente. */
  const produzidoTon = comAlerta.reduce((s, p) => {
    if (p.pendente > 0 && p.entregue > 0) {
      return s + (p.pesoPendente * p.entregue) / p.pendente;
    }
    return s;
  }, 0) / 1000;

  /* Fatias por alerta */
  const pesosAlerta: Record<AlertaPendente, number> = {
    critico: 0, prazo: 0,
  };
  for (const p of comAlerta) {
    pesosAlerta[p.alerta] += p.pesoPendente / 1000;
  }
  const fatias = (Object.keys(CORES) as AlertaPendente[])
    .map((key) => ({
      rotulo: key === "critico" ? "Crítico" : "No prazo",
      ton: +pesosAlerta[key].toFixed(1),
      cor: CORES[key],
    }))
    .filter((f) => f.ton > 0);

  /* Agrupa por mês (dtFinal → aaaa-mm) */
  const porMes = new Map<string, PendenteProducao[]>();
  for (const p of comAlerta) {
    const key = p.dtFinal.slice(0, 7) || "s/data";
    if (!porMes.has(key)) porMes.set(key, []);
    porMes.get(key)!.push(p);
  }
  const mesesKeys = [...porMes.keys()].sort();

  const meses = mesesKeys.map((key) => {
    const items = porMes.get(key)!;
    const ton = items.reduce((s, p) => s + p.pesoPendente, 0) / 1000;
    const [ano, mes] = key.split("-");
    const label = `${MESES[Number(mes) - 1] ?? "?"}/${ano!.slice(2)}`;
    /* Data final do mês = maior DT FINAL das pendências do mês */
    const dtFinal = items.reduce((max, p) => (p.dtFinal > max ? p.dtFinal : max), items[0]!.dtFinal);
    const dtInicial = items.reduce((min, p) => (p.dtInicial && p.dtInicial < min ? p.dtInicial : min), items[0]!.dtInicial || dtFinal);
    /* Lotes abertos = valores distintos de LOTE com pendência no mês */
    const lotes = new Set(items.map((p) => p.lote).filter(Boolean)).size;
    return {
      mes: label,
      ton: +ton.toFixed(1),
      pct: totalTon > 0 ? +((ton / totalTon) * 100).toFixed(0) : 0,
      itens: items.length,
      dtInicial,
      dtFinal,
      lotes,
    };
  });

  const mediaTon = meses.length > 0 ? totalTon / meses.length : totalTon;

  return {
    itens,
    totalTon: +totalTon.toFixed(1),
    mediaTon: +mediaTon.toFixed(1),
    produzidoTon: +produzidoTon.toFixed(1),
    fatias,
    meses,
  };
}
