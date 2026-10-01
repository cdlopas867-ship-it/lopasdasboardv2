import { useEffect, useState } from "react";
import CenaResumoTotal, { type ResumoTotalProp } from "@/components/CenaResumoTotal";
import type { VideoForaDeLinha } from "@/components/CenasApresentacao";

/* Tela pós-login — mostra o "Resumo Total do Estoque" antes de iniciar
   a apresentação automática. Substitui o antigo ResumoIntro de 6 slides. */

const DURACAO = 10000;

type Props = {
  resumo?: ResumoTotalProp | null;
  foraDeLinha?: VideoForaDeLinha | undefined;
  onConcluir: () => void;
};

export default function ResumoTotalIntro({ resumo, foraDeLinha, onConcluir }: Props) {
  const [saindo, setSaindo] = useState(false);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnim(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (saindo) return;
    const t = setTimeout(() => {
      setSaindo(true);
      setTimeout(onConcluir, 600);
    }, DURACAO);
    return () => clearTimeout(t);
  }, [saindo, onConcluir]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        setSaindo(true);
        setTimeout(onConcluir, 600);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConcluir]);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = anterior; };
  }, []);

  return (
    <div
      className={`resumo-intro ${saindo ? "resumo-intro-saindo" : ""} fixed inset-0 z-[130] flex flex-col items-center justify-center overflow-hidden`}
    >
      {/* Fundo */}
      <div
        className="video-kenburns absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/fundo-satelite-real.jpg?v=1)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a3e18]/80 via-[#1e2c10]/70 to-[#0f1608]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]" />

      {/* Botão "Pular" */}
      <button
        type="button"
        onClick={() => {
          setSaindo(true);
          setTimeout(onConcluir, 600);
        }}
        className="absolute left-1/2 top-5 z-20 -translate-x-1/2 cursor-pointer rounded-full border border-white/20 bg-white/5 px-6 py-2 text-[10px] font-bold tracking-[0.25em] text-white/60 uppercase backdrop-blur-sm transition-colors hover:bg-white/15 hover:text-white/90"
      >
        Pular →
      </button>

      {/* Conteúdo — Resumo Total do Estoque */}
      <div className="relative z-10 flex w-full max-w-sm items-center justify-center px-6 sm:max-w-md">
        <CenaResumoTotal anim={anim} resumo={resumo} foraDeLinha={foraDeLinha} />
      </div>

      {/* Rodapé */}
      <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center px-6">
        <p className="text-[10px] font-bold tracking-[0.4em] text-[#76A035]/50 uppercase">
          Movidos pela fé
        </p>
      </div>
    </div>
  );
}
