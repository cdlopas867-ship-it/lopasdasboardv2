/* Jogo "Vai caber?" — fim da página mobile. Escolha um móvel do estoque,
   abra a câmera e arraste a caixa 3D (nas dimensões reais do item) até o
   espaço delimitado: se couber, o jogo mostra como aquele móvel ficaria. */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ITENS_PADRAO } from "@/data/itens-estoque";

type Movel = {
  item: string;
  nome: string;
  mascara: string;
  l: number; // largura (m)
  a: number; // altura (m)
  p: number; // profundidade (m)
};

/* Cores das máscaras/corridas do estoque, para a caixa 3D. */
function corDaMascara(mascara: string): string {
  const m = mascara.toUpperCase();
  if (m.includes("OFF WH") || m.includes("BRANCO")) return "#EDE8DC";
  if (m.includes("AMENDOA")) return "#C9A876";
  if (m.includes("CAPUCCINO")) return "#8A6642";
  if (m.includes("LINHO")) return "#D9CBB0";
  if (m.includes("PRETO") || m.includes("BLACK")) return "#3A3A3A";
  return "#7CB342";
}

/* Dimensões vêm na descrição, ex.: "… T/F 2,310X0,461X0,101" (LxAxP, m). */
function dimensoes(desc: string): [number, number, number] | null {
  const m = desc.match(/(\d+[.,]\d+)\s*X\s*(\d+[.,]\d+)\s*X\s*(\d+[.,]\d+)/i);
  if (!m) return null;
  const n = (s: string) => parseFloat(s.replace(",", "."));
  return [n(m[1]), n(m[2]), n(m[3])];
}

function nomeCurto(desc: string): string {
  const semDim = desc.replace(/(\d+[.,]\d+\s*X\s*\d+[.,]\d+\s*X\s*\d+[.,]\d+).*$/i, "");
  const tokens = semDim
    .replace(/^VOL CX\s*/i, "")
    .split(/\s+/)
    .filter((t) => t && !/^\d{4}$/.test(t))
    .slice(0, 4);
  return tokens.join(" ");
}

/* Móveis de volume do estoque, um por descrição (8 primeiros). */
const MOVEIS: Movel[] = (() => {
  const vistos = new Set<string>();
  const out: Movel[] = [];
  for (const it of ITENS_PADRAO) {
    if (vistos.has(it.desc) || !it.desc.toUpperCase().startsWith("VOL")) continue;
    const d = dimensoes(it.desc);
    if (!d) continue;
    vistos.add(it.desc);
    out.push({ item: it.item, nome: nomeCurto(it.desc) || it.desc, mascara: it.mascara, l: d[0], a: d[1], p: d[2] });
    if (out.length >= 8) break;
  }
  return out;
})();

/* ── Seção exibida no fim da página ────────────────────────────────── */

export default function JogoVaiCaber() {
  const [movel, setMovel] = useState<Movel | null>(null);
  const [encaixes, setEncaixes] = useState(0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-xs text-white/60">Escolha um móvel, abra a câmera e veja se ele cabe no ambiente.</p>
        <span className="whitespace-nowrap text-[10px] font-bold tracking-wide text-[#9CCC65] uppercase">
          Encaixes: {encaixes}
        </span>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {MOVEIS.map((m) => (
          <button
            key={`${m.item}-${m.nome}`}
            onClick={() => setMovel(m)}
            className="w-36 shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-left transition hover:border-[#7CB342]/60 hover:bg-[#7CB342]/10"
          >
            <span className="mb-1.5 block size-3 rounded-full" style={{ backgroundColor: corDaMascara(m.mascara) }} />
            <p className="line-clamp-2 min-h-8 text-[11px] font-semibold text-white">{m.nome}</p>
            <p className="mt-1 font-mono text-[10px] tabular-nums text-white/50">
              {fmtBr(m.l, 2)} × {fmtBr(m.a, 2)} × {fmtBr(m.p, 2)} m
            </p>
          </button>
        ))}
      </div>

      {movel && <JogoCamera movel={movel} onEncaixe={() => setEncaixes((v) => v + 1)} onFechar={() => setMovel(null)} />}
    </div>
  );
}

