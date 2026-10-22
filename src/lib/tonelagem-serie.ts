/* Série mensal do peso do estoque vinda do Drive, compartilhada com a cena.
 *
 * O payload da sincronização chega em `routes/index.tsx`, que publica aqui a
 * série calculada no servidor (src/lib/tonelagem-mensal.ts). Assim a cena das
 * toneladas lê a versão mais recente sem precisar repassar a série por toda a
 * cadeia de props do vídeo-resumo (VideoResumoDashboard → CenasApresentacao). */

import { useEffect, useState } from "react";
import type { TonelagemMes } from "@/data/tonelagem-estoque";

let atual: TonelagemMes[] | undefined;
const ouvintes = new Set<() => void>();

function chave(serie: TonelagemMes[] | undefined): string {
  return serie?.length ? serie.map((p) => `${p.mes}=${p.ton}`).join(",") : "";
}

export function definirSerieTonelagem(serie: TonelagemMes[] | undefined): void {
  if (chave(atual) === chave(serie)) return;
  atual = serie;
  for (const avisar of ouvintes) avisar();
}

export function useSerieTonelagem(): TonelagemMes[] | undefined {
  const [serie, setSerie] = useState<TonelagemMes[] | undefined>(atual);

  useEffect(() => {
    const avisar = () => setSerie(atual);
    ouvintes.add(avisar);
    avisar();
    return () => {
      ouvintes.delete(avisar);
    };
  }, []);

  return serie;
}
