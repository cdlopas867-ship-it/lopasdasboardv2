import { createServerSupabaseClient } from "@/lib/supabase-admin.server";
import { initialSyncData } from "./initial-sync-data";
const clients = new Map<string, ReadableStreamDefaultController<Uint8Array>>();
/* Persiste latestData em globalThis para sobreviver a HMR (recarga do dev
   server), que re-avalia o módulo e reinicializaria a variável. */
declare global {
  // eslint-disable-next-line no-var
  var __syncLatestData: unknown | undefined;
}
let latestData: unknown = globalThis.__syncLatestData ?? initialSyncData;
globalThis.__syncLatestData = latestData;
export async function getLatestData(): Promise<unknown> {
  latestData = globalThis.__syncLatestData ?? latestData;
  try {
    const { data } = await createServerSupabaseClient().from("dashboard_snapshots").select("payload").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (data?.payload && Array.isArray((data.payload as Record<string, unknown>)["unidades"])) latestData = data.payload;
  } catch { /* usa contingência incorporada */ }
  globalThis.__syncLatestData = latestData;
  return latestData;
}
export function addClient(id: string, controller: ReadableStreamDefaultController<Uint8Array>) { clients.set(id, controller); }
export function removeClient(id: string) { clients.delete(id); }
function send(controller: ReadableStreamDefaultController<Uint8Array>, data: unknown) { try { controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)); } catch { /* desconectado */ } }
export async function setData(data: unknown) {
  latestData = data;
  globalThis.__syncLatestData = data;
  const source = (data as Record<string, unknown>)?.["atualizadoEm"];
  try {
    await createServerSupabaseClient().from("dashboard_snapshots").insert({ payload: data, source_updated_at: typeof source === "string" ? source : null });
  } catch { /* sem Supabase — dados ficam só em memória */ }
  for (const [id, controller] of clients) { send(controller, data); if (controller.desiredSize === null) clients.delete(id); }
}
/* Atualiza apenas o carimbo de sincronização (sem gravar snapshot no banco).
   Usado quando a pasta do Drive é lida mas nenhum arquivo mudou — mantém o
   horário "Sincronizado" do painel sempre atual. */
export function setSincronizacao(sincronizacao: unknown) {
  const atual = (latestData as Record<string, unknown> | null) ?? {};
  latestData = { ...atual, sincronizacao };
  globalThis.__syncLatestData = latestData;
  for (const [id, controller] of clients) { send(controller, latestData); if (controller.desiredSize === null) clients.delete(id); }
}
export function broadcastReload() { for (const [id, controller] of clients) { send(controller, { __reload: true }); if (controller.desiredSize === null) clients.delete(id); } }
