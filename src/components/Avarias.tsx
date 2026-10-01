import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/format";
import type { Avaria } from "@/lib/avarias";
import { ordemMes } from "@/lib/avarias";
import { resolverFicha, limparDesc } from "@/data/fichas-drive";
import { corMascara, fundoMascara, tratamentoFoto } from "@/data/mascaras";
import { imagemAvaria } from "@/data/avarias-imagens";

const MESES_CURTO: Record<string, string> = {
  JANEIRO: "Jan", FEVEREIRO: "Fev", "MARÇO": "Mar", MARCO: "Mar", ABRIL: "Abr",
  MAIO: "Mai", JUNHO: "Jun", JULHO: "Jul", AGOSTO: "Ago",
  SETEMBRO: "Set", OUTUBRO: "Out", NOVEMBRO: "Nov", DEZEMBRO: "Dez",
};

const normalizarMotivo = (motivo = "") =>
  String(motivo)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

/* Tipos de avaria — imagem ilustrativa + descrição do motivo */
const TIPOS_AVARIA: Record<string, { img: string; desc: string }> = {
  "PREGO NO PALETE": { img: imagemAvaria("PREGO NO PALETE"), desc: "Prego do palete perfura e danifica o volume" },
  "DANIFICADO": { img: imagemAvaria("DANIFICADO"), desc: "Embalagem amassada, rasgada ou comprometida" },
  "ESPELHO QUEBRADO": { img: imagemAvaria("ESPELHO QUEBRADO"), desc: "Espelho trincado ou estilhaçado" },
  "MOLHADO": { img: imagemAvaria("MOLHADO"), desc: "Volume exposto à umidade ou chuva" },
  "EMPILHADEIRA": { img: imagemAvaria("EMPILHADEIRA"), desc: "Impacto de empilhadeira na estrutura" },
  "SEPARAÇÃO": { img: imagemAvaria("SEPARAÇÃO"), desc: "Erro de separação no picking" },
  "SEPARACAO": { img: imagemAvaria("SEPARACAO"), desc: "Erro de separação no picking" },
  "CONFERENTE CARGA": { img: imagemAvaria("CONFERENTE CARGA"), desc: "Divergência na conferência de carga" },
  "ETIQUETA TROCADA": { img: imagemAvaria("ETIQUETA TROCADA"), desc: "Etiqueta incorreta no volume" },
};

function resolverTipoAvaria(motivo?: string) {
  if (!motivo) return undefined;
  const chave = normalizarMotivo(motivo);

  return (
    TIPOS_AVARIA[motivo] ??
    Object.entries(TIPOS_AVARIA).find(([key]) => normalizarMotivo(key) === chave)?.[1]
  );
}

