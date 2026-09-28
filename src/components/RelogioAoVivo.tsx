import { useEffect, useState } from "react";

/* Relógio ao vivo — exibe a data e hora atuais, atualizando a cada segundo,
   para refletir a hora real de atualização do painel. */
function formatar(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const data = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${data} · ${hora}`;
}

export default function RelogioAoVivo() {
  /* Inicia nulo para que SSR e primeiro render do cliente coincidam (evita
     mismatch de hidratação); a hora real só aparece após a montagem. */
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="hidden items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold tracking-wider uppercase sm:flex">
      <span className="size-2 animate-pulse rounded-full bg-primary" />
      Atualizado {agora ? formatar(agora) : "--/--/---- · --:--:--"}
    </span>
  );
}
