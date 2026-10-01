import { useEffect, useRef, useState } from "react";
import CenasApresentacao, { type VideoForaDeLinha } from "./CenasApresentacao";
import { TODAS_IMAGENS_AVARIA } from "@/data/avarias-imagens";

/* Vídeo-resumo do dashboard — cenas animadas com gráficos e o mínimo de texto,
   sobre o fundo da marca Móveis Lopas, tocando automaticamente ao iniciar o app.
   Na troca de cenas, a anterior sai suave (fade + desfoque) enquanto a nova entra. */

export type VideoKpi = { id?: string; rotulo: string; valor: string; detalhe?: string; extra?: [string, string][] };
export type VideoUnidade = { nome: string; share: number; valor: string };
export type VideoOcupacao = { pct: number; ocupados: number; livres: number; detalhes?: { atributo: string; unidade: string; cd1: number; cd2: number; total: number }[] };
export type VideoDia = { dia: string; data: string; ton: number; meta: number };
export type VideoTurno = { nome: string; faixa?: string; ton?: number; pct: number };
export type VideoMes = { mes: string; recebido: number; carregado: number };
export type VideoSaidasCDMes = { mes: string; tonelada: number; faturado: number; motivos: { motivo: string; tonelada: number; faturado: number }[] };
export type VideoSaidasCD = { meses: VideoSaidasCDMes[]; totalTonelada: number; totalFaturado: number };

export type VideoAvariaTipo = {
  tipo: string;
  imagem: string;
  cor: string;
  total: number;
  pct: number;
  meses: { mes: string; qtd: number }[];
};
export type VideoAvarias = {
  total: number;
  referenciaParcial?: boolean;
  custo: string;
  meses: { mes: string; qtd: number; ordem?: number }[];
  motivoMes: { mes: string; motivo: string; qtd: number }[];
  tipos?: VideoAvariaTipo[];
} | null;
export type VideoPendentes = {
  itens: number;
  totalTon: number;
  mediaTon: number;
  fatias: { rotulo: string; ton: number; cor: string }[];
  meses: { mes: string; ton: number; pct: number; itens: number; dtInicial?: string; dtFinal?: string; lotes?: number }[];
} | null;
export type VideoReservados = {
  totalQtd: number;
  totalTon: number;
  totalValor: number;
  custoMedioPonderado: number;
  totalSaldo: number;
  totalValorEstoque: number;
  totalPesoEstoque: number;
  pctQtd: number;
  pctValor: number;
  pctPeso: number;
  topItens: {
    cod: string;
    desc: string;
    mascara: string;
    qtdReservada: number;
    pesoReservado: number;
    valorReservado: number;
    saldoAtual: number;
    pctReservado: number;
  }[];
} | null;
export type VideoClasseAbc = {
  classe: string;
  itens: number;
  pctItens: number;
  pctValor: number;
  ton?: number;
};
export type VideoAbc = {
  recebimento: VideoClasseAbc[] | null;
  estoque: VideoClasseAbc[] | null;
} | null;

type Props = {
  kpis: VideoKpi[];
  unidades: VideoUnidade[];
  ocupacao: VideoOcupacao;
  semana: { rotulo: string; total: string; dias: VideoDia[] } | null;
  turnos: VideoTurno[];
  mensal?: VideoMes[] | undefined;
  avarias?: VideoAvarias | undefined;
  abc?: VideoAbc | undefined;
  pendentes?: VideoPendentes | undefined;
  reservados?: VideoReservados | undefined;
  valorFaturado?: number | undefined;
  saidasCD?: VideoSaidasCD | undefined;
  foraDeLinha?: VideoForaDeLinha | undefined;
  sincronizacao?: { em?: string; planilhas?: { nome: string; modificado?: string }[] } | undefined;
  onFechar?: () => void;
  onLogout?: () => void;
};

const TOTAL_CENAS = 12;
const DURACOES = [130000, 5000, 6500, 5000, 6500, 9000, 5500, 8000, 7000, 7000, 7000, 12000];

