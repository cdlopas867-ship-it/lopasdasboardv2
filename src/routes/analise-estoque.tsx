import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { analisarPlanilha, somar, type ItemAnalise, type ResultadoAnalise } from "@/lib/analise-estoque";
import { fmtInt, fmtMoeda, fmtBrMax } from "@/lib/format";
import type { PosicaoEstoque } from "@/data/fora-de-linha";

export const Route = createFileRoute("/analise-estoque")({
  head: () => ({
    meta: [
      { title: "Análise de Estoque · Lopas 2026" },
      { name: "description", content: "Importe a posição de estoque e veja o que está em linha, fora de linha, reservado e sem reserva." },
      { property: "og:title", content: "Análise de Estoque · Lopas 2026" },
      { property: "og:description", content: "Classificação item a item do estoque do CD Lopas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const { autenticado, pronto } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (pronto && !autenticado) navigate({ to: "/login", replace: true }); }, [pronto, autenticado, navigate]);
  if (!pronto || !autenticado) return null;
  return <AnaliseEstoque />;
}

const RES_ROT = { "SEM RESERVA": "Sem reserva", PARCIAL: "Reserva parcial", TOTAL: "100% reservado" } as const;

function Card({ titulo, p, cor }: { titulo: string; p: PosicaoEstoque; cor: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4">
      <p className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: cor }}>{titulo}</p>
      <p className="mt-1 text-3xl font-extrabold text-white">{fmtBrMax(p.pesoTon, 1)} t</p>
      <p className="text-sm text-white/70">{fmtInt(p.itens)} itens · {fmtInt(p.saldoFocco)} peças</p>
      <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-white/80">
        <span>Reservado</span><span className="text-right font-mono">{fmtInt(p.reservas)} · {fmtBrMax(p.pesoReservadoTon, 1)} t</span>
        <span>Disponível</span><span className="text-right font-mono">{fmtInt(p.disponivel)}</span>
        <span>Valor</span><span className="text-right font-mono">{fmtMoeda(p.valorEstoque)}</span>
        <span>Valor reservado</span><span className="text-right font-mono">{fmtMoeda(p.valorReservado)}</span>
      </div>
    </div>
  );
}

function AnaliseEstoque() {
  const [res, setRes] = useState<ResultadoAnalise | null>(null);
  const [arquivo, setArquivo] = useState("");
  const [erro, setErro] = useState("");
  const [status, setStatus] = useState("");
  const [sit, setSit] = useState("");
  const [reserva, setReserva] = useState("");
  const [cat, setCat] = useState("");
  const [busca, setBusca] = useState("");

  async function abrir(f: File) {
    setErro(""); setStatus(""); setRes(null);
    try { setRes(analisarPlanilha(await f.arrayBuffer())); setArquivo(f.name); }
    catch (e) { setErro(e instanceof Error ? e.message : "Não consegui ler a planilha."); }
  }

  const filtrados = useMemo(() => {
    if (!res) return [] as ItemAnalise[];
    const q = busca.trim().toLowerCase();
    return res.itens.filter((i) =>
      (!sit || i.situacao === sit) && (!reserva || i.reserva === reserva) && (!cat || i.categoria === cat) &&
      (!q || i.desc.toLowerCase().includes(q) || i.chave.toLowerCase().includes(q) || i.mascara.toLowerCase().includes(q)),
    ).sort((a, b) => b.pesoKg - a.pesoKg);
  }, [res, sit, reserva, cat, busca]);

  const categorias = useMemo(() => [...new Set(res?.itens.map((i) => i.categoria) ?? [])].sort(), [res]);
  const somaFiltro = useMemo(() => somar(filtrados, "FILTRO"), [filtrados]);

  const matriz = useMemo(() => {
    if (!res) return [];
    return (["EM LINHA", "FORA DE LINHA"] as const).map((s) => ({
      s,
      cols: (["SEM RESERVA", "PARCIAL", "TOTAL"] as const).map((r) => somar(res.itens.filter((i) => i.situacao === s && i.reserva === r), r)),
    }));
  }, [res]);

  async function aplicar() {
    if (!res) return;
    setStatus("Enviando…");
    const r = await fetch("/api/fora-de-linha", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        arquivo,
        itens: res.itens.filter((i) => i.situacao === "FORA DE LINHA").map(({ situacao: _s, reserva: _r, ...i }) => i),
        posicaoEmLinha: res.emLinha, posicaoForaDeLinha: res.foraDeLinha, posicaoTotal: res.total,
      }),
    }).catch(() => null);
    setStatus(r?.ok ? "Pronto! O painel e a tela Fora de linha já mostram estes números." : "Não consegui gravar no painel. Tente de novo.");
  }

  const sel = "rounded-md border border-white/20 bg-black/40 px-2 py-1.5 text-sm text-white";

  return (
    <div className="min-h-screen bg-[#16210c] px-4 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">Análise de estoque</h1>
            <p className="text-sm text-white/60">Importe a posição de estoque: cada item é classificado em linha / fora de linha e com / sem reserva.</p>
          </div>
          <a href="/" className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-widest uppercase hover:bg-white/20">Voltar ao painel</a>
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/25 bg-white/5 p-6 text-center hover:bg-white/10">
          <span className="font-bold">{arquivo ? `Arquivo: ${arquivo}` : "Clique para escolher a planilha (.xlsx)"}</span>
          <span className="text-xs text-white/50">Ex.: Estoque_EmLinha_x_ForaDeLinha.xlsx</span>
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void abrir(f); e.target.value = ""; }} />
        </label>
        {erro && <p className="mt-3 rounded-md bg-red-500/20 p-3 text-sm">{erro}</p>}

        {res && (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Card titulo="Em linha" p={res.emLinha} cor="#00FFCC" />
              <Card titulo="Fora de linha" p={res.foraDeLinha} cor="#FFA500" />
              <Card titulo="Total geral" p={res.total} cor="#ffffff" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={aplicar} className="rounded-full bg-[#8bc34a] px-5 py-2 text-sm font-bold text-black hover:brightness-110">
                Atualizar o painel com esta planilha
              </button>
              {status && <span className="text-sm text-white/80">{status}</span>}
            </div>

            <h2 className="mt-6 text-sm font-bold tracking-widest text-white/70 uppercase">Situação × Reserva (toneladas · itens)</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/20 text-left text-xs text-white/60"><th className="py-1"></th><th>Sem reserva</th><th>Reserva parcial</th><th>100% reservado</th></tr></thead>
                <tbody>
                  {matriz.map((m) => (
                    <tr key={m.s} className="border-b border-white/10">
                      <td className="py-1.5 font-bold">{m.s}</td>
                      {m.cols.map((c) => (
                        <td key={c.grupo} className="font-mono">
                          <button type="button" className="hover:underline" onClick={() => { setSit(m.s); setReserva(c.grupo); }}>
                            {fmtBrMax(c.pesoTon, 1)} t · {fmtInt(c.itens)}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(res.conferencia.length > 0 || res.avisos.length > 0) && (
              <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4">
                <h2 className="text-sm font-bold tracking-widest text-white/70 uppercase">Conferência</h2>
                <p className="text-xs text-white/50">Totais recalculados item a item (aba {res.abaUsada}) comparados com a aba Resumo.</p>
                {res.conferencia.length > 0 && (
                  <p className="mt-2 text-sm font-bold">
                    {res.conferencia.every((c) => c.ok) ? "✔ Tudo bate com o Resumo da planilha." : `⚠ ${res.conferencia.filter((c) => !c.ok).length} total(is) não batem:`}
                  </p>
                )}
                <ul className="mt-1 text-xs">
                  {res.conferencia.filter((c) => !c.ok).map((c) => (
                    <li key={c.rotulo}>{c.rotulo}: Resumo {fmtBrMax(c.planilha, 1)} × itens {fmtBrMax(c.calculado, 1)}</li>
                  ))}
                  {res.avisos.map((a) => <li key={a} className="text-white/70">• {a}</li>)}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar item, descrição, cor…" className={`${sel} min-w-56 flex-1`} />
              <select value={sit} onChange={(e) => setSit(e.target.value)} className={sel}><option value="">Todas situações</option><option>EM LINHA</option><option>FORA DE LINHA</option></select>
              <select value={reserva} onChange={(e) => setReserva(e.target.value)} className={sel}><option value="">Todas reservas</option>{Object.entries(RES_ROT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <select value={cat} onChange={(e) => setCat(e.target.value)} className={sel}><option value="">Todas categorias</option>{categorias.map((c) => <option key={c}>{c}</option>)}</select>
              <button type="button" onClick={() => { setBusca(""); setSit(""); setReserva(""); setCat(""); }} className="text-xs underline">Limpar</button>
            </div>
            <p className="mt-2 text-sm text-white/70">
              {fmtInt(somaFiltro.itens)} itens · {fmtInt(somaFiltro.saldoFocco)} peças · {fmtBrMax(somaFiltro.pesoTon, 1)} t · {fmtMoeda(somaFiltro.valorEstoque)} · reservado {fmtBrMax(somaFiltro.pesoReservadoTon, 1)} t
            </p>
            <div className="mt-2 max-h-[60vh] overflow-auto rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#1e2c10] text-left text-white/60">
                  <tr><th className="p-1.5">Chave</th><th>Descrição</th><th>Cor</th><th>Situação</th><th>Reserva</th><th className="text-right">Saldo</th><th className="text-right">Reserv.</th><th className="text-right">Disp.</th><th className="text-right">Peso (t)</th><th className="p-1.5 text-right">Valor</th></tr>
                </thead>
                <tbody>
                  {filtrados.slice(0, 500).map((i) => (
                    <tr key={i.chave} className="border-t border-white/5">
                      <td className="p-1.5 font-mono">{i.chave}</td>
                      <td className="max-w-72 truncate" title={i.desc}>{i.desc}</td>
                      <td className="max-w-32 truncate">{i.mascara}</td>
                      <td style={{ color: i.situacao === "EM LINHA" ? "#00FFCC" : "#FFA500" }}>{i.situacao}</td>
                      <td>{RES_ROT[i.reserva]}</td>
                      <td className="text-right font-mono">{fmtInt(i.saldoFocco)}</td>
                      <td className="text-right font-mono">{fmtInt(i.reservas)}</td>
                      <td className="text-right font-mono">{fmtInt(i.disponivel)}</td>
                      <td className="text-right font-mono">{fmtBrMax(i.pesoKg / 1000, 2)}</td>
                      <td className="p-1.5 text-right font-mono">{fmtMoeda(i.valorEstoque)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtrados.length > 500 && <p className="p-2 text-xs text-white/50">Mostrando 500 de {fmtInt(filtrados.length)} — use os filtros.</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
