import { useEffect, useRef, useState } from "react";
import CenasApresentacao, { type VideoForaDeLinha } from "./CenasApresentacao";
import type { ProducaoSemanalDia } from "@/lib/producao-semanal";
import { TODAS_IMAGENS_AVARIA } from "@/data/avarias-imagens";
import ResumoBg from "./ResumoBg";
import RelatorioLopas from "./RelatorioLopas";

/* Vídeo-resumo do dashboard — cenas animadas com gráficos e o mínimo de texto,
   sobre o fundo da marca Móveis Lopas, tocando automaticamente ao iniciar o app.
   Na troca de cenas, a anterior sai suave (fade + desfoque) enquanto a nova entra. */

export type VideoKpi = { id?: string; rotulo: string; valor: string; detalhe?: string; extra?: [string, string][] };
export type VideoUnidade = { nome: string; share: number; valor: string; stats?: [string, string][]; previsto?: string };
export type VideoOcupacao = { pct: number; ocupados: number; livres: number; bloqueados?: number; detalhes?: { atributo: string; unidade: string; cd1: number; cd2: number; total: number }[] };
export type VideoDia = { dia: string; data: string; ton: number; meta: number; iso?: string };
export type VideoTurno = { nome: string; faixa?: string; ton?: number; pct: number };
export type VideoMes = { mes: string; recebido: number; carregado: number };
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
  meses: { mes: string; qtd: number; peso?: number; custo?: number; ordem?: number }[];
  motivoMes: { mes: string; motivo: string; qtd: number }[];
  tipos?: VideoAvariaTipo[];
} | null;
export type VideoPendentes = {
  itens: number;
  totalTon: number;
  mediaTon: number;
  fatias: { rotulo: string; ton: number; cor: string }[];
  meses: { mes: string; ton: number; pct: number; itens: number; dtInicial?: string; dtFinal?: string; lotes?: number }[];
  registros?: unknown[];
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
  previsao: number;
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
export type VideoPaletas = {
  porTamanho: { tamanho: string; paletes: number; itens: number; und: number }[];
  totalPaletes: number;
  totalItens: number;
  recebimento?: { porTamanho: { tamanho: string; paletes: number; itens: number; und: number }[]; totalPaletes: number; totalItens: number } | null;
  diasRecebidos?: number;
  diasQtd?: { dia: string; data: string; qtd: number; iso?: string }[];
  mensalQtd?: { mes: string; qtd: number }[];
  totalQtdRecebido?: number;
} | null;

export type RecebimentoSemanalDia = {
  iso: string;
  dia: string;
  data: string;
  ton: number;
  meta: number;
  pctMeta: number;
  porTamanho: { tamanho: string; paletes: number; itens: number; und: number }[];
  totalQtd: number;
  totalPaletes: number;
};

export type VideoResumoProps = Props;

type Props = {
  kpis: VideoKpi[];
  unidades: VideoUnidade[];
  ocupacao: VideoOcupacao;
  semana: { rotulo: string; total: string; dias: VideoDia[] } | null;
  turnos: VideoTurno[];
  mensal?: VideoMes[] | undefined;
  avarias?: VideoAvarias | undefined;
  pendentes?: VideoPendentes | undefined;
  reservados?: VideoReservados | undefined;
  semReserva?: VideoReservados | undefined;
  valorFaturado?: number | undefined;
  foraDeLinha?: VideoForaDeLinha | undefined;
  paletas?: VideoPaletas | undefined;
  recebimentoSemanal?: RecebimentoSemanalDia[] | undefined;
  producaoSemanal?: ProducaoSemanalDia[] | undefined;
  resumo?: { valor: number; previsto: number; ton: number; saldo: number; itens: number } | null;
  sincronizacao?: { em?: string; planilhas?: { nome: string; modificado?: string }[] } | undefined;
  onFechar?: () => void;
  onLogout?: () => void;
};

const TOTAL_CENAS = 14;
const DURACOES = [8000, 5000, 6500, 5000, 5000, 5000, 9000, 5500, 8000, 7000, 7000, 10000, 11000, 12000];

export default function VideoResumoDashboard({
  kpis,
  unidades,
  ocupacao,
  semana,
  turnos,
  mensal,
  avarias,
  pendentes,
  reservados,
  semReserva,
  valorFaturado,
  foraDeLinha,
  resumo,
  paletas,
  recebimentoSemanal,
  producaoSemanal,
  sincronizacao,
  onFechar,
  onLogout,
}: Props) {
  const [cena, setCena] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [anim, setAnim] = useState(false);
  const [cenaSaindo, setCenaSaindo] = useState<number | null>(null);
  const [relatorio, setRelatorio] = useState(false);
  const [exportando, setExportando] = useState(false);
  const cenaAnteriorRef = useRef(0);


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
      /* Na cena 0 o carrossel de cards trata as setas; nas demais, setas navegam cenas */
      if (cena !== 0) {
        if (e.key === "ArrowRight") setCena((s) => Math.min(s + 1, TOTAL_CENAS - 1));
        if (e.key === "ArrowLeft") setCena((s) => Math.max(s - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cena]);

  /* Trava o scroll enquanto o vídeo está aberto */
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  /* Payload único do relatório impresso e do Excel analítico. */
  const dadosPainel: VideoResumoProps = {
    kpis,
    unidades,
    ocupacao,
    semana,
    turnos,
    mensal,
    avarias,
    pendentes,
    reservados,
    semReserva,
    valorFaturado,
    foraDeLinha,
    paletas,
    recebimentoSemanal,
    producaoSemanal,
    resumo,
    sincronizacao,
  };

  /* Exporta o .xlsx analítico — pausa a apresentação enquanto monta o arquivo. */
  const exportarExcel = async () => {
    setPausado(true);
    setExportando(true);
    try {
      const { exportarExcelLopas } = await import("@/lib/export-excel-lopas");
      await exportarExcelLopas(dadosPainel);
    } catch (erro) {
      console.error("Falha ao gerar o Excel", erro);
    } finally {
      setExportando(false);
    }
  };

  const propsCena = {
    kpis,
    unidades,
    ocupacao,
    semana,
    turnos,
    mensal,
    avarias,
    pendentes,
    reservados,
    semReserva,
    valorFaturado,
    foraDeLinha,
    paletas,
    recebimentoSemanal,
    producaoSemanal,
    resumo,
    onReiniciar: () => setCena(0),
    onGerarRelatorio: () => { setPausado(true); setRelatorio(true); },
    onExportarExcel: exportarExcel,
    exportando,
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
      {/* Cada cena recebe uma foto da Lopas com movimento e transição suave. */}
      <ResumoBg cena={cena} />
      {/* Camadas de profundidade para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#4a6b20]/75 via-[#3a521a]/60 to-[#2e3f14]/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />

      {/* Dizeres da marca — watermark no canto inferior esquerdo */}
      <div className="pointer-events-none absolute bottom-8 left-4 z-[1] sm:bottom-10 sm:left-10">
        <p className="font-serif text-xs tracking-tight text-white/12 sm:text-lg sm:tracking-tight">
          Controle de Estoque CD Lopas
        </p>
        <p className="mt-0.5 text-[8px] font-semibold tracking-[0.3em] text-primary/15 uppercase sm:text-[11px]">
          Movidos pela fé
        </p>
      </div>

      {relatorio && (
        <RelatorioLopas dados={dadosPainel} onFechar={() => setRelatorio(false)} />
      )}

      {/* Conteúdo */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Topo — última sincronização + controle de saída */}
        <div className="flex items-center justify-end gap-3 px-5 pt-3 sm:px-8">

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
          <div key={cena} className="video-entra absolute inset-0 overflow-y-auto px-4 py-2 pb-20 sm:px-8">
            <div className="flex min-h-full items-center justify-center">
              <CenasApresentacao cena={cena} anim={anim} {...propsCena} />
            </div>
          </div>
          {cenaSaindo !== null && (
            <div key={`sai-${cenaSaindo}`} className="video-sai video-congelada absolute inset-0 overflow-y-auto px-4 py-2 pb-20 sm:px-8" aria-hidden>
              <div className="flex min-h-full items-center justify-center">
                <CenasApresentacao cena={cenaSaindo} anim {...propsCena} />
              </div>
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
