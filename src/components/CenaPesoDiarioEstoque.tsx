import { fmtInt, fmtTonDec, fmtMoeda } from "@/lib/format";
import { TONELAGEM_ESTOQUE_MENSAL } from "@/data/tonelagem-estoque";

/* Cena — Peso Diário do Estoque: marca o último peso do estoque atualizado
   pelo Google Drive. Mostra a tonelagem atual em destaque, a data da última
   sincronização e a variação em relação ao mês anterior. */

type Props = {
  anim: boolean;
  tonAtual?: number | undefined;
  sincronizacao?: { em?: string; planilhas?: { nome: string; modificado?: string }[] } | undefined;
  resumo?: { valor: number; previsto: number; ton: number; saldo: number; itens: number } | null;
};

export default function CenaPesoDiarioEstoque({ anim, tonAtual, sincronizacao, resumo }: Props) {
  const ton = tonAtual && tonAtual > 0 ? tonAtual : resumo?.ton ?? 0;

  /* Data da última sincronização formatada em pt-BR */
  const atualizadoEm = sincronizacao?.em
    ? new Date(sincronizacao.em).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      })
    : null;

  /* Data de hoje formatada */
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  /* Variação vs. mês anterior (penúltimo mês da tonelagem mensal) */
  const anterior = TONELAGEM_ESTOQUE_MENSAL[TONELAGEM_ESTOQUE_MENSAL.length - 2];
  const deltaTon = anterior ? ton - anterior.ton : 0;
  const deltaPct = anterior && anterior.ton > 0 ? (deltaTon / anterior.ton) * 100 : 0;
  const subiu = deltaTon >= 0;

  /* Itens e valor do resumo */
  const itens = resumo?.itens ?? 0;
  const valor = resumo?.valor ?? 0;

  return (
    <div className="peso-diario-card w-full pb-6">
      <p className="video-sobe peso-diario-eyebrow">
        Estoque · Peso Diário
      </p>

      {/* Peso atual em destaque */}
      <div className="video-sobe peso-diario-hero" style={{ animationDelay: "0.1s" }}>
        <p className="peso-diario-ton">
          {fmtTonDec(ton)}
        </p>
        <p className="peso-diario-label">peso atual do estoque</p>
      </div>

      {/* Data de hoje + última atualização */}
      <div className="video-sobe peso-diario-info" style={{ animationDelay: "0.2s" }}>
        <div className="peso-diario-data">
          <span className="peso-diario-data-icon">📅</span>
          <span className="peso-diario-data-text">{hoje}</span>
        </div>
        {atualizadoEm && (
          <div className="peso-diario-sync">
            <span className="peso-diario-sync-dot" />
            <span className="peso-diario-sync-text">
              Atualizado pelo Google Drive · {atualizadoEm}
            </span>
          </div>
        )}
      </div>

      {/* Variação vs. mês anterior + contexto */}
      <div className="video-sobe peso-diario-grid" style={{ animationDelay: "0.3s" }}>
        <div className="peso-diario-stat">
          <p className="peso-diario-stat-label">vs. {anterior?.mes ?? "mês anterior"}</p>
          <p className={`peso-diario-stat-value ${subiu ? "peso-diario-up" : "peso-diario-down"}`}>
            {subiu ? "▲" : "▼"} {fmtTonDec(Math.abs(deltaTon))}
          </p>
          <p className={`peso-diario-stat-sub ${subiu ? "peso-diario-up" : "peso-diario-down"}`}>
            {subiu ? "+" : ""}{fmtBrMax1(deltaPct)}%
          </p>
        </div>
        <div className="peso-diario-stat">
          <p className="peso-diario-stat-label">Itens em estoque</p>
          <p className="peso-diario-stat-value">{fmtInt(itens)}</p>
          <p className="peso-diario-stat-sub">itens ativos</p>
        </div>
        <div className="peso-diario-stat">
          <p className="peso-diario-stat-label">Valor do estoque</p>
          <p className="peso-diario-stat-value">{fmtMoeda(valor)}</p>
          <p className="peso-diario-stat-sub">custo médio</p>
        </div>
      </div>

      {/* Barra de progresso visual — peso atual vs. capacidade máxima do CD */}
      {(() => {
        const capTon = 12720; // CAP. ARMAZENAGEM total em toneladas
        const pctCap = Math.min((ton / capTon) * 100, 100);
        return (
          <div className="video-sobe peso-diario-barra" style={{ animationDelay: "0.4s" }}>
            <div className="peso-diario-barra-head">
              <span>Capacidade do CD</span>
              <span>{fmtInt(capTon)} t · {fmtBrMax1(pctCap)}%</span>
            </div>
            <div className="peso-diario-barra-track">
              <div
                className={`peso-diario-barra-fill ${!anim ? "video-pausada" : ""}`}
                style={{ width: `${pctCap}%` }}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* Helper local — fmtBrMax com 1 casa decimal (evita import circular) */
function fmtBrMax1(v: number): string {
  const factor = 10;
  const rounded = Math.round(Math.abs(v) * factor) / factor;
  let str = rounded.toFixed(1);
  if (str.includes(".")) str = str.replace(/0+$/, "").replace(/\.$/, "");
  const [intPart, decPart] = str.split(".");
  const intFormatted = (intPart ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = v < 0 ? "-" : "";
  return decPart ? `${sign}${intFormatted},${decPart}` : `${sign}${intFormatted}`;
}
