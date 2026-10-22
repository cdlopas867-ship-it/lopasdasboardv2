/* Série mensal do peso do estoque a partir das próprias leituras do Drive.
 *
 * Cada importação da planilha de posição grava um registro no histórico
 * (historico-store), com a tonelagem e a data-base da planilha. Esta função
 * agrupa esses registros por mês e usa a ÚLTIMA leitura de cada mês como o peso
 * daquele mês — assim a cena "Toneladas do Estoque · Mês a Mês" acompanha o
 * Drive sozinha, sem precisar editar valores no código.
 *
 * Meses sem leitura ficam fora da série; neles o painel mantém a base
 * histórica estática (src/data/tonelagem-estoque.ts). */

import type { RegistroHistorico } from "./historico-store";

export type PontoMensal = { mes: string; ton: number };

const MESES_CURTOS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/* "22/10/2026" (data-base da planilha) ou ISO (modificação do arquivo) → mês do
   calendário local do servidor (o container roda em America/Sao_Paulo). */
function mesDoRegistro(r: RegistroHistorico): { chave: string; mes: string } | null {
  const dataPlanilha = r.data?.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dataPlanilha) {
    const numero = Number(dataPlanilha[2]);
    const ano = Number(dataPlanilha[3]);
    if (numero >= 1 && numero <= 12) {
      return {
        chave: `${ano}-${String(numero).padStart(2, "0")}`,
        mes: `${MESES_CURTOS[numero - 1]}/${String(ano).slice(2)}`,
      };
    }
  }
  const d = new Date(r.timestamp);
  if (isNaN(d.getTime())) return null;
  const numero = d.getMonth() + 1;
  return {
    chave: `${d.getFullYear()}-${String(numero).padStart(2, "0")}`,
    mes: `${MESES_CURTOS[numero - 1]}/${String(d.getFullYear()).slice(2)}`,
  };
}

export function serieTonelagemMensal(
  historico: RegistroHistorico[],
  tonAtual?: number | null,
  agora: Date = new Date(),
): PontoMensal[] {
  const porMes = new Map<string, PontoMensal>();

  /* O histórico vem em ordem crescente, então a última leitura de cada mês
     sobrescreve as anteriores — o mês fica com o peso do último dia lido. */
  for (const r of historico) {
    if (!(r.ton > 0)) continue;
    const info = mesDoRegistro(r);
    if (info) porMes.set(info.chave, { mes: info.mes, ton: Math.round(r.ton * 10) / 10 });
  }

  /* O mês corrente reflete sempre a leitura ao vivo do Drive. */
  if (tonAtual && tonAtual > 0) {
    const numero = agora.getMonth() + 1;
    const chave = `${agora.getFullYear()}-${String(numero).padStart(2, "0")}`;
    porMes.set(chave, {
      mes: `${MESES_CURTOS[numero - 1]}/${String(agora.getFullYear()).slice(2)}`,
      ton: Math.round(tonAtual * 10) / 10,
    });
  }

  return [...porMes.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, ponto]) => ponto);
}
