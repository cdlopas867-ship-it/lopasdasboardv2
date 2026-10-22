/* Tela de carregamento exibida enquanto os dados do painel são buscados.
   Mostra a imagem dos caminhões Lopas com "Lopas 2026" e "Movidos pela fé"
   surgindo suavemente sobre o fundo. */

export default function LoadingApresentacao() {
  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Imagem de fundo — caminhões Lopas */}
      <div
        className="loading-apresentacao-bg absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/fundo-boas-vindas-novo.webp')" }}
      />
      {/* Gradiente para legibilidade + vinheta radial */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/85" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)" }} />

      {/* Conteúdo central */}
      <div className="relative z-10 flex flex-col items-center">
        <h1
          className="loading-apresentacao-titulo font-serif text-4xl font-light tracking-wide text-white drop-shadow-2xl sm:text-5xl"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        >
          CD Lopas 2026
        </h1>
        <p className="loading-apresentacao-tagline mt-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#c9e39a] sm:text-xs">
          Movidos pela fé
        </p>
      </div>

      {/* Spinner discreto no rodapé */}
      <div className="absolute bottom-12 z-10 flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-[#76A035]" />
        <p className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">
          Carregando dados…
        </p>
      </div>
    </div>
  );
}
