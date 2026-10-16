import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/* Hook que mantém os dados do painel sincronizados entre todos os dispositivos.
 *
 * - Busca os dados mais recentes via GET /api/sync-data ao montar e a cada
 *   10 s (polling) — garante que dispositivos que abram o link depois da
 *   importação recebam os valores corretos mesmo se o SSE for bloqueado
 *   por proxies/CDN.
 * - Conecta a um EventSource (SSE) para atualizações em tempo real quando
 *   outro dispositivo importa dados.
 * - `atualizarDados` atualiza o estado local imediatamente e envia os dados
 *   ao servidor, que os retransmite aos demais clientes.
 */

function isValidPainel(payload: unknown): boolean {
  const p = payload as Record<string, unknown>;
  if (
    !Array.isArray(p["kpis"]) ||
    !Array.isArray(p["unidades"]) ||
    !Array.isArray(p["dias"]) ||
    !Array.isArray(p["turnos"]) ||
    (p["unidades"] as unknown[]).length === 0
  ) {
    return false;
  }
  const t0 = p["turnos"][0] as Record<string, unknown> | undefined;
  if (
    p["turnos"].length &&
    (typeof t0?.["pct"] === "undefined" || typeof t0?.["ton"] === "undefined")
  ) {
    return false;
  }
  return true;
}

/* Assinatura de conteúdo para arrays grandes (avarias/pendentes) —
   soma de campos numéricos + primeiro/último item, para detectar mudanças
   mesmo quando o número de linhas é igual. */
function arrSig(arr: unknown[] | undefined): string {
  if (!arr?.length) return "0";
  const a = arr as Record<string, unknown>[];
  let sum = 0;
  for (const item of a) {
    sum += (typeof item["quantidade"] === "number" ? item["quantidade"] : 0)
         + (typeof item["pendente"] === "number" ? item["pendente"] : 0)
         + (typeof item["pesoTotal"] === "number" ? item["pesoTotal"] : 0)
         + (typeof item["pesoPendente"] === "number" ? item["pesoPendente"] : 0)
         + (typeof item["custo"] === "number" ? item["custo"] : 0);
  }
  const first = a[0];
  const last = a[a.length - 1];
  const key = (x: Record<string, unknown> | undefined) =>
    `${x?.["descricao"] ?? x?.["descItem"] ?? ""}|${x?.["data"] ?? x?.["dtFinal"] ?? ""}`;
  return `${arr.length}:${sum}:${key(first)}:${key(last)}`;
}

/* Assinatura do recebimento da semana — dias, tonelagens, paletes e volumes.
   Precisa entrar na chave: a Base Recebimento muda sem alterar estoque/resumo,
   e sem isso o painel ignorava a atualização (a cena ficava congelada). */
function recSig(arr: unknown[] | undefined): string {
  if (!arr?.length) return "0";
  const a = arr as Record<string, unknown>[];
  let ton = 0, qtd = 0, paletes = 0;
  for (const d of a) {
    ton += (typeof d["ton"] === "number" ? d["ton"] : 0);
    qtd += (typeof d["totalQtd"] === "number" ? d["totalQtd"] : 0);
    paletes += (typeof d["totalPaletes"] === "number" ? d["totalPaletes"] : 0);
  }
  const first = a[0]?.["iso"] ?? "";
  const last = a[a.length - 1]?.["iso"] ?? "";
  return `${a.length}:${first}:${last}:${Math.round(ton)}:${qtd}:${paletes}`;
}

/* Assinatura da produção da semana (PCP 003) — dias e totais de toneladas/
   unidades. Precisa entrar na chave: a planilha de produção muda sem alterar
   estoque/resumo, e sem isso o painel ignorava a atualização (a cena ficava
   congelada). */
function prodSig(arr: unknown[] | undefined): string {
  if (!arr?.length) return "0";
  const a = arr as Record<string, unknown>[];
  let tonPrev = 0, tonRec = 0, unPrev = 0, unRec = 0;
  for (const d of a) {
    tonPrev += (typeof d["tonPrevisto"] === "number" ? d["tonPrevisto"] : 0);
    tonRec += (typeof d["tonEntregue"] === "number" ? d["tonEntregue"] : 0);
    unPrev += (typeof d["previsto"] === "number" ? d["previsto"] : 0);
    unRec += (typeof d["entregue"] === "number" ? d["entregue"] : 0);
  }
  const first = a[0]?.["iso"] ?? "";
  const last = a[a.length - 1]?.["iso"] ?? "";
  return `${a.length}:${first}:${last}:${Math.round(tonPrev)}:${Math.round(tonRec)}:${unPrev}:${unRec}`;
}

/* Chave barata para detectar se o payload recebido já está aplicado —
   evita re-render desnecessário no polling quando nada mudou. */
