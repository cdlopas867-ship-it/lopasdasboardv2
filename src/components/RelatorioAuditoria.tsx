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
          Este documento lista todas as planilhas utilizadas pelo painel e os dados
          que cada uma fornece, além dos horários de atualização e da responsabilidade
          com as informações exibidas.
          {sync ? ` Última sincronização: ${sync}.` : ""}
        </p>

        <Secao numero={1} titulo="Planilhas utilizadas e dados de cada uma">
          <div className="space-y-4 text-xs leading-relaxed text-neutral-800">
            <p className="font-semibold text-[#4d7a1f]">Planilhas do Google Drive (sincronização automática a cada 15 s)</p>
            <table className="w-full border-collapse border border-neutral-300 text-[11px]">
              <thead>
                <tr className="bg-[#f4f6f3] text-left">
                  <th className="border border-neutral-300 px-2 py-1 font-semibold">Planilha</th>
                  <th className="border border-neutral-300 px-2 py-1 font-semibold">Dados fornecidos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">ESTOQUE 001 — Posição de Estoque<br /><span className="text-neutral-500">(estoque NN.xlsx)</span></td>
                  <td className="border border-neutral-300 px-2 py-1">Peso e valor em estoque, itens ativos, ocupação do CD, itens fora de linha, peso unitário (PESO LIQ UN) para o comparativo Full × Focco</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">PCP 003 — Análise de Realização Total<br /><span className="text-neutral-500">(produção NN.xlsx)</span></td>
                  <td className="border border-neutral-300 px-2 py-1">Produção da semana: produzido (QTDE ENTREGUE), pendente (previsto − produzido), peso previsto e realizado, ordens de produção</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">PESO RECEBIDO POR PERÍODO</td>
                  <td className="border border-neutral-300 px-2 py-1">Recebimento diário (peso e quantidade recebida por data) — cruzado com a produção da semana</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">PCP 004 — Pendências</td>
                  <td className="border border-neutral-300 px-2 py-1">Tonelagem e itens pendentes das ordens de produção em aberto</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">WF0112 — Estoques<br /><span className="text-neutral-500">(FullSoft WMS · estoque 112)</span></td>
                  <td className="border border-neutral-300 px-2 py-1">Saldo do Full (Qtd. Atual por item/endereço) para o comparativo de acuracidade Full × Focco</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">COMERCIAL 024 — Saldo de Itens com Reserva</td>
                  <td className="border border-neutral-300 px-2 py-1">Itens reservados: quantidade, valor (qtd × custo médio) e % do valor do estoque</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">Planilha de Avarias</td>
                  <td className="border border-neutral-300 px-2 py-1">Volumes danificados: total (Soma de Quantidade), custo, breakdown mensal e por motivo</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">Toneladas Mensal / Gerenciamento de Carregamento</td>
                  <td className="border border-neutral-300 px-2 py-1">Carregado mensal (toneladas por mês) — usado na saúde do estoque e no comparativo de produtividade</td>
                </tr>
              </tbody>
            </table>

            <p className="font-semibold text-[#4d7a1f] pt-2">Cópias locais de fallback (public/planilhas/) — usadas só se o Drive falhar</p>
            <table className="w-full border-collapse border border-neutral-300 text-[11px]">
              <thead>
                <tr className="bg-[#f4f6f3] text-left">
                  <th className="border border-neutral-300 px-2 py-1 font-semibold">Arquivo</th>
                  <th className="border border-neutral-300 px-2 py-1 font-semibold">Dados fornecidos</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-neutral-300 px-2 py-1 font-medium">estoque.xlsx</td><td className="border border-neutral-300 px-2 py-1">Posição de estoque (fallback da ESTOQUE 001)</td></tr>
                <tr><td className="border border-neutral-300 px-2 py-1 font-medium">producao.xlsx</td><td className="border border-neutral-300 px-2 py-1">PCP 003 — produção (fallback)</td></tr>
                <tr><td className="border border-neutral-300 px-2 py-1 font-medium">peso-recebido.xlsx</td><td className="border border-neutral-300 px-2 py-1">PESO RECEBIDO POR PERÍODO (fallback)</td></tr>
                <tr><td className="border border-neutral-300 px-2 py-1 font-medium">reservados.xlsx</td><td className="border border-neutral-300 px-2 py-1">COMERCIAL 024 — itens reservados (fallback)</td></tr>
                <tr><td className="border border-neutral-300 px-2 py-1 font-medium">avarias.xlsx</td><td className="border border-neutral-300 px-2 py-1">Avarias (fallback)</td></tr>
                <tr><td className="border border-neutral-300 px-2 py-1 font-medium">carregado.xlsx</td><td className="border border-neutral-300 px-2 py-1">Carregado mensal (fallback)</td></tr>
                <tr><td className="border border-neutral-300 px-2 py-1 font-medium">ocupacao-cd.xlsx</td><td className="border border-neutral-300 px-2 py-1">Ocupação do CD (fonte autoritativa quando existe)</td></tr>
                <tr><td className="border border-neutral-300 px-2 py-1 font-medium">paletes.xlsx</td><td className="border border-neutral-300 px-2 py-1">Resumo de paletes</td></tr>
                <tr><td className="border border-neutral-300 px-2 py-1 font-medium">estoque-em-linha.xlsx</td><td className="border border-neutral-300 px-2 py-1">Estoque em linha</td></tr>
              </tbody>
            </table>

            <p className="font-semibold text-[#4d7a1f] pt-2">Dados estáticos (src/data/ — não lidos automaticamente pelo Drive)</p>
            <table className="w-full border-collapse border border-neutral-300 text-[11px]">
              <thead>
                <tr className="bg-[#f4f6f3] text-left">
                  <th className="border border-neutral-300 px-2 py-1 font-semibold">Origem</th>
                  <th className="border border-neutral-300 px-2 py-1 font-semibold">Dados fornecidos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">CD - QLP.xlsx (aba Base)<br /><span className="text-neutral-500">→ qlp-cd.ts</span></td>
                  <td className="border border-neutral-300 px-2 py-1">Lotação de pessoal (QLP · CD): 252 registros por classe (Estoque, Carregamento, Liderança, Treinamento, Afastamento, Transferência, Desligamento), cidade, cargo, função, turma, setor, tempo de casa</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">PRODUTIVIDADE POR COLABORADOR<br /><span className="text-neutral-500">(4 planilhas: separação manual, empilhadeira, recebimento, movimentação) → produtividade.ts</span></td>
                  <td className="border border-neutral-300 px-2 py-1">Produtividade por colaborador: tarefas, peso (kg), caixas, cargo e turma (casados com o QLP), totais por tipo de atividade e turma</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">Toneladas Mensal<br /><span className="text-neutral-500">→ carregado-mensal.ts</span></td>
                  <td className="border border-neutral-300 px-2 py-1">Carregado mensal (jan–set/2026) — fallback estático quando o Drive não entrega</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">Valor faturado<br /><span className="text-neutral-500">→ valor-faturado.ts</span></td>
                  <td className="border border-neutral-300 px-2 py-1">Valor faturado de referência (média quando a API do Supabase não responde)</td>
                </tr>
              </tbody>
            </table>

            <p className="font-semibold text-[#4d7a1f] pt-2">Supabase (API — quando configurado)</p>
            <table className="w-full border-collapse border border-neutral-300 text-[11px]">
              <thead>
                <tr className="bg-[#f4f6f3] text-left">
                  <th className="border border-neutral-300 px-2 py-1 font-semibold">Store</th>
                  <th className="border border-neutral-300 px-2 py-1 font-semibold">Dados fornecidos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">/api/sync-data</td>
                  <td className="border border-neutral-300 px-2 py-1">Snapshot do payload completo do painel (histórico de sincronização)</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-2 py-1 font-medium">/api/valor-faturado</td>
                  <td className="border border-neutral-300 px-2 py-1">Valor faturado atualizado (quando o Supabase está ativo)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Secao>

        <Secao numero={2} titulo="Horários de atualização">
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

        <Secao numero={3} titulo="Responsabilidade e transparência">
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