export default function VideoResumoDashboard({
  kpis,
  unidades,
  ocupacao,
  semana,
  turnos,
  mensal,
  abc,
  avarias,
  pendentes,
  reservados,
  valorFaturado,
  saidasCD,
  foraDeLinha,
  sincronizacao,
  onFechar,
  onLogout,
}: Props) {
  const [cena, setCena] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [anim, setAnim] = useState(false);
  const [cenaSaindo, setCenaSaindo] = useState<number | null>(null);
  const [mostrarSync, setMostrarSync] = useState(false);
  const cenaAnteriorRef = useRef(0);

  /* Data/hora da última sincronização com a pasta do Drive */
  const syncEm = sincronizacao?.em ? new Date(sincronizacao.em) : null;
  const syncEmTxt = syncEm
    ? `${String(syncEm.getDate()).padStart(2, "0")}/${String(syncEm.getMonth() + 1).padStart(2, "0")}/${syncEm.getFullYear()} ${String(syncEm.getHours()).padStart(2, "0")}:${String(syncEm.getMinutes()).padStart(2, "0")}`
    : null;

  /* Troca de cena: guarda a cena anterior para o fade de saída e dispara
     as animações da nova cena */
  useEffect(() => {
    const anterior = cenaAnteriorRef.current;
    if (anterior !== cena) {
      setCenaSaindo(anterior);
      cenaAnteriorRef.current = cena;
    }
    setAnim(false);
    const t = setTimeout(() => setAnim(true), 60);
    const tSai = setTimeout(() => setCenaSaindo(null), 600);
    return () => {
      clearTimeout(t);
      clearTimeout(tSai);
    };
  }, [cena]);

  /* Reprodução automática — avança as cenas sozinho e reinicia no final (loop) */
  useEffect(() => {
    if (pausado) return;
    const t = setTimeout(() => {
      setCena((c) => (c + 1) % TOTAL_CENAS);
    }, DURACOES[cena]!);
    return () => clearTimeout(t);
  }, [cena, pausado]);

  /* Teclado: setas navegam, espaço pausa, Esc reinicia */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCena(0);
      if (e.key === " ") {
        e.preventDefault();
        setPausado((p) => !p);
      }
      if (e.key === "ArrowRight") setCena((s) => Math.min(s + 1, TOTAL_CENAS - 1));
      if (e.key === "ArrowLeft") setCena((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Trava o scroll enquanto o vídeo está aberto */
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  const propsCena = {
    kpis,
    unidades,
    ocupacao,
    semana,
    turnos,
    mensal,
    abc,
    avarias,
    pendentes,
    reservados,
    valorFaturado,
    saidasCD,
    foraDeLinha,
    onReiniciar: () => setCena(0),
    onPausar: () => setPausado(true),
  };

  return (
    <div
      role="dialog"
      aria-label="Vídeo resumo do dashboard"
      className="dashboard-entrar fixed inset-0 z-[120] flex flex-col overflow-hidden"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button, a, input, select, textarea, [role='button']")) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width * 0.35) setCena((s) => Math.max(s - 1, 0));
        else if (x > rect.width * 0.65) setCena((s) => Math.min(s + 1, TOTAL_CENAS - 1));
        else setPausado((p) => !p);
      }}
    >
      {/* Fundo da marca com movimento sutil (Ken Burns) */}
      <div
        className="video-kenburns absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/fundo-satelite-real.jpg?v=1)" }}
      />
      {/* Camadas de profundidade para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#4a6b20]/75 via-[#3a521a]/60 to-[#2e3f14]/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />

      {/* Dizeres da marca — watermark no canto inferior esquerdo */}
      <div className="pointer-events-none absolute bottom-8 left-4 z-[1] sm:bottom-10 sm:left-10">
        <p className="font-serif text-xs tracking-tight text-white/85 sm:text-lg sm:tracking-tight">
          Controle de Estoque CD Lopas
        </p>
        <p className="mt-0.5 text-[8px] font-semibold tracking-[0.3em] text-primary uppercase sm:text-[11px]">
          Movidos pela fé
        </p>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Topo — última sincronização + controle de saída */}
        <div className="flex items-center justify-end gap-3 px-5 pt-3 sm:px-8">
          {syncEmTxt && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMostrarSync((v) => !v)}
                aria-label="Ver planilhas sincronizadas"
                className="flex cursor-pointer items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                Sincronizado {syncEmTxt}
              </button>
              {mostrarSync && (
                <div className="absolute top-full right-0 z-20 mt-2 w-72 rounded-xl border border-white/20 bg-[#1e2c10]/95 p-3 text-left shadow-xl backdrop-blur-md">
                  <p className="mb-2 text-[9px] font-bold tracking-[0.2em] text-white/50 uppercase">
                    Planilhas da pasta do Drive
                  </p>
                  <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                    {(sincronizacao?.planilhas ?? []).map((pl) => (
                      <li key={pl.nome} className="text-[10px] leading-tight text-white/85">
                        <span className="block truncate font-semibold">{pl.nome}</span>
                        {pl.modificado && (
                          <span className="text-white/45">
                            alterada em {new Date(pl.modificado).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </li>
                    ))}
                    {!(sincronizacao?.planilhas ?? []).length && (
                      <li className="text-[10px] text-white/45">Nenhuma planilha listada.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair"
              className="cursor-pointer rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Sair
            </button>
          )}
        </div>

        {/* Cena atual + cena que sai como irmãos para evitar herança de filtros */}
        <div className="relative flex min-h-0 flex-grow items-center justify-center overflow-hidden px-4 py-2 sm:px-8">
          <div key={cena} className="video-entra absolute inset-0 flex items-center justify-center overflow-y-auto px-4 py-2 sm:px-8">
            <CenasApresentacao cena={cena} anim={anim} {...propsCena} />
          </div>
          {cenaSaindo !== null && (
            <div key={`sai-${cenaSaindo}`} className="video-sai video-congelada absolute inset-0 flex items-center justify-center overflow-y-auto px-4 py-2 sm:px-8" aria-hidden>
              <CenasApresentacao cena={cenaSaindo} anim {...propsCena} />
            </div>
          )}
        </div>

        {/* Rodapé mínimo */}
        <div className="flex items-center justify-between px-6 pb-2 text-[9px] font-bold tracking-[0.2em] text-white/45 uppercase sm:px-8">
          <span>{pausado ? "Pausado · espaço retoma" : "Reprodução automática · espaço pausa"}</span>
          <span className="font-mono">
            {String(cena + 1).padStart(2, "0")} / {String(TOTAL_CENAS).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Preload das imagens de avaria — escondido, baixa todas as fotos
          assim que o vídeo inicia para que a Cena 7 já as tenha em cache. */}
      <div aria-hidden className="pointer-events-none absolute size-0 overflow-hidden opacity-0">
        {TODAS_IMAGENS_AVARIA.map((src) => (
          <img key={src} src={src} alt="" loading="eager" />
        ))}
      </div>
    </div>
  );
}
