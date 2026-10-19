/* Relatório de Auditoria — documento técnico com os horários de atualização
   e a responsabilidade do painel com as informações. Estilo Word profissional,
   com o trevo da Lopas no topo. "Imprimir / salvar PDF" usa a impressão do
   navegador. */

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { VideoResumoProps } from "./VideoResumoDashboard";

function Secao({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="border-b border-neutral-300 pb-1 text-sm font-bold uppercase tracking-wide text-[#4d7a1f]">
        {numero}. {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function RelatorioAuditoria({ dados, onFechar }: { dados: VideoResumoProps; onFechar: () => void }) {
  const agora = new Date().toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const sync = dados.sincronizacao?.em
    ? new Date(dados.sincronizacao.em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })
    : null;
  const planilhas = dados.sincronizacao?.planilhas ?? [];

  return createPortal(
    <div onClick={(e) => e.stopPropagation()} className="relatorio-lopas-root fixed inset-0 z-[200] overflow-y-auto bg-neutral-100 text-neutral-900">
      <div className="no-print sticky top-0 z-10 flex items-center justify-end gap-2 border-b bg-white px-4 py-2 shadow-sm">
        <Button type="button" onClick={() => window.print()} size="sm">
          Imprimir / salvar PDF
        </Button>
        <Button type="button" onClick={onFechar} variant="outline" size="sm">
          Fechar
        </Button>
      </div>

      <article className="mx-auto my-4 max-w-3xl bg-white p-8 shadow sm:p-10">
        <header className="flex items-center gap-4 border-b-2 border-[#73ae37] pb-3">
          <img src="/lopas-logo-clover.png" alt="Lopas — Trevo" className="size-14" />
          <div>
            <h1 className="font-serif text-2xl font-bold">Relatório de Auditoria</h1>
            <p className="text-xs text-neutral-600">
              Painel de Estoque · CD Lopas 2026 · gerado em {agora}
            </p>
          </div>
        </header>

        <p className="mt-5 text-sm leading-relaxed text-neutral-800">
          Este documento apresenta os horários de atualização e a responsabilidade
          do painel com as informações exibidas. Todos os valores correspondem aos
          dados carregados no momento da geração.
          {sync ? ` Última sincronização: ${sync}.` : ""}
        </p>

        <Secao numero={1} titulo="Horários de atualização">
          <div className="space-y-2 text-xs leading-snug text-neutral-800">
            <p>
              <strong className="text-[#4d7a1f]">Sincronização automática:</strong> a cada{" "}
              <strong>15 segundos</strong> com a pasta do Google Drive.
            </p>
            <p>
              <strong className="text-[#4d7a1f]">Selo "Atualizado":</strong> mostra a{" "}
              <strong>modificação mais recente</strong> entre as planilhas — não o horário da checagem.
            </p>
            {sync && (
              <p>
                <strong className="text-[#4d7a1f]">Última sincronização:</strong> {sync}.
              </p>
            )}
            {planilhas.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold text-neutral-700">Planilhas sincronizadas:</p>
                <ul className="mt-1 space-y-0.5">
                  {planilhas.map((p) => (
                    <li key={p.nome} className="text-[11px] text-neutral-600">
                      • {p.nome}
                      {p.modificado && (
                        <span className="text-neutral-400">
                          {" "}— modificado em {new Date(p.modificado).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Secao>

        <Secao numero={2} titulo="Responsabilidade e transparência">
          <div className="space-y-2 text-xs leading-relaxed text-neutral-800">
            <p>
              <strong className="text-[#4d7a1f]">Origem verificável.</strong> Todo número
              exibido é rastreável a uma planilha da pasta do Drive ou relatório do
              FullSoft/Focco. Nenhum valor é fabricado sem fonte.
            </p>
            <p>
              <strong className="text-[#4d7a1f]">Limitações declaradas.</strong> O painel
              rotula o que é parcial — custo de avarias, meses com base zerada, dados
              estáticos. O usuário é informado da lacuna.
            </p>
            <p>
              <strong className="text-[#4d7a1f]">Fuso horário.</strong> Horários em Brasília
              (UTC−3), mesmo fuso do CD.
            </p>
          </div>
        </Secao>

        <footer className="mt-8 border-t-2 border-[#73ae37] pt-3">
          <p className="text-[10px] leading-snug text-neutral-500">
            Documento gerado em {agora}.{sync ? ` Dados sincronizados em ${sync}.` : ""}{" "}
            Horários em Brasília (UTC−3).
          </p>
          <p className="mt-2 text-center text-[11px] font-semibold tracking-widest text-[#73ae37] uppercase">
            Móveis Lopas · Movidos pela Fé
          </p>
        </footer>
      </article>
    </div>,
    document.body,
  );
}
