import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { fmtInt, fmtMoeda, fmtMoeda2, fmtBr } from "@/lib/format";
import imgCadeiraApogeu from "@/assets/produtos/cadeira-apogeu.jpg";
import imgCadeiraRayla from "@/assets/produtos/cadeira-rayla.jpg";
import imgGrEasySlim from "@/assets/produtos/gr-easy-slim.jpg";
import imgSapateiraEsthela from "@/assets/produtos/sapateira-esthela.jpg";
import imgComodaLoop from "@/assets/produtos/comoda-loop.jpg";
import imgGrSerenata from "@/assets/produtos/gr-serenata.jpg";
import imgGrAlonzo from "@/assets/produtos/gr-alonzo.jpg";

/* ------- Top volumes de caixa — dados reais do estoque (set/2025) ------- */

const fmtMoedaC = fmtMoeda2;
const fmtM3 = (v: number, d = 1) => fmtBr(v, d);

type VolCaixa = {
  nome: string;
  componente: string;
  unidade: "Guarda-Roupas" | "Salas" | "Complementos";
  caixas: number;
  valorTotal: number;
  dims?: [number, number, number];
  imagem: string;
};

const TOP_VOLUMES: VolCaixa[] = [
  { nome: "Assento/Encosto Cad. Apogeu/Tessera", componente: "Caixa c/ 20", unidade: "Salas", caixas: 11772, valorTotal: 745335.1, dims: [0.585, 0.37, 0.43], imagem: imgCadeiraApogeu },
  { nome: "GR 8 Portas Easy Slim/Andara", componente: "Tampo/Lateral", unidade: "Guarda-Roupas", caixas: 1867, valorTotal: 478687.42, dims: [2.43, 0.46, 0.128], imagem: imgGrEasySlim },
  { nome: "GR 8 Portas Easy Slim/Andara Soft", componente: "Portas/Costas", unidade: "Guarda-Roupas", caixas: 1900, valorTotal: 411050.76, dims: [1.95, 0.6, 0.096], imagem: imgGrEasySlim },
  { nome: "Cadeira Apogeu/Rayla 2025", componente: "Caixa c/ 04", unidade: "Salas", caixas: 3633, valorTotal: 385995.48, dims: [0.525, 0.425, 0.136], imagem: imgCadeiraRayla },
  { nome: "Cadeira Apogeu/Rayla 2025", componente: "Caixa c/ 06", unidade: "Salas", caixas: 2241, valorTotal: 352418.45, dims: [0.545, 0.435, 0.183], imagem: imgCadeiraRayla },
  { nome: "Sapateira Esthela 2024", componente: "Volume completo", unidade: "Complementos", caixas: 2036, valorTotal: 304301.88, dims: [1.898, 0.625, 0.107], imagem: imgSapateiraEsthela },
  { nome: "Cômoda Loop II", componente: "Laterais/Gavetas", unidade: "Complementos", caixas: 1117, valorTotal: 213224.4, dims: [0.9, 0.492, 0.192], imagem: imgComodaLoop },
  { nome: "Assento/Encosto Cad. Rayla", componente: "Caixa c/ 2", unidade: "Salas", caixas: 3230, valorTotal: 210151.04, imagem: imgCadeiraApogeu },
  { nome: "GR 8 Portas Serenata", componente: "Tampo/Lateral", unidade: "Guarda-Roupas", caixas: 886, valorTotal: 208971.34, dims: [2.425, 0.468, 0.095], imagem: imgGrSerenata },
  { nome: "GR 6 Portas Alonzo/Like", componente: "Portas", unidade: "Guarda-Roupas", caixas: 1242, valorTotal: 206424.98, dims: [2.172, 0.39, 0.101], imagem: imgGrAlonzo },
];

const COR_UNIDADE: Record<VolCaixa["unidade"], string> = {
  "Guarda-Roupas": "text-primary",
  Salas: "text-amber-400",
  Complementos: "text-emerald-400",
};

const INTERVALO_MS = 3000;

