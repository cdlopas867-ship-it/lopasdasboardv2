import { cn } from "@/lib/utils";
import { fmtInt, fmtTonDec, fmtMoeda } from "@/lib/format";
import { TONELAGEM_ESTOQUE_MENSAL } from "@/data/tonelagem-estoque";

/* Cena — Peso Diário do Estoque: tabela mensal com DIA(DATA), PESO EM
   TONELADA, QTD e VALOR. O mês mais recente usa o peso ao vivo (tonAtual/
   resumo) e o saldo/valor atuais; os demais meses mostram apenas a
   tonelagem histórica (QTD e VALOR como "—"). Estilo da tabela do
   Controle de Almoxarifados (linhas semi-transparentes, mês atual em
   âmbar). */

const COR_AMBER = "#D4881E";

type Props = {
  anim: boolean;
  tonAtual?: number | undefined;
  sincronizacao?: { em?: string; planilhas?: { nome: string; modificado?: string }[] } | undefined;
  resumo?: { valor: number; previsto: number; ton: number; saldo: number; itens: number } | null;
};

export default function CenaPesoDiarioEstoque({ tonAtual, sincronizacao, resumo }: Props) {
  const ton = tonAtual && tonAtual > 0 ? tonAtual : resumo?.ton ?? 0;
  const saldo = resumo?.saldo ?? 0;
  const valor = resumo?.valor ?? 0;
  const itens = resumo?.itens ?? 0;

  /* Data da última sincronização formatada em pt-BR */
  const atualizadoEm = sincronizacao?.em
    ? new Date(sincronizacao.em).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      })
    : null;

  /* Meses ordenados do mais recente para o mais antigo */
  const meses = [...TONELAGEM_ESTOQUE_MENSAL].reverse();

  return (
    <div className="flex w-full flex-col items-center">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Estoque · Peso Diário
      </p>

      {/* Peso atual em destaque */}
      <div className="video-sobe mt-2 flex items-baseline gap-2" style={{ animationDelay: "0.1s" }}>
        <p className="font-serif text-3xl text-white sm:text-4xl">{fmtTonDec(ton)}</p>
        <span className="text-sm text-white/60">peso atual</span>
      </div>
      {atualizadoEm && (
        <p className="video-sobe mt-0.5 text-[9px] text-white/45" style={{ animationDelay: "0.15s" }}>
          Atualizado pelo Google Drive · {atualizadoEm}
        </p>
      )}

      {/* Tabela — DIA(DATA) × PESO EM TONELADA × QTD × VALOR */}
      <div className="video-sobe mt-3 w-full max-w-lg mx-auto" style={{ animationDelay: "0.2s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Por mês
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Dia (Data)</th>
              <th className="pb-0.5 text-right font-bold">Peso (t)</th>
              <th className="pb-0.5 text-right font-bold">QTD</th>
              <th className="pb-0.5 text-right font-bold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m, i) => {
              const ehAtual = i === 0; /* mês mais recente */
              const tonLinha = ehAtual ? ton : m.ton;
              return (
                <tr
                  key={m.mes}
                  className={cn(
                    "video-sobe border-b border-white/10",
                    ehAtual ? "bg-white/10" : "bg-white/[0.04]",
                  )}
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <td className="py-0.5 font-semibold">{m.mes}</td>
                  <td
                    className="py-0.5 text-right font-mono font-semibold"
                    style={{ color: ehAtual ? COR_AMBER : undefined }}
                  >
                    {fmtTonDec(tonLinha)}
                  </td>
                  <td className="py-0.5 text-right font-mono">
                    {ehAtual ? fmtInt(saldo) : "—"}
                  </td>
                  <td className="py-0.5 text-right font-mono">
                    {ehAtual ? fmtMoeda(valor) : "—"}
                  </td>
                </tr>
              );
            })}
            {/* Total / saldo atual */}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Saldo atual</td>
              <td className="py-1 text-right font-mono text-white">{fmtTonDec(ton)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(saldo)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtMoeda(valor)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          Evolução mensal do peso do estoque (PESO BRT){itens > 0 ? ` · ${fmtInt(itens)} itens ativos` : ""}. QTD e Valor referem-se ao saldo atual.
        </p>
      </div>
    </div>
  );
}