/* ── Câmera + caixa 3D arrastável ──────────────────────────────────── */

function JogoCamera({ movel, onEncaixe, onFechar }: { movel: Movel; onEncaixe: () => void; onFechar: () => void }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const contouRef = useRef(false);

  const [tam, setTam] = useState({ w: 0, h: 0 });
  const [espacoL, setEspacoL] = useState(2.0);
  const [espacoA, setEspacoA] = useState(1.2);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [estado, setEstado] = useState<"arrastando" | "cabendo" | "fora">("arrastando");
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const cor = corDaMascara(movel.mascara);
  const pxPerM = tam.w && tam.h ? Math.min(tam.w, tam.h) / 3.5 : 0;
  const boxW = movel.l * pxPerM;
  const boxH = movel.a * pxPerM;
  const boxP = Math.max(movel.p * pxPerM, 8);

  const espW = espacoL * pxPerM;
  const espH = espacoA * pxPerM;
  const espX = (tam.w - espW) / 2;
  const espY = tam.h * 0.1;

  /* Tamanho da área + stream da câmera */
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const medir = () => setTam({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCameraOk(true);
      })
      .catch(() => setCameraOk(false));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  /* Posição inicial (abaixo do espaço) */
  useEffect(() => {
    if (!tam.w || !tam.h || !boxW || pos) return;
    setPos({ x: (tam.w - boxW) / 2, y: Math.max(tam.h - boxH - 120, espY + espH + 12) });
  }, [tam, boxW, boxH, espY, espH, pos]);

  const verificar = (p: { x: number; y: number }) => {
    const dentro =
      p.x >= espX - 4 && p.y >= espY - 4 && p.x + boxW <= espX + espW + 4 && p.y + boxH <= espY + espH + 4;
    if (dentro) {
      setEstado("cabendo");
      if (!contouRef.current) {
        contouRef.current = true;
        onEncaixe();
      }
    } else {
      setEstado("fora");
      contouRef.current = false;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ponteiro sintético (teste/automatização) — segue sem captura */
    }
    dragRef.current = { dx: e.clientX - (pos?.x ?? 0), dy: e.clientY - (pos?.y ?? 0) };
    setEstado("arrastando");
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const x = Math.min(Math.max(e.clientX - dragRef.current.dx, 0), Math.max(tam.w - boxW, 0));
    const y = Math.min(Math.max(e.clientY - dragRef.current.dy, 0), Math.max(tam.h - boxH, 0));
    setPos({ x, y });
  };
  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (pos) verificar(pos);
  };

  const faltaL = Math.max(0, (boxW - espW) * 100);
  const faltaA = Math.max(0, (boxH - espH) * 100);

  return createPortal(
    <div className="fixed inset-0 z-[200] select-none bg-black">
      <div ref={areaRef} className="relative h-full w-full overflow-hidden">
        {/* Fundo: câmera ao vivo (ou degradê quando indisponível) */}
        <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 size-full object-cover ${cameraOk ? "" : "hidden"}`} />
        {cameraOk === false && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a2a10] via-[#0e1a08] to-black" />
        )}
        <div className="absolute inset-0 bg-black/20" />

        {/* Espaço delimitado */}
        {pxPerM > 0 && (
          <div
            className="absolute rounded-lg border-2 border-dashed border-white/60 bg-white/5"
            style={{ left: espX, top: espY, width: espW, height: espH }}
          >
            <span className="absolute -top-5 left-0 font-mono text-[10px] tabular-nums text-white/70">
              espaço {fmtBr(espacoL, 2)} × {fmtBr(espacoA, 2)} m
            </span>
          </div>
        )}

        {/* Caixa 3D do móvel */}
        {pos && pxPerM > 0 && (
          <div
            className="absolute touch-none"
            style={{ left: pos.x, top: pos.y, width: boxW, height: boxH, perspective: 900 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <div
              className={`relative size-full transition-transform duration-500 ${estado === "fora" ? "animate-pulse" : ""}`}
              style={{
                transformStyle: "preserve-3d",
                transform: `translateZ(${boxP / 2}px) rotateX(${estado === "cabendo" ? 12 : 0}deg) rotateY(${estado === "cabendo" ? -18 : 0}deg)`,
                filter: estado === "fora" ? "drop-shadow(0 0 8px #FF7043)" : "drop-shadow(0 0 10px rgba(0,0,0,.6))",
              }}
            >
              {/* frente */}
              <Face w={boxW} h={boxH} z={boxP / 2} cor={cor}>
                <p className="px-1 text-center text-[10px] font-bold text-black/70">{movel.nome}</p>
                <p className="font-mono text-[9px] tabular-nums text-black/50">
                  {fmtBr(movel.l, 2)} × {fmtBr(movel.a, 2)} × {fmtBr(movel.p, 2)} m
                </p>
              </Face>
              {/* trás */}
              <Face w={boxW} h={boxH} z={boxP / 2} cor={cor} girar="rotateY(180deg)" escuro />
              {/* laterais */}
              <Face w={boxP} h={boxH} z={boxW / 2} cor={cor} girar="rotateY(90deg)" escuro />
              <Face w={boxP} h={boxH} z={boxW / 2} cor={cor} girar="rotateY(-90deg)" escuro />
              {/* topo / base */}
              <Face w={boxW} h={boxP} z={boxH / 2} cor={cor} girar="rotateX(90deg)" escuro />
              <Face w={boxW} h={boxP} z={boxH / 2} cor={cor} girar="rotateX(-90deg)" escuro />
            </div>
          </div>
        )}

        {/* Barra superior */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-3">
          <span className="text-xs font-semibold text-white">{movel.nome}</span>
          <button
            onClick={onFechar}
            className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs text-white/80"
          >
            ✕ Fechar
          </button>
        </div>

        {/* Barra inferior: mensagem + ajuste do espaço */}
        <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/80 to-transparent p-3">
          {estado === "cabendo" ? (
            <p className="text-center text-sm font-bold text-[#9CCC65]">✅ Cabe! É assim que o móvel ficaria no ambiente.</p>
          ) : estado === "fora" ? (
            <p className="text-center text-sm font-bold text-[#FF7043]">
              ❌ Não cabe aí
              {faltaL > 0 && ` — faltam ${fmtBr(faltaL, 0)} cm de largura`}
              {faltaA > 0 && ` — faltam ${fmtBr(faltaA, 0)} cm de altura`}.
            </p>
          ) : (
            <p className="text-center text-xs text-white/70">Arraste o móvel até o espaço delimitado.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="text-[10px] tracking-wide text-white/50 uppercase">
              Largura livre · {fmtBr(espacoL, 2)} m
              <input
                type="range" min={0.5} max={3} step={0.05} value={espacoL}
                onChange={(e) => { setEspacoL(parseFloat(e.target.value)); contouRef.current = false; setEstado("arrastando"); }}
                className="mt-1 w-full accent-[#7CB342]"
              />
            </label>
            <label className="text-[10px] tracking-wide text-white/50 uppercase">
              Altura livre · {fmtBr(espacoA, 2)} m
              <input
                type="range" min={0.5} max={3} step={0.05} value={espacoA}
                onChange={(e) => { setEspacoA(parseFloat(e.target.value)); contouRef.current = false; setEstado("arrastando"); }}
                className="mt-1 w-full accent-[#7CB342]"
              />
            </label>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* Uma face do cubo 3D, centralizada no contêiner. */
function Face({
  w, h, z, cor, girar = "", escuro = false, children,
}: {
  w: number; h: number; z: number; cor: string; girar?: string; escuro?: boolean; children?: React.ReactNode;
}) {
  return (
    <div
      className="absolute top-1/2 left-1/2 flex flex-col items-center justify-center overflow-hidden rounded-sm border border-black/20"
      style={{
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        background: `linear-gradient(160deg, ${cor}, color-mix(in srgb, ${cor} 78%, black))`,
        filter: escuro ? "brightness(0.72)" : undefined,
        transform: `${girar} translateZ(${z}px)`,
      }}
    >
      {children}
    </div>
  );
}

/* fmtBr simples para não depender de mais nada aqui */
function fmtBr(v: number, dec: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
