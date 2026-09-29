import { createServerSupabaseClient } from "@/lib/supabase-admin.server";
export type RegistroHistorico = { timestamp: string; data?: string; valor: number; previsto: number; ton: number; saldo: number; itens: number; reservadoTon?: number; reservadoValor?: number };

/* Cache em memória — usado quando o Supabase não está disponível (placeholder
   key) para que a verificação de duplicatas funcione entre ciclos de importação. */
declare global {
  // eslint-disable-next-line no-var
  var __historicoMemoria: RegistroHistorico[] | undefined;
}
function getMemoria(): RegistroHistorico[] {
  if (!globalThis.__historicoMemoria) globalThis.__historicoMemoria = [];
  return globalThis.__historicoMemoria;
}

/* Remove registros consecutivos duplicados — mesmos valores centrais
   (ton, valor, saldo, itens, previsto). Duplicatas surgiam porque
   reservadoTon/Valor flutuavam entre imports, burlando o check anterior. */
function dedupConsecutivos(regs: RegistroHistorico[]): RegistroHistorico[] {
  const out: RegistroHistorico[] = [];
  for (const r of regs) {
    const prev = out[out.length - 1];
    if (prev && prev.valor === r.valor && prev.previsto === r.previsto && prev.ton === r.ton && prev.saldo === r.saldo && prev.itens === r.itens) continue;
    out.push(r);
  }
  return out;
}

export async function getHistorico(): Promise<RegistroHistorico[]> {
  try {
    const { data, error } = await createServerSupabaseClient().from("stock_history").select("*").order("imported_at", { ascending: true }).limit(2000);
    if (error) throw error;
    const registros = dedupConsecutivos((data ?? []).map((r: Record<string, unknown>) => ({ timestamp: r["imported_at"] as string, ...(r["source_date"] ? { data: r["source_date"] as string } : {}), valor: r["value_amount"] as number, previsto: r["forecast_amount"] as number, ton: r["weight_tons"] as number, saldo: r["balance_units"] as number, itens: r["item_count"] as number, ...(r["reserved_tons"] != null ? { reservadoTon: r["reserved_tons"] as number } : {}), ...(r["reserved_amount"] != null ? { reservadoValor: r["reserved_amount"] as number } : {}) })));
    /* Sincroniza memória com Supabase quando disponível */
    getMemoria().length = 0;
    getMemoria().push(...registros);
    return registros;
  } catch {
    /* Sem Supabase — usa cache em memória */
    return dedupConsecutivos(getMemoria());
  }
}
export async function addRegistro(reg: Omit<RegistroHistorico, "timestamp">, timestamp?: string) {
  const all = await getHistorico(); const ultimo = all.at(-1);
  /* Compara apenas os valores centrais do estoque — reservadoTon/Valor
     podem flutuar conforme o parse da planilha encontra ou não a aba de
     reservas, e não devem gerar registros duplicados. */
  const ts = timestamp ?? new Date().toISOString();
  /* Só ignora repetição no mesmo dia — cada dia sempre ganha seu registro */
  if (ultimo && diaSP(ultimo.timestamp) === diaSP(ts) && ultimo.valor === reg.valor && ultimo.previsto === reg.previsto && ultimo.ton === reg.ton && ultimo.saldo === reg.saldo && ultimo.itens === reg.itens) return ultimo;
  const registro = { ...reg, timestamp: ts };
  /* Salva em memória sempre (funciona mesmo sem Supabase) */
  getMemoria().push(registro);
  try {
    const { error } = await createServerSupabaseClient().from("stock_history").insert({ imported_at: ts, source_date: reg.data ?? null, value_amount: reg.valor, forecast_amount: reg.previsto, weight_tons: reg.ton, balance_units: reg.saldo, item_count: reg.itens, reserved_tons: reg.reservadoTon ?? null, reserved_amount: reg.reservadoValor ?? null });
    if (error) throw error;
  } catch { /* sem Supabase — dados ficam só em memória */ }
  return registro;
}
