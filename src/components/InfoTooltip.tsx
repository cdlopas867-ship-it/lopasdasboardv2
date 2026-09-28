import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* Ícone de interrogação que abre um balão explicativo ao toque/clique.
   Usado em cada cena do vídeo-resumo para explicar cálculos, fontes e datas.
   O clique é isolado (stopPropagation) para não disparar a navegação de cenas. */

type Props = {
  texto: string;
  className?: string;
  onOpen?: () => void;
};

export default function InfoTooltip({ texto, className, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const next = !open;
          setOpen(next);
          if (next) onOpen?.();
        }}
        aria-label="Mais informações"
        className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/40 text-white/70 transition-colors hover:border-white hover:bg-white/10 hover:text-white"
      >
        <HelpCircle className="size-3.5" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-7 z-[200] w-60 rounded-lg border border-white/20 bg-brand-dark/95 p-3 text-left text-[11px] leading-relaxed text-white/85 shadow-2xl backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {texto}
        </div>
      )}
    </div>
  );
}