function dataKey(payload: unknown, incluirSync = true): string {
  const p = (payload as Record<string, unknown>) ?? {};
  const r = (p["resumo"] as Record<string, unknown>) ?? {};
  return JSON.stringify({
    ae: p["atualizadoEm"],
    rv: r["valor"],
    rt: r["ton"],
    rs: r["saldo"],
    ri: r["itens"],
    k: (p["kpis"] as unknown[])?.length,
    u: (p["unidades"] as unknown[])?.length,
    d: (p["dias"] as unknown[])?.length,
    t: (p["turnos"] as unknown[])?.length,
    pe: arrSig(p["pendentes"] as unknown[] | undefined),
    av: arrSig(p["avarias"] as unknown[] | undefined),
    it: (p["itens"] as unknown[])?.length,
    co: (p["composicoes"] as unknown[])?.length,
    ri2: (p["recebimentoItens"] as unknown[])?.length,
    ce: p["composicoesEm"],
    oc: (() => {
      const o = p["ocupacao"] as { ocupados?: number; livres?: number; bloqueados?: number; total?: number } | undefined;
      return o ? `${o.ocupados ?? 0}|${o.livres ?? 0}|${o.bloqueados ?? 0}|${o.total ?? 0}` : "";
    })(),
    od: (() => {
      const d = p["ocupacaoDetalhes"] as { cd1?: number; cd2?: number; total?: number }[] | undefined;
      if (!d?.length) return "0";
      let s = 0;
      for (const r of d) s += (r.cd1 ?? 0) + (r.cd2 ?? 0) + (r.total ?? 0);
      return `${d.length}:${s}`;
    })(),
    rr: !!p["reservadosResumo"],
    pr: !!p["pendentesResumo"],
    ar: (p["avariasResumo"] as { tipos?: { tipo: string; total: number }[] } | undefined)
      ?.tipos?.map(({ tipo, total }) => [tipo, total]),
    me: (p["mensal"] as unknown[])?.length,
    rs2: recSig(p["recebimentoSemanal"] as unknown[] | undefined),
    ps: prodSig(p["producaoSemanal"] as unknown[] | undefined),
    sc: (() => {
      const sc = p["saldoComparativo"] as {
        full?: { saldo?: number };
        focco?: { saldo?: number };
        comparativo?: {
          qtdExata?: number;
          qtdDiferenca?: number;
          tonExato?: number;
          tonDiferenca?: number;
          tonSoFocco?: number;
          tonFullExato?: number;
          tonFullDiferenca?: number;
          tonFullSoFull?: number;
        };
      } | undefined;
      return sc
        ? `${sc.full?.saldo ?? 0}|${sc.focco?.saldo ?? 0}|${sc.comparativo?.qtdExata ?? 0}|${sc.comparativo?.qtdDiferenca ?? 0}|${sc.comparativo?.tonExato ?? 0}|${sc.comparativo?.tonDiferenca ?? 0}|${sc.comparativo?.tonSoFocco ?? 0}|${sc.comparativo?.tonFullExato ?? 0}|${sc.comparativo?.tonFullDiferenca ?? 0}|${sc.comparativo?.tonFullSoFull ?? 0}`
        : "";
    })(),
    fl: (() => {
      const f = p["foraDeLinha"] as { importadoEm?: string; itens?: unknown[]; posicaoTotal?: { pesoTon?: number } } | undefined;
      return f ? `${f.importadoEm ?? ""}|${f.itens?.length ?? 0}|${f.posicaoTotal?.pesoTon ?? 0}` : "";
    })(),
    ...(incluirSync ? { sy: (p["sincronizacao"] as { em?: string } | undefined)?.em } : {}),
  });
}

export function useDadosSync<T>(initial: T) {
  const [dados, setDados] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const skipNext = useRef(false);
  const appliedKey = useRef<string>("");
  /* Chave só do conteúdo (sem o carimbo de sincronização) — o carimbo muda a
     cada leitura da pasta e não deve ser tratado como "dados novos". */
  const appliedContentKey = useRef<string>("");

  const applyIfNew = (payload: T) => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    if (!isValidPainel(payload)) return;
    const key = dataKey(payload);
    if (key === appliedKey.current) return;
    const contentKey = dataKey(payload, false);
    /* Avisa quando chegam dados novos depois da primeira carga —
       ou seja, quando a planilha da pasta foi atualizada. */
    if (appliedContentKey.current && contentKey !== appliedContentKey.current) {
      toast.success("Dados atualizados", {
        description: "O painel recebeu novos dados da planilha.",
        duration: 6000,
      });
    }
    appliedKey.current = key;
    appliedContentKey.current = contentKey;
    setDados(payload);
    setLoaded(true);
  };

  /* Polling — busca os dados mais recentes ao montar e a cada 10 s.
     Funciona mesmo quando o SSE é bloqueado por proxy/CDN. */
  useEffect(() => {
    let cancelled = false;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/sync-data?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const payload = await res.json();
        if (payload && !cancelled) applyIfNew(payload as T);
      } catch {
        /* servidor reiniciando — ignora */
      }
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 5000);
    /* Ao voltar para a aba/tela, busca na hora (o navegador atrasa timers em segundo plano). */
    const onVisivel = () => { if (document.visibilityState === "visible") fetchLatest(); };
    document.addEventListener("visibilitychange", onVisivel);
    window.addEventListener("focus", fetchLatest);
    window.addEventListener("online", fetchLatest);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisivel);
      window.removeEventListener("focus", fetchLatest);
      window.removeEventListener("online", fetchLatest);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* SSE — atualizações em tempo real (quando suportado pelo ambiente). */
  useEffect(() => {
    const source = new EventSource("/api/sync-events");
    source.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload?.__reload) {
          window.location.reload();
          return;
        }
        applyIfNew(payload as T);
      } catch {
        /* payload inválido — ignora */
      }
    };
    return () => source.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atualizarDados = async (novos: T) => {
    setDados(novos);
    setLoaded(true);
    skipNext.current = true; // evita eco do próprio envio voltando via SSE/polling
    appliedKey.current = dataKey(novos);
    appliedContentKey.current = dataKey(novos, false);
    try {
      await fetch("/api/sync-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novos),
      });
    } catch (e) {
      console.error("[sync] falha ao enviar dados", e);
    }
  };

  /* Fallback: se nenhum dado chegar em 5s (ex.: Drive lento ou indisponível),
     libera a tela de intro com os dados disponíveis. */
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return { dados, atualizarDados, loaded };
}