export default function TopProdutosEstoque() {
  const [idx, setIdx] = useState(0);
  const [pausado, setPausado] = useState(false);

  const proximo = useCallback(() => {
    setIdx((i) => (i + 1) % TOP_VOLUMES.length);
  }, []);

  const anterior = useCallback(() => {
    setIdx((i) => (i - 1 + TOP_VOLUMES.length) % TOP_VOLUMES.length);
  }, []);

  useEffect(() => {
    if (pausado) return;
    const t = setInterval(proximo, INTERVALO_MS);
    return () => clearInterval(t);
  }, [pausado, proximo]);

  const v = TOP_VOLUMES[idx]!;
  const volUn = v.dims ? v.dims[0] * v.dims[1] * v.dims[2] : null;
  const volTotal = volUn !== null ? volUn * v.caixas : null;
  const valorUn = v.valorTotal / v.caixas;

  const somaCaixas = TOP_VOLUMES.reduce((s, v) => s + v.caixas, 0);
  const somaValor = TOP_VOLUMES.reduce((s, v) => s + v.valorTotal, 0);
  const somaM3 = TOP_VOLUMES.reduce(
    (s, v) => s + (v.dims ? v.dims[0] * v.dims[1] * v.dims[2] * v.caixas : 0),
    0,
  );

  return (
    <section id="produtos" className="scroll-mt-20 border-t px-4 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl">Maior Concentração em Estoque</h2>
            <p className="mt-2 text-muted-foreground">
              Os 10 volumes de caixa de maior valor em estoque no CD — rolagem automática.
            </p>
          </div>
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Caixas · Valor em estoque
          </span>
        </div>

        {/* Carrossel automático */}
        <div
          className="relative overflow-hidden rounded-3xl sm:aspect-[16/10]"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
        >
          {/* Imagem de fundo — preenche o container; no mobile a altura vem do conteúdo */}
          <img
            key={v.nome + idx}
            src={v.imagem}
            alt={v.nome}
            className="absolute inset-0 h-full w-full object-cover transition-all duration-700"
          />
          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40" />

          {/* Setas de navegação */}
          <button
            type="button"
            onClick={anterior}
            aria-label="Anterior"
            className="absolute top-1/2 left-4 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/30 text-2xl text-white backdrop-blur transition-all hover:bg-black/50 hover:border-white/60"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={proximo}
            aria-label="Próximo"
            className="absolute top-1/2 right-4 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/30 text-2xl text-white backdrop-blur transition-all hover:bg-black/50 hover:border-white/60"
          >
            ›
          </button>

          {/* Conteúdo centralizado */}
          <div className="relative z-10 flex flex-col items-center px-4 py-10 text-center sm:absolute sm:inset-0 sm:justify-center sm:px-8 sm:py-0">
            <span className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-primary uppercase sm:text-[11px] sm:tracking-[0.25em]">
              {String(idx + 1).padStart(2, "0")} · {v.unidade}
            </span>
            <h3 className="max-w-2xl font-serif text-2xl leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {v.nome}
            </h3>
            <p className="mt-1 text-sm text-white/60 sm:mt-2">{v.componente}</p>

            {/* Stats em linha — grid no mobile, flex no desktop */}
            <div className="mt-4 grid w-full max-w-md grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
              <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur sm:px-5 sm:py-3">
                <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">
                  Caixas
                </p>
                <p className="mt-1 text-lg font-bold text-white sm:text-xl">{fmtInt(v.caixas)}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur sm:px-5 sm:py-3">
                <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">
                  Valor em estoque
                </p>
                <p className="mt-1 text-lg font-bold text-primary sm:text-xl">{fmtMoedaC(v.valorTotal)}</p>
              </div>
              {volTotal !== null && (
                <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur sm:px-5 sm:py-3">
                  <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">
                    Volume total
                  </p>
                  <p className="mt-1 text-lg font-bold text-white sm:text-xl">{fmtM3(volTotal)} m³</p>
                </div>
              )}
              <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur sm:px-5 sm:py-3">
                <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">
                  Valor unitário
                </p>
                <p className="mt-1 text-lg font-bold text-white sm:text-xl">{fmtMoedaC(valorUn)}/cx</p>
              </div>
            </div>
          </div>

          {/* Barra de progresso do auto-play */}
          <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-white/10">
            <div
              key={idx + (pausado ? "p" : "r")}
              className="h-full bg-primary"
              style={{
                animation: pausado
                  ? "none"
                  : `video-segmento ${INTERVALO_MS}ms linear forwards`,
              }}
            />
          </div>

          {/* Indicadores */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {TOP_VOLUMES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Item ${i + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === idx ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        </div>

        {/* Resumo total */}
        <div className="mt-6 rounded-2xl border bg-card px-5 py-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Os 10 maiores volumes somam{" "}
            <strong className="text-foreground">{fmtInt(somaCaixas)} caixas</strong> ·{" "}
            <strong className="text-foreground">{fmtM3(somaM3)} m³</strong> ·{" "}
            <strong className="text-primary">{fmtMoedaC(somaValor)}</strong> em estoque.
          </p>
        </div>
      </div>
    </section>
  );
}
