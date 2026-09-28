import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/format";
import type { Composicao } from "@/data/composicoes";
import { fundoMascara, normalizarMascara } from "@/data/mascaras";

const norm = normalizarMascara;
const nomeCurto = (desc: string) => desc.replace(/\s*\d+[.,]\d+\s*X.*$/i, "").trim();

const MAX_COMPOSICOES = 4;

/* Lista de composições que contêm o item clicado, com o saldo em estoque de
   cada volume agrupado por cor (máscara). */
export default function ComposicaoItem({
  codigo,
  mascara,
  comps,
  geradoEm,
}: {
  codigo: string;
  mascara: string;
  comps: Composicao[];
  geradoEm?: string | null;
}) {
  if (!comps.length) return null;
  const alvo = norm(mascara);
  const visiveis = comps.slice(0, MAX_COMPOSICOES);

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Composição do produto · saldo em estoque por cor
        </p>
        {geradoEm && (
          <span className="text-[10px] font-medium text-muted-foreground/70">{geradoEm}</span>
        )}
      </div>

      <div className="mt-2 space-y-3">
        {visiveis.map((c) => {
          const grupos = new Map<string, Composicao["volumes"]>();
          for (const v of c.volumes) {
            const chave = v.mascara || "—";
            grupos.set(chave, [...(grupos.get(chave) ?? []), v]);
          }
          /* cor do item clicado primeiro */
          const ordenadas = [...grupos.entries()].sort(
            (a, b) => Number(norm(b[0]) === alvo) - Number(norm(a[0]) === alvo),
          );
          return (
            <div key={c.cod} className="rounded-xl border bg-secondary/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm leading-tight font-bold">{c.nome}</p>
                  {c.produto && (
                    <p className="mt-0.5 text-[10px] tracking-wider text-muted-foreground uppercase">
                      {c.produto}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full border bg-card px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  {c.curva} · {fmtInt(c.saldo)} vol
                </span>
              </div>

              <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
                {ordenadas.map(([m, vols]) => (
                  <div key={m}>
                    <div className="flex items-center gap-2 border-b pb-1">
                      <span
                        className="size-3 shrink-0 rounded-full border"
                        style={{ background: fundoMascara(m) }}
                      />
                      <span className="truncate text-[11px] font-bold tracking-wide">{m}</span>
                      <span className="ml-auto text-[11px] font-semibold text-muted-foreground">
                        {fmtInt(vols.reduce((s, v) => s + v.saldo, 0))} un
                      </span>
                    </div>
                    {vols.map((v, ix) => {
                      const esteItem = v.item === codigo;
                      const estaCor = esteItem && norm(v.mascara || "—") === alvo;
                      return (
                        <div
                          key={`${v.item}-${ix}`}
                          className={cn(
                            "flex items-center justify-between gap-3 px-1 py-1 text-xs",
                            estaCor
                              ? "rounded-md bg-primary/15 font-semibold"
                              : esteItem && "font-medium",
                            !esteItem && v.saldo === 0 && "text-muted-foreground/60",
                          )}
                        >
                          <span className="truncate">{nomeCurto(v.desc)}</span>
                          <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                            {estaCor ? (
                              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-primary-foreground uppercase">
                                este item
                              </span>
                            ) : (
                              esteItem && (
                                <span className="text-[9px] font-bold tracking-wider text-primary/70 uppercase">
                                  outra cor
                                </span>
                              )
                            )}
                            <span>{fmtInt(v.saldo)}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {comps.length > MAX_COMPOSICOES && (
        <p className="mt-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          + {comps.length - MAX_COMPOSICOES} outras composições com este volume
        </p>
      )}
    </div>
  );
}
