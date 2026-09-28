import { createServerSupabaseClient } from "@/lib/supabase-admin.server";
export async function getValorFaturado(): Promise<number> { const { data } = await createServerSupabaseClient().from("dashboard_settings").select("numeric_value").eq("key", "valor_faturado").maybeSingle(); return data?.numeric_value ?? 7314.91; }
export async function setValorFaturado(v: number): Promise<number> { const { error } = await createServerSupabaseClient().from("dashboard_settings").upsert({ key: "valor_faturado", numeric_value: v }); if (error) throw error; return v; }
