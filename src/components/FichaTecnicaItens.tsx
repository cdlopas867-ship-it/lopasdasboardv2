import { useEffect, useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { fmtInt, fmtMoeda, fmtMoeda2, fmtBr } from "@/lib/format";
import { ITENS_PADRAO, type ItemFicha } from "@/data/itens-estoque";
import { limparDesc, resolverFicha } from "@/data/fichas-drive";
import { carregarComposicoes, type Composicao } from "@/data/composicoes";
import { coresMascara, fundoMascara, tratamentoFoto } from "@/data/mascaras";
import ComposicaoItem from "@/components/ComposicaoItem";

const fmtMoedaC = fmtMoeda2;
const fmtNum = fmtBr;

const UNIDADE_CURTA: Record<string, string> = {
  "UNIDADE GUARDA ROUPAS": "Guarda-Roupas",
  "UNIDADE DE SALAS": "Salas",
  "UNIDADE DE COMPLEMENTOS": "Complementos",
};

const curto = (u: string) => UNIDADE_CURTA[u.toUpperCase()] ?? u;

function dims(desc: string): [number, number, number] | null {
  const m = desc.match(/(\d+[.,]\d+)\s*X\s*(\d+[.,]\d+)\s*X\s*(\d+[.,]\d+)/i);
  if (!m) return null;
  return [
    Number(m[1]!.replace(",", ".")),
    Number(m[2]!.replace(",", ".")),
    Number(m[3]!.replace(",", ".")),
  ];
}

const nome = (desc: string) => desc.replace(/\s*\d+[.,]\d+\s*X.*$/i, "").trim();
const acabamento = (mascara: string) => mascara.replace(/^\(\d+\)/, "").trim();

const INTERVALO_MS = 3000;

export default function FichaTecnicaItens({
  itens,
  composicoes,
}: {
  itens?: ItemFicha[] | undefined;
  composicoes?: Composicao[] | undefined;
}) {
  const base = useMemo(
    () => (itens && itens.length ? itens : ITENS_PADRAO).map((i) => ({ ...i, desc: limparDesc(i.desc) })),
    [itens],
  );
  const [busca, setBusca] = useState("");
  const [unidade, setUnidade] = useState("Todas");
  const [aberto, setAberto] = useState(false);
  const [idx, setIdx] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [corSel, setCorSel] = useState<Record<string, string>>({});

  const [baseComp, setBaseComp] = useState<Composicao[] | null>(
    composicoes?.length ? composicoes : null,
  );
  const [compEm, setCompEm] = useState<string | null>(null);
  useEffect(() => {
    if (composicoes?.length) {
      setBaseComp(composicoes);
      return;
    }
    let vivo = true;
    carregarComposicoes()
      .then((d) => {
        if (vivo && d) {
          setBaseComp(d.composicoes);
          setCompEm(d.geradoEm);
        }
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [composicoes]);

  const compPorItem = useMemo(() => {
    const m = new Map<string, Composicao[]>();
    for (const c of baseComp ?? []) {
      for (const v of c.volumes) m.set(v.item, [...(m.get(v.item) ?? []), c]);
    }
    return m;
  }, [baseComp]);

  const variantesPorNome = useMemo(() => {
    const m = new Map<string, ItemFicha[]>();
    for (const i of base) {
      if (i.saldo <= 0) continue;
      const n = nome(i.desc);
      m.set(n, [...(m.get(n) ?? []), i]);
    }
    return m;
  }, [base]);

  const unidades = useMemo(
    () => ["Todas", ...new Set(base.map((i) => curto(i.unidade)))],
    [base],
  );

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return base
      .filter((i) => unidade === "Todas" || curto(i.unidade) === unidade)
      .filter(
        (i) =>
          !q ||
          i.item.toLowerCase().includes(q) ||
          i.desc.toLowerCase().includes(q) ||
          i.mascara.toLowerCase().includes(q),
      )
      .map((i, ix) => ({ ...i, uid: `${i.item}-${ix}` }));
  }, [base, busca, unidade]);

  /* Reset idx quando a lista muda */
  useEffect(() => {
    setIdx(0);
    setAberto(false);
  }, [busca, unidade]);

  const proximo = useCallback(() => {
    setIdx((i) => (i + 1) % Math.max(lista.length, 1));
  }, [lista.length]);

  const anterior = useCallback(() => {
    setIdx((i) => (i - 1 + lista.length) % Math.max(lista.length, 1));
  }, [lista.length]);

  useEffect(() => {
    if (pausado || aberto || lista.length === 0) return;
    const t = setInterval(proximo, INTERVALO_MS);
    return () => clearInterval(t);
  }, [pausado, aberto, proximo, lista.length]);

  const itemAtual = lista[idx];

  return (
    <section id="fichas" className="border-t bg-background px-4 py-12 sm:px-8 sm:py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl">Ficha Técnica dos Itens</h2>
            <p className="mt-2 text-muted-foreground">
              {fmtInt(lista.length)} itens em estoque — rolagem automática, clique para a ficha completa.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar item, descrição ou acabamento…"
              className="w-64 rounded-full border bg-card px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="flex gap-1 rounded-full border bg-card p-1">
              {unidades.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnidade(u)}
                  className={cn(
                    "cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase transition-colors",
                    unidade === u
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        {lista.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            Nenhum item encontrado para esta busca.
          </p>
        ) : (
          itemAtual && (
            <FichaCarousel
              lista={lista}
              idx={idx}
              setIdx={setIdx}
              aberto={aberto}
              setAberto={setAberto}
              pausado={pausado}
              setPausado={setPausado}
              proximo={proximo}
              anterior={anterior}
              variantesPorNome={variantesPorNome}
              corSel={corSel}
              setCorSel={setCorSel}
              compPorItem={compPorItem}
              compEm={compEm}
            />
          )
        )}
      </div>
    </section>
  );
}

/* ---------- Carrossel ---------- */

function FichaCarousel({
  lista,
  idx,
  setIdx,
  aberto,
  setAberto,
  pausado,
  setPausado,
  proximo,
  anterior,
  variantesPorNome,
  corSel,
  setCorSel,
  compPorItem,
  compEm,
}: {
  lista: (ItemFicha & { uid: string })[];
  idx: number;
  setIdx: (n: number) => void;
  aberto: boolean;
  setAberto: (v: boolean) => void;
  pausado: boolean;
  setPausado: (v: boolean) => void;
  proximo: () => void;
  anterior: () => void;
  variantesPorNome: Map<string, ItemFicha[]>;
  corSel: Record<string, string>;
  setCorSel: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  compPorItem: Map<string, Composicao[]>;
  compEm: string | null;
}) {
  const i = lista[idx]!;
  const variantes = variantesPorNome.get(nome(i.desc)) ?? [i];
  const item = variantes.find((v) => v.mascara === (corSel[i.uid] ?? i.mascara)) ?? i;
  const d = dims(item.desc);
  const volUn = d ? d[0] * d[1] * d[2] : null;
  const pesoUn = item.saldo > 0 ? item.peso / item.saldo : 0;
  const ficha = resolverFicha(item.desc, item.unidade, item.mascara);
  const trato = ficha.fotoRealDaCor ? "sem" : tratamentoFoto(item.mascara);
  const temCor = trato !== "sem";
  const cor = coresMascara(item.mascara)[0];

  return (
    <>
      <div
        className="relative overflow-hidden rounded-3xl"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
      >
        {/* Imagem de fundo */}
        <img
          key={i.uid + idx}
          src={ficha.foto}
          alt={nome(i.desc)}
          className={cn(
            "aspect-[16/10] w-full object-cover transition-all duration-700",
            trato === "branca" && "brightness-[1.3] saturate-[.2]",
            trato === "preta" && "brightness-[.55] saturate-[.6]",
          )}
        />
        {/* Tingimento da cor — removido para manter a imagem original */}
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/65" />

        {/* Setas */}
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
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
        >
          <span className="mb-2 text-[11px] font-semibold tracking-[0.25em] text-primary uppercase">
            ITEM {i.item} · {curto(i.unidade)}
          </span>
          <h3 className="max-w-2xl font-serif text-4xl leading-tight tracking-tight text-white lg:text-5xl">
            {nome(i.desc)}
          </h3>
          <p className="mt-2 text-sm text-white/70">{acabamento(item.mascara)}</p>

          {/* Cores disponíveis — removidas do carrossel */}

          {/* Stats */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur">
              <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">Saldo</p>
              <p className="mt-1 text-xl font-bold text-white">{fmtInt(item.saldo)} un</p>
            </div>
            <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur">
              <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">Valor</p>
              <p className="mt-1 text-xl font-bold text-primary">{fmtMoedaC(item.valor)}</p>
            </div>
            {d && (
              <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur">
                <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">Dimensões</p>
                <p className="mt-1 text-base font-bold text-white">
                  {fmtNum(d[0], 3)} × {fmtNum(d[1], 3)} × {fmtNum(d[2], 3)} m
                </p>
              </div>
            )}
            <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur">
              <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">Curva ABC</p>
              <p className="mt-1 text-xl font-bold text-white">{item.curva}</p>
            </div>
          </div>

          {/* Botão ver ficha */}
          <button
            type="button"
            onClick={() => setAberto(!aberto)}
            className="mt-6 rounded-full border border-white/40 px-6 py-2 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-white/10"
          >
            {aberto ? "Fechar ficha" : "Ver ficha completa"}
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-white/10">
          <div
            key={idx + (pausado || aberto ? "p" : "r")}
            className="h-full bg-primary"
            style={{
              animation: pausado || aberto ? "none" : `video-segmento ${INTERVALO_MS}ms linear forwards`,
            }}
          />
        </div>

        {/* Indicadores */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {lista.map((_, i2) => (
            <button
              key={i2}
              type="button"
              onClick={() => setIdx(i2)}
              aria-label={`Item ${i2 + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i2 === idx ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/60",
              )}
            />
          ))}
        </div>
      </div>

      {/* Ficha técnica detalhada — abaixo do carrossel */}
      <div className={cn("expand-grid mt-4", aberto && "expand-grid-open")}>
        <div>
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
                  ITEM {item.item}
                </p>
                <h3 className="mt-1 font-serif text-2xl">{nome(item.desc)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <span className="rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {curto(item.unidade)} · {item.curva}
              </span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-6 text-sm sm:grid-cols-3 lg:grid-cols-4">
              {(
                [
                  ["Saldo em estoque", `${fmtInt(item.saldo)} un`],
                  ["Custo médio", fmtMoedaC(item.custo)],
                  ["Valor em estoque", fmtMoedaC(item.valor)],
                  ["Peso unitário", `${fmtNum(pesoUn, 1)} kg`],
                  ["Peso total", `${fmtNum(item.peso / 1000, 2)} t`],
                  [
                    "Dimensões (C×L×A)",
                    d ? `${fmtNum(d[0], 3)} × ${fmtNum(d[1], 3)} × ${fmtNum(d[2], 3)} m` : "—",
                  ],
                  ["Volume unitário", volUn ? `${fmtNum(volUn, 3)} m³` : "—"],
                  ["Volume em estoque", volUn ? `${fmtNum(volUn * item.saldo, 1)} m³` : "—"],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {k}
                  </dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <ComposicaoItem
              codigo={item.item}
              mascara={item.mascara}
              comps={compPorItem.get(i.item) ?? []}
              geradoEm={compEm}
            />

            {ficha.driveId && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Ficha técnica oficial 2026 · volume real
                  </p>
                  <a
                    href={`https://drive.google.com/file/d/${ficha.driveId}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold tracking-widest text-primary uppercase"
                  >
                    Abrir PDF ↗
                  </a>
                </div>
                <p className="mt-1 text-xs font-medium text-foreground">{ficha.titulo}</p>
                <iframe
                  src={`https://drive.google.com/file/d/${ficha.driveId}/preview`}
                  title={`Ficha técnica — ${ficha.titulo}`}
                  loading="lazy"
                  className="mt-2 h-80 w-full rounded-lg border bg-secondary/50"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
