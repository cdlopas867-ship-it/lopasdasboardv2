/* Tela de carregamento exibida enquanto os dados do painel são buscados.
   Evita que a apresentação renderize com dados antigos e depois atualize. */

export default function LoadingApresentacao() {
  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/fundo-satelite-real.jpg?v=1)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a3e18]/80 via-[#1e2c10]/70 to-[#0f1608]/90" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-[#76A035]" />
        <p className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">
          Carregando dados…
        </p>
      </div>
    </div>
  );
}
