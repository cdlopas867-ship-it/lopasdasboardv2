import { createFileRoute } from "@tanstack/react-router";
import { requireApiAccess } from "@/lib/gate.server";

const SYSTEM_PROMPT = `Você é um analista de estoque sênior do Centro de Distribuição Lopas, uma empresa de móveis. Sua tarefa é interpretar os dados de estoque de forma acolhedora, profissional e insightiva, como se estivesse dando boas-vindas a um colega que acabou de chegar para o turno.

REGRAS:
- Gere entre 6 e 10 mensagens curtas (1-2 frases cada)
- Comece sempre com uma saudação de boas-vindas diferente
- Termine com uma mensagem de encerramento motivacional
- Interprete os dados de forma diferente a cada vez: alterne quais métricas destacar (tonelagem, avarias, eficiência, ocupação, reservados, pendentes, etc.)
- Traga pequenos insights ou observações, não apenas repita números
- Use português brasileiro natural e fluido
- NÃO use emojis
- NÃO use formatação markdown (sem **, *, #, etc.)
- Seja conciso mas informativo

Responda SEMPRE com um JSON válido neste formato exato, sem texto adicional antes ou depois:
{"mensagens": ["primeira mensagem", "segunda mensagem", ...]}`;

export const Route = createFileRoute("/api/interpretar-estoque")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requireApiAccess();
        if (denied) return denied;

        const apiKey = process.env["ANTHROPIC_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "Chave Anthropic não configurada", semChave: true },
            { status: 503 },
          );
        }

        let body: { resumo?: string };
        try {
          body = (await request.json()) as { resumo?: string };
        } catch {
          return Response.json({ error: "Corpo inválido" }, { status: 400 });
        }

        if (!body.resumo) {
          return Response.json({ error: "Resumo de dados ausente" }, { status: 400 });
        }

        try {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1000,
              system: SYSTEM_PROMPT,
              messages: [
                { role: "user", content: `Aqui estão os dados atuais do estoque do CD Lopas:\n\n${body.resumo}` },
              ],
              temperature: 1,
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            console.error("[interpretar-estoque] Anthropic error:", response.status, errText);
            return Response.json({ error: "Falha na API Anthropic" }, { status: 502 });
          }

          const data = await response.json();
          const content = data.content?.[0]?.text ?? "";

          let mensagens: string[] = [];
          try {
            // Tenta extrair JSON da resposta (pode vir com texto ao redor)
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
            mensagens = Array.isArray(parsed)
              ? parsed
              : (parsed.mensagens ?? parsed.messages ?? []);
          } catch {
            mensagens = content
              .split("\n")
              .map((s: string) => s.trim())
              .filter(Boolean);
          }

          if (!mensagens.length) {
            return Response.json({ error: "Nenhuma mensagem gerada" }, { status: 500 });
          }

          return Response.json({ mensagens });
        } catch (error) {
          console.error("[interpretar-estoque] erro:", error);
          return Response.json({ error: "Erro interno" }, { status: 500 });
        }
      },
    },
  },
});
