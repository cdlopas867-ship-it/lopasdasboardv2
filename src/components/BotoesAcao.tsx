/* Grupo de ações rápidas — resumo executivo e recebimento da semana.
   A importação agora é automática direto do Google Drive. */
export default function BotoesAcao() {
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-wrap gap-4">
        <a
          href="#estoque"
          className="rounded-full bg-primary px-8 py-4 font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          Ver resumo executivo
        </a>
        <a
          href="#recebimento"
          className="rounded-full border px-8 py-4 font-medium transition-colors hover:border-foreground"
        >
          Recebimento da semana
        </a>
      </div>
    </div>
  );
}
