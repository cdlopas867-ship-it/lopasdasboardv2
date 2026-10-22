/* Central de notificações do painel (estilo Facebook).
 *
 * Guarda no próprio navegador a lista de novidades recebidas do Drive, para
 * que o sino mostre o histórico e o contador de não lidas mesmo depois de
 * recarregar a página. Toda alteração avisa os componentes pelo evento
 * `lopas:notificacoes`, então qualquer tela pode reagir sem estado global. */

import { useCallback, useEffect, useState } from "react";

export type NotificacaoApp = {
  id: string;
  titulo: string;
  detalhe: string;
  horario: number;
  lida: boolean;
};

const CHAVE = "lopas-notificacoes-v1";
const LIMITE = 30;
const EVENTO = "lopas:notificacoes";

function ler(): NotificacaoApp[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const itens: unknown = JSON.parse(bruto);
    return Array.isArray(itens) ? (itens as NotificacaoApp[]) : [];
  } catch {
    return [];
  }
}

function salvar(itens: NotificacaoApp[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(itens.slice(0, LIMITE)));
  } catch {
    /* localStorage indisponível — a lista vale só enquanto a aba estiver aberta */
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function listarNotificacoes(): NotificacaoApp[] {
  return ler();
}

/* Acrescenta uma novidade no topo da lista. Ignora repetições do mesmo
   instante: o mesmo aviso chega pelo polling e pelo SSE. */
export function adicionarNotificacao(n: {
  titulo: string;
  detalhe: string;
  horario?: number;
}): boolean {
  if (typeof window === "undefined") return false;
  const itens = ler();
  const horario = n.horario ?? Date.now();
  if (itens.some((i) => i.horario === horario)) return false;
  const novo: NotificacaoApp = {
    id: `${horario}-${Math.random().toString(36).slice(2, 8)}`,
    titulo: n.titulo,
    detalhe: n.detalhe,
    horario,
    lida: false,
  };
  salvar([novo, ...itens]);
  return true;
}

export function marcarTodasLidas(): void {
  const itens = ler();
  if (!itens.some((i) => !i.lida)) return;
  salvar(itens.map((i) => ({ ...i, lida: true })));
}

export function marcarLida(id: string): void {
  const itens = ler();
  const alvo = itens.find((i) => i.id === id);
  if (!alvo || alvo.lida) return;
  salvar(itens.map((i) => (i.id === id ? { ...i, lida: true } : i)));
}

export function limparNotificacoes(): void {
  salvar([]);
}

/* "agora", "há 5 min", "há 2 h", "há 3 d" ou a data — como no Facebook. */
export function tempoRelativo(horario: number): string {
  const diff = Date.now() - horario;
  if (diff < 60_000) return "agora";
  const minutos = Math.floor(diff / 60_000);
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `há ${dias} d`;
  return new Date(horario).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function useNotificacoes() {
  const [itens, setItens] = useState<NotificacaoApp[]>([]);

  useEffect(() => {
    const atualizar = () => setItens(ler());
    atualizar();
    window.addEventListener(EVENTO, atualizar);
    /* Sincroniza entre abas do mesmo navegador */
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);

  const marcarTodas = useCallback(() => marcarTodasLidas(), []);
  const marcarUma = useCallback((id: string) => marcarLida(id), []);
  const limpar = useCallback(() => limparNotificacoes(), []);

  return {
    itens,
    naoLidas: itens.filter((i) => !i.lida).length,
    marcarTodasLidas: marcarTodas,
    marcarLida: marcarUma,
    limpar,
  };
}