function fmtData(s: string): string {
  const m = s?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[1]}/${m[2]}` : s?.slice(0, 10) ?? "";
}

function mesCurto(mes: string): string {
  return mes.toUpperCase().trim();
}

function extrairMascara(desc: string): string {
  const parts = limparDesc(desc).split(" - ");
  return parts.length > 1 ? parts[parts.length - 1]!.trim() : "";
}

function MiniFoto({ descricao, cor }: { descricao: string; cor: string }) {
  const mascara = extrairMascara(descricao);
  const ficha = resolverFicha(descricao, "");
  const c = corMascara(mascara);
  const trato = ficha.fotoRealDaCor ? "sem" : tratamentoFoto(mascara);
  const temCor = trato !== "sem";
  return (
    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg border">
      <img src={ficha.foto} alt="" loading="lazy" className="h-full w-full object-cover" />
      {temCor && (
        <>
          <div
            className="absolute inset-0"
            style={{ background: c, mixBlendMode: "color", opacity: trato === "branca" ? 0.35 : 0.6 }}
          />
          {trato !== "branca" && (
            <div
              className="absolute inset-0"
              style={{ background: c, mixBlendMode: "luminosity", opacity: trato === "preta" ? 0.55 : 0.5 }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function Avarias({ avarias, atualizadoEm }: { avarias?: Avaria[] | undefined; atualizadoEm?: string }) {
  const [mesExpandido, setMesExpandido] = useState<string | null>(() => {
    if (!avarias?.length) return null;
    const pm = new Map<string, Avaria[]>();
    for (const a of avarias) {
      if (!a.mes) continue;
      const key = a.mes.toUpperCase().trim();
      if (!(key in MESES_CURTO)) continue;
      if (!pm.has(key)) pm.set(key, []);
      pm.get(key)!.push(a);
    }
    const ms = [...pm.keys()].sort((a, b) => ordemMes(a) - ordemMes(b));
    return (ms.length >= 2 ? ms[ms.length - 2] : ms[0]) ?? null;
  });

  const porMes = new Map<string, Avaria[]>();
  for (const a of avarias ?? []) {
    if (!a.mes) continue;
    const key = a.mes.toUpperCase().trim();
    if (!(key in MESES_CURTO)) continue;
    if (!porMes.has(key)) porMes.set(key, []);
    porMes.get(key)!.push(a);
  }
  const meses = [...porMes.keys()].sort((a, b) => ordemMes(a) - ordemMes(b));

  const totalVolumesComMotivo = (avarias ?? [])
    .filter((a) => a.motivo?.trim())
    .reduce((soma, a) => soma + a.quantidade, 0);

  const motivosMap = new Map<string, number>();
  for (const a of avarias ?? []) {
    const m = a.motivo?.trim() || "Sem motivo";
    motivosMap.set(m, (motivosMap.get(m) ?? 0) + a.quantidade);
  }
  const motivosSorted = [...motivosMap.entries()].sort((a, b) => b[1] - a[1]);

  const INTERVALO_MS = 3000;
  const [idxAvaria, setIdxAvaria] = useState(0);
  const [pausadoAvaria, setPausadoAvaria] = useState(false);

  const proximoAvaria = useCallback(() => {
    setIdxAvaria((i) => (i + 1) % Math.max(motivosSorted.length, 1));
  }, [motivosSorted.length]);

  const anteriorAvaria = useCallback(() => {
    setIdxAvaria((i) => (i - 1 + motivosSorted.length) % Math.max(motivosSorted.length, 1));
  }, [motivosSorted.length]);

  useEffect(() => {
    if (pausadoAvaria || motivosSorted.length === 0) return;
    const t = setInterval(proximoAvaria, INTERVALO_MS);
    return () => clearInterval(t);
  }, [pausadoAvaria, proximoAvaria, motivosSorted.length]);

  useEffect(() => {
    setIdxAvaria(0);
  }, [motivosSorted.length]);

  return (
    <section id="avarias" className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-20 scroll-mt-20">
      <div className="mb-12">
        <h2 className="font-serif text-3xl sm:text-4xl">Avarias e Movimentações</h2>
        <div className="mt-2 flex items-center gap-3">
          <p className="text-muted-foreground">
            Índices de movimentação e tipos de avaria — clique num mês para ver os
            itens detalhados.
          </p>
          {atualizadoEm && (
            <span className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Atualizado em {atualizadoEm}
            </span>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-4 font-serif text-2xl">Tipos de Avaria</h3>
        {motivosSorted.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground/60">
            Aguardando importação de avarias
          </p>
        ) : (
          <div
            className="relative overflow-hidden rounded-3xl bg-brand-dark sm:aspect-[16/10]"
            onMouseEnter={() => setPausadoAvaria(true)}
            onMouseLeave={() => setPausadoAvaria(false)}
          >
            {(() => {
              const [motivo, count] = motivosSorted[idxAvaria] ?? ["", 0];
              const tipo = resolverTipoAvaria(motivo);
              const imagem = motivo ? imagemAvaria(motivo) : "";
              const pct = totalVolumesComMotivo > 0 ? ((count / totalVolumesComMotivo) * 100).toFixed(1) : "0.0";
              return (
                <>
                  <img
                    src={imagem}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/65" />

                  <button
                    type="button"
                    onClick={anteriorAvaria}
                    aria-label="Anterior"
                    className="absolute top-1/2 left-4 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/30 text-2xl text-white backdrop-blur-sm hover:bg-black/50"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={proximoAvaria}
                    aria-label="Próximo"
                    className="absolute top-1/2 right-4 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/30 text-2xl text-white backdrop-blur-sm hover:bg-black/50"
                  >
                    ›
                  </button>

                  <div
                    className="relative z-10 flex flex-col items-center px-4 py-10 text-center sm:absolute sm:inset-0 sm:justify-center sm:px-8 sm:py-0"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
                  >
                    <span className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-primary uppercase sm:text-[11px] sm:tracking-[0.25em]">
                      Tipo de Avaria · {idxAvaria + 1} de {motivosSorted.length}
                    </span>
                    <h3 className="max-w-2xl font-serif text-2xl leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                      {motivo}
                    </h3>
                    {tipo && <p className="mt-2 max-w-md text-sm text-white/70">{tipo.desc}</p>}

                    <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
                      <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur sm:px-5 sm:py-3">
                        <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">Volumes</p>
                        <p className="mt-1 text-lg font-bold text-white sm:text-xl">{fmtInt(count)}</p>
                      </div>
                      <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur sm:px-5 sm:py-3">
                        <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">% do total</p>
                        <p className="mt-1 text-lg font-bold text-primary sm:text-xl">{pct}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-white/10">
                    <div
                      key={idxAvaria + (pausadoAvaria ? "p" : "r")}
                      className="h-full bg-primary"
                      style={{
                        animation: pausadoAvaria ? "none" : `video-segmento ${INTERVALO_MS}ms linear forwards`,
                      }}
                    />
                  </div>

                  <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                    {motivosSorted.map((_, i2) => (
                      <button
                        key={i2}
                        type="button"
                        onClick={() => setIdxAvaria(i2)}
                        aria-label={`Tipo ${i2 + 1}`}
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          i2 === idxAvaria ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/60",
                        )}
                      />
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-serif text-2xl">Classificação por mês</h3>
          <div className="flex items-center gap-3">
            <select
              value={mesExpandido ?? ""}
              onChange={(e) => setMesExpandido(e.target.value || null)}
              className="cursor-pointer rounded-lg border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="">Buscar por mês…</option>
              {meses.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {mesExpandido && (
              <button
                type="button"
                onClick={() => setMesExpandido(null)}
                className="cursor-pointer text-xs font-semibold tracking-wider text-primary uppercase hover:underline"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
        {meses.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground/60">
            Aguardando importação de avarias
          </p>
        )}
        {meses.length > 0 && (
          <>
            <div
              className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {meses.map((m) => {
                const items = porMes.get(m)!;
                const ativo = mesExpandido === m;

                const motivosMes = new Map<string, number>();
                for (const a of items) {
                  const mot = a.motivo?.trim() || "Sem motivo";
                  motivosMes.set(mot, (motivosMes.get(mot) ?? 0) + a.quantidade);
                }
                const motivoPred = [...motivosMes.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .find(([mot]) => resolverTipoAvaria(mot))?.[0];
                const tipoPred = motivoPred ? resolverTipoAvaria(motivoPred) : undefined;
                const totalMes = items.filter((a) => a.motivo?.trim()).reduce((soma, a) => soma + a.quantidade, 0);

                return (
                  <div
                    key={m}
                    style={{ scrollSnapAlign: "start" }}
                    className="w-56 shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => setMesExpandido(ativo ? null : m)}
                      aria-expanded={ativo}
                      className={cn(
                        "card-lift relative w-full cursor-pointer overflow-hidden rounded-2xl border text-left transition-all duration-300",
                        ativo ? "border-primary shadow-xl" : "border-border hover:border-primary/30",
                      )}
                    >
                      {tipoPred ? (
                        <>
                          <img
                            src={tipoPred.img}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-card" />
                      )}

                      <div className="relative p-5">
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-2xl text-white" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>{mesCurto(m)}</span>
                          <span
                            className={cn(
                              "flex size-6 items-center justify-center rounded-full border text-xs transition-transform duration-300",
                              ativo
                                ? "rotate-45 border-primary bg-primary text-primary-foreground"
                                : "border-white/50 bg-black/30 text-white backdrop-blur",
                            )}
                          >
                            +
                          </span>
                        </div>
                        <p className="mt-2 text-lg font-bold text-white" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>{fmtInt(totalMes)}</p>
                        <p className="text-[10px] font-semibold tracking-widest text-white/70 uppercase">
                          volumes
                        </p>
                        {motivoPred && tipoPred && (
                          <p className="mt-2 text-[9px] font-medium tracking-wider text-primary uppercase">
                            {motivoPred}
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {mesExpandido && porMes.get(mesExpandido) && (
              <div className="mt-4 rounded-2xl border border-primary/40 bg-card shadow-lg">
                <div className="flex items-center justify-between border-b p-4">
                  <h4 className="font-serif text-xl">{mesCurto(mesExpandido)}</h4>
                  <button
                    type="button"
                    onClick={() => setMesExpandido(null)}
                    className="cursor-pointer text-xs font-semibold tracking-wider text-primary uppercase hover:underline"
                  >
                    Fechar
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {porMes.get(mesExpandido)!.slice(0, 100).map((a, i) => {
                    const tipoDetalhe = resolverTipoAvaria(a.motivo);
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2 border-b border-l-4 border-l-primary/40 p-3 last:border-b-0"
                      >
                        {tipoDetalhe && (
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-red-500/40">
                            <img src={tipoDetalhe.img} alt={a.motivo} loading="lazy" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium leading-snug text-foreground">
                            {a.descricao}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span
                              className="size-2 rounded-full border border-black/10"
                              style={{ background: fundoMascara(a.cor) }}
                            />
                            {fmtData(a.data)} · {a.colaborador}
                            {a.motivo && (
                              <span className="font-semibold text-red-500">· {a.motivo}</span>
                            )}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold text-foreground">
                            {a.quantidade} un
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {porMes.get(mesExpandido)!.length > 100 && (
                    <p className="p-3 text-center text-[10px] text-muted-foreground">
                      +{porMes.get(mesExpandido)!.length - 100} movimentações…
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
