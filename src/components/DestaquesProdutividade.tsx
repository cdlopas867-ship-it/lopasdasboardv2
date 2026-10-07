/* Destaques do período — top melhores e top piores por equipe (Separação e
   Estoque), com as equipes definidas pelo cargo/função do colaborador. Usa o
   tipo de atividade ativo na cena Produtividade (mesmo período e mesmos dados). */

import { fmtBrMax } from "@/lib/format";
import type { ProdColaborador, ProdTipo } from "@/data/produtividade";

const MELHOR = "#4ADE80";
const PIOR = "#F87171";
const TOPO = 3;

/* Cargos que formam a equipe de Estoque; os ligados à expedição (expedidor,
   auxiliar/líder/coordenador/supervisor de expedição e etiquetador) formam a
   equipe de Separação. Sem casamento de cargo (apelido não encontrado no
   cadastro), o colaborador não entra em nenhuma equipe. */
const CARGOS_ESTOQUE = ["estoque", "empilhadeira", "carga e descarga", "arrumador"];

export function equipeDoCargo(cargo: string): "separacao" | "estoque" | null {
  const c = cargo.toLowerCase();
  if (!c) return null;
  if (CARGOS_ESTOQUE.some((k) => c.includes(k))) return "estoque";
  if (c.includes("expedi") || c.includes("etiquetador")) return "separacao";
  return null;
}

type Equipe = { nome: string; melhores: ProdColaborador[]; piores: ProdColaborador[] };

function montarEquipe(nome: string, tipo: ProdTipo, chave: "separacao" | "estoque"): Equipe {
  const colabs = tipo.colaboradores
    .filter((c) => c.ton > 0 && equipeDoCargo(c.cargo) === chave)
    .sort((a, b) => b.ton - a.ton);
  return {
    nome,
    melhores: colabs.slice(0, TOPO),
    /* Piores = últimos colocados, sem repetir quem já aparece nos melhores. */
    piores: colabs.slice(Math.max(TOPO, colabs.length - TOPO)).reverse(),
  };
}

export default function DestaquesProdutividade({ tipo }: { tipo: ProdTipo }) {
  const equipes = [
    montarEquipe("Equipe Separação", tipo, "separacao"),
    montarEquipe("Equipe Estoque", tipo, "estoque"),
  ];

  return (
    <div className="mx-auto mt-3 w-full max-w-4xl">
      <p className="mb-1.5 text-center text-[9px] font-bold tracking-[0.25em] text-white/60 uppercase">
        Destaques do mês · top melhores e top piores
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {equipes.map((e) => (
          <CardEquipe key={e.nome} {...e} />
        ))}
      </div>
    </div>
  );
}

function CardEquipe({ nome, melhores, piores }: Equipe) {
  return (
    <div className="video-sobe min-w-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
      <p className="border-b border-white/20 pb-1 text-[10px] font-bold tracking-[0.18em] text-white uppercase">
        {nome}
      </p>
      <Lista titulo="▲ Melhores" cor={MELHOR} itens={melhores} />
      <Lista titulo="▼ Piores" cor={PIOR} itens={piores} />
    </div>
  );
}

function Lista({
  titulo,
  cor,
  itens,
}: {
  titulo: string;
  cor: string;
  itens: ProdColaborador[];
}) {
  if (!itens.length) return null;
  return (
    <div className="mt-1.5">
      <p className="text-[8px] font-bold tracking-widest uppercase" style={{ color: cor }}>
        {titulo}
      </p>
      <table className="w-full text-left text-[11px] text-white">
        <tbody>
          {itens.map((c, i) => (
            <tr key={c.nome} className="border-b border-white/10 last:border-0">
              <td className="min-w-0 py-0.5 pr-2">
                <span className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[9px] font-bold" style={{ color: cor }}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 truncate font-bold text-white" title={c.nome}>
                    {c.nome}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[9px] text-white/55" title={`${c.cargo || "—"} · ${c.turma}`}>
                  {c.cargo || "—"} · {c.turma}
                </span>
              </td>
              <td className="py-0.5 text-right font-mono text-[12px] font-bold" style={{ color: cor }}>
                {fmtBrMax(c.ton, 0)} t
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
