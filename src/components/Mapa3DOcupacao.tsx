import { OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import * as THREE from "three";

/* Paleta fiel ao modelo de referência */
const FUNDO = "#6796B7"; /* azul */
const PAREDE = "#C8C8C8"; /* cinza claro */
const PISO = "#AFAFAF"; /* piso cinza */
const ESTRUTURA = "#D2B48C"; /* racks bege madeira */
const CAMINHAO_LARANJA = "#FF8C00";
const CAMINHAO_BRANCO = "#FFFFFF";
const VIDRO = "#3a4a55";

/* Logo Lopas — losango verde, trevo branco e texto, desenhado em canvas */
function criarLogoLopas(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 512);
  /* losango verde com cantos arredondados */
  ctx.save();
  ctx.translate(256, 168);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#78B539";
  ctx.beginPath();
  ctx.roundRect(-86, -86, 172, 172, 24);
  ctx.fill();
  ctx.restore();
  /* trevo branco — quatro pétalas */
  ctx.fillStyle = "#FFFFFF";
  const petalas: [number, number][] = [
    [-36, -36],
    [36, -36],
    [-36, 36],
    [36, 36],
  ];
  for (const [dx, dy] of petalas) {
    ctx.beginPath();
    ctx.arc(256 + dx, 168 + dy, 38, 0, Math.PI * 2);
    ctx.fill();
  }
  /* wordmark */
  ctx.textAlign = "center";
  ctx.fillStyle = "#666666";
  ctx.font = "300 44px system-ui, sans-serif";
  ctx.fillText("MÓVEIS", 256, 338);
  ctx.font = "700 96px system-ui, sans-serif";
  ctx.fillText("LOPAS", 256, 438);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let _logo: THREE.CanvasTexture | null = null;
function logoLopas(): THREE.CanvasTexture | null {
  if (!_logo && typeof document !== "undefined") _logo = criarLogoLopas();
  return _logo;
}

/* Cores de atividade — baixa, média, alta */
const COR = { baixa: "#6ba353", media: "#e6c34a", alta: "#d93a3a" } as const;
type Nivel = keyof typeof COR;

type Posicao = {
  id: string;
  rua: string;
  modulo: string;
  numero: number;
  ocupacao: number | null; /* null = posição livre */
  nivel: Nivel;
  tom: number; /* variação sutil de tonalidade — realismo */
};

const RUAS = ["R01", "R02", "R03", "R04"];
const MODULOS = ["N1", "N2", "N3"];
const QTD_POS = 12;
const GAP_X = 2.1;
const LARGURA = (QTD_POS - 1) * GAP_X + 2.4;
const NIVEL_Y = [0.1, 1.85, 3.6];
const ALT_CAIXA = 1.5;

/* Dimensões do prédio (planta retangular, topo aberto) */
const LIM_X = 17;
const FRENTE_Z = 11;
const FUNDOS_Z = -19;
const ALT_PAREDE = 5;

/* Segmentos da parede frontal [centro, largura] — vãos = portões de doca */
const SEG_FRONTAL: [number, number][] = [
  [-14, 6],
  [-4, 6],
  [5, 4],
  [14, 6],
];
const PORTOES = [-9, 1, 9];
const PILARES: [number, number][] = [
  [-10, -16], [10, -16], [-10, 6], [10, 6],
  [-10, -8], [10, -8], [-10, 0], [10, 0],
];
const CARRETAS: [number, number][] = [
  [3, 17],
  [8, 18.5],
];

/* PRNG determinístico — 64% das posições ocupadas, espelhando o CD real */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POSICOES: Posicao[] = (() => {
  const rnd = mulberry32(20260902);
  const lista: Posicao[] = [];
  for (const rua of RUAS) {
    for (const modulo of MODULOS) {
      for (let p = 0; p < QTD_POS; p++) {
        const ocupada = rnd() < 0.64;
        const sorte = rnd();
        const nivel: Nivel = sorte < 0.55 ? "baixa" : sorte < 0.85 ? "media" : "alta";
        lista.push({
          id: `${rua}-${modulo}-${p}`,
          rua,
          modulo,
          numero: p + 1,
          ocupacao: ocupada ? 65 + Math.floor(rnd() * 35) : null,
          nivel: ocupada ? nivel : "baixa",
          tom: 0.82 + rnd() * 0.3,
        });
      }
    }
  }
  return lista;
})();

type Tip = { pos: Posicao; x: number; y: number };

/* Eixo de rodas — pneu escuro com calotas metálicas */
function Eixo({ z, largura = 2.3 }: { z: number; largura?: number }) {
  return (
    <group position={[0, 0.42, z]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.42, 0.42, largura, 16]} />
        <meshStandardMaterial color="#202020" roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (largura / 2 + 0.04), 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.08, 12]} />
          <meshStandardMaterial color="#b9bec4" roughness={0.3} metalness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

/* Caminhão de entrega — volumes arredondados, arcos de roda e detalhes realistas */
function Caminhao({ cor }: { cor: string }) {
  const escuro = "#2e2e2e";
  const metal = "#b9bec4";
  const verniz = { roughness: 0.35, metalness: 0.2 };
  return (
    <group>
      {/* chassi */}
      <mesh position={[0, 0.62, -0.6]} castShadow>
        <boxGeometry args={[2, 0.26, 5.4]} />
        <meshStandardMaterial color={escuro} roughness={0.85} />
      </mesh>
      {/* baú de carga — cantos arredondados e pintura com verniz */}
      <RoundedBox
        args={[2.2, 2.35, 3.7]}
        radius={0.09}
        smoothness={4}
        position={[0, 1.95, -1.3]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={cor} {...verniz} />
      </RoundedBox>
      {/* vincos verticais do baú */}
      {[-2.9, -1.6, -0.3].map((z) => (
        <mesh key={z} position={[0, 1.95, z]}>
          <boxGeometry args={[2.24, 2.35, 0.05]} />
          <meshStandardMaterial color={escuro} roughness={0.6} />
        </mesh>
      ))}
      {/* portas traseiras com travessa central metálica */}
      <RoundedBox args={[2, 2.1, 0.08]} radius={0.03} smoothness={3} position={[0, 1.95, -3.17]}>
        <meshStandardMaterial color={escuro} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, 1.95, -3.22]}>
        <boxGeometry args={[0.12, 2.1, 0.06]} />
        <meshStandardMaterial color={metal} roughness={0.35} metalness={0.65} />
      </mesh>
      {/* lanternas traseiras */}
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.85, -3.19]}>
          <boxGeometry args={[0.3, 0.14, 0.05]} />
          <meshStandardMaterial color="#e02020" emissive="#c02020" emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* adesivos do logo Lopas nas laterais do baú */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 1.128, 1.95, -1.3]}
          rotation={[0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <planeGeometry args={[1.8, 1.8]} />
          <meshStandardMaterial map={logoLopas()} transparent roughness={0.5} />
        </mesh>
      ))}
      {/* cabine arredondada */}
      <RoundedBox
        args={[2.1, 1.65, 1.8]}
        radius={0.09}
        smoothness={4}
        position={[0, 1.5, 1.6]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={cor} {...verniz} />
      </RoundedBox>
      {/* defletor de teto */}
      <RoundedBox args={[1.6, 0.22, 1.3]} radius={0.06} smoothness={3} position={[0, 2.42, 1.35]} castShadow>
        <meshStandardMaterial color={cor} {...verniz} />
      </RoundedBox>
      {/* pala solar sobre o para-brisa */}
      <mesh position={[0, 2.2, 2.5]}>
        <boxGeometry args={[1.85, 0.1, 0.25]} />
        <meshStandardMaterial color={escuro} roughness={0.6} />
      </mesh>
      {/* para-brisa inclinado */}
      <mesh position={[0, 1.62, 2.52]} rotation={[-0.22, 0, 0]}>
        <boxGeometry args={[1.85, 1.05, 0.07]} />
        <meshStandardMaterial color={VIDRO} roughness={0.12} metalness={0.55} />
      </mesh>
      {/* janelas laterais */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.06, 1.72, 1.6]}>
          <boxGeometry args={[0.04, 0.75, 1.3]} />
          <meshStandardMaterial color={VIDRO} roughness={0.12} metalness={0.55} />
        </mesh>
      ))}
      {/* grade frontal com frisos cromados */}
      <mesh position={[0, 1.05, 2.52]}>
        <boxGeometry args={[1.75, 0.55, 0.08]} />
        <meshStandardMaterial color="#262626" roughness={0.4} metalness={0.35} />
      </mesh>
      {[1.18, 0.98].map((y) => (
        <mesh key={y} position={[0, y, 2.545]}>
          <boxGeometry args={[1.6, 0.07, 0.04]} />
          <meshStandardMaterial color={metal} roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
      {[-0.68, 0.68].map((x) => (
        <mesh key={x} position={[x, 0.88, 2.55]}>
          <boxGeometry args={[0.34, 0.18, 0.07]} />
          <meshStandardMaterial color="#fff6cc" emissive="#ffe79a" emissiveIntensity={0.7} />
        </mesh>
      ))}
      {/* indicadores de direção */}
      {[-0.95, 0.95].map((x) => (
        <mesh key={x} position={[x, 0.88, 2.55]}>
          <boxGeometry args={[0.18, 0.14, 0.06]} />
          <meshStandardMaterial color="#ffb02e" emissive="#ff9a1f" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* para-choque metálico */}
      <mesh position={[0, 0.5, 2.6]} castShadow>
        <boxGeometry args={[2.1, 0.28, 0.22]} />
        <meshStandardMaterial color={metal} roughness={0.35} metalness={0.65} />
      </mesh>
      {/* degraus de acesso à cabine */}
      {[0.42, 0.64].map((y) => (
        <mesh key={y} position={[0, y, 2.05]}>
          <boxGeometry args={[1.6, 0.07, 0.3]} />
          <meshStandardMaterial color={escuro} roughness={0.7} />
        </mesh>
      ))}
      {/* arcos de roda sobre os dois eixos */}
      {[-2.1, 1.5].map((z) =>
        [-1, 1].map((s) => (
          <RoundedBox
            key={`${z}-${s}`}
            args={[0.18, 0.14, 1.25]}
            radius={0.05}
            smoothness={3}
            position={[s * 1.11, 1.0, z]}
          >
            <meshStandardMaterial color={escuro} roughness={0.7} />
          </RoundedBox>
        )),
      )}
      {/* protetores de lama traseiros */}
      {[-1, 1].map((s) => (
        <mesh key={`flap-${s}`} position={[s * 1.05, 0.32, -2.75]}>
          <boxGeometry args={[0.32, 0.5, 0.05]} />
          <meshStandardMaterial color={escuro} roughness={0.9} />
        </mesh>
      ))}
      {/* luzes marcadoras no teto do baú */}
      {[-0.6, 0, 0.6].map((x) => (
        <mesh key={`mark-${x}`} position={[x, 3.16, 0.42]}>
          <boxGeometry args={[0.22, 0.07, 0.1]} />
          <meshStandardMaterial color="#ffb02e" emissive="#ff9a1f" emissiveIntensity={0.9} />
        </mesh>
      ))}
      {/* espelhos retrovisores */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.18, 2.05, 2.3]}>
            <boxGeometry args={[0.05, 0.45, 0.05]} />
            <meshStandardMaterial color={escuro} roughness={0.6} />
          </mesh>
          <mesh position={[s * 1.26, 2.05, 2.3]}>
            <boxGeometry args={[0.05, 0.3, 0.16]} />
            <meshStandardMaterial color={escuro} roughness={0.6} />
          </mesh>
        </group>
      ))}
      <Eixo z={1.5} />
      <Eixo z={-2.1} />
    </group>
  );
}

/* Carreta — cavalo mecânico cab-over + reboque branco detalhado */
function Carreta() {
  const escuro = "#2e2e2e";
  const metal = "#b9bec4";
  return (
    <group>
      {/* chassi */}
      <mesh position={[0, 0.72, -0.8]} castShadow>
        <boxGeometry args={[1.8, 0.28, 8.4]} />
        <meshStandardMaterial color={escuro} roughness={0.85} />
      </mesh>
      {/* cabine cab-over arredondada */}
      <RoundedBox
        args={[2.3, 2.1, 2]}
        radius={0.1}
        smoothness={4}
        position={[0, 1.95, 3.5]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={CAMINHAO_BRANCO} roughness={0.35} metalness={0.12} />
      </RoundedBox>
      {/* defletor aerodinâmico */}
      <RoundedBox args={[1.9, 0.3, 1.5]} radius={0.08} smoothness={3} position={[0, 3.12, 3.3]} castShadow>
        <meshStandardMaterial color={CAMINHAO_BRANCO} roughness={0.35} metalness={0.12} />
      </RoundedBox>
      {/* pala solar sobre o para-brisa */}
      <mesh position={[0, 2.62, 4.5]}>
        <boxGeometry args={[2.05, 0.12, 0.3]} />
        <meshStandardMaterial color={escuro} roughness={0.6} />
      </mesh>
      {/* para-brisa */}
      <mesh position={[0, 1.85, 4.53]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[2.05, 1.4, 0.07]} />
        <meshStandardMaterial color={VIDRO} roughness={0.12} metalness={0.55} />
      </mesh>
      {/* janelas laterais da cabine */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.16, 2.1, 3.5]}>
          <boxGeometry args={[0.04, 0.8, 1.4]} />
          <meshStandardMaterial color={VIDRO} roughness={0.12} metalness={0.55} />
        </mesh>
      ))}
      {/* grade com frisos cromados, faróis, indicadores e para-choque */}
      <mesh position={[0, 1.05, 4.53]}>
        <boxGeometry args={[1.9, 0.5, 0.08]} />
        <meshStandardMaterial color="#262626" roughness={0.4} metalness={0.35} />
      </mesh>
      {[1.18, 0.96].map((y) => (
        <mesh key={y} position={[0, y, 4.555]}>
          <boxGeometry args={[1.72, 0.07, 0.04]} />
          <meshStandardMaterial color={metal} roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 0.85, 4.56]}>
          <boxGeometry args={[0.36, 0.18, 0.07]} />
          <meshStandardMaterial color="#fff6cc" emissive="#ffe79a" emissiveIntensity={0.7} />
        </mesh>
      ))}
      {[-1.05, 1.05].map((x) => (
        <mesh key={`seta-${x}`} position={[x, 0.85, 4.56]}>
          <boxGeometry args={[0.2, 0.14, 0.06]} />
          <meshStandardMaterial color="#ffb02e" emissive="#ff9a1f" emissiveIntensity={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.48, 4.6]} castShadow>
        <boxGeometry args={[2.3, 0.3, 0.24]} />
        <meshStandardMaterial color={metal} roughness={0.35} metalness={0.65} />
      </mesh>
      {/* degraus de acesso à cabine */}
      {[0.42, 0.68].map((y) => (
        <mesh key={`degrau-${y}`} position={[0, y, 4.05]}>
          <boxGeometry args={[1.8, 0.07, 0.32]} />
          <meshStandardMaterial color={escuro} roughness={0.7} />
        </mesh>
      ))}
      {/* espelhos */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.28, 2.6, 4.3]}>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
            <meshStandardMaterial color={escuro} roughness={0.6} />
          </mesh>
          <mesh position={[s * 1.36, 2.6, 4.3]}>
            <boxGeometry args={[0.05, 0.32, 0.18]} />
            <meshStandardMaterial color={escuro} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* tanques de combustível */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.05, 0.72, 2.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 1, 12]} />
          <meshStandardMaterial color={metal} roughness={0.3} metalness={0.75} />
        </mesh>
      ))}
      {/* escapamentos cromados */}
      {[-0.75, 0.75].map((x) => (
        <mesh key={`esc-${x}`} position={[x, 2.1, 2.45]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 2, 10]} />
          <meshStandardMaterial color={metal} roughness={0.25} metalness={0.9} />
        </mesh>
      ))}
      {/* arco de roda do eixo dianteiro */}
      {[-1, 1].map((s) => (
        <RoundedBox
          key={`arco-${s}`}
          args={[0.18, 0.14, 1.25]}
          radius={0.05}
          smoothness={3}
          position={[s * 1.11, 1.0, 2.7]}
        >
          <meshStandardMaterial color={escuro} roughness={0.7} />
        </RoundedBox>
      ))}
      {/* reboque com cantos arredondados */}
      <RoundedBox
        args={[2.45, 2.8, 7]}
        radius={0.1}
        smoothness={4}
        position={[0, 2.25, -2.4]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={CAMINHAO_BRANCO} roughness={0.45} metalness={0.08} />
      </RoundedBox>
      {/* vincos laterais do reboque */}
      {[-5.4, -3.9, -2.4, -0.9].map((z) => (
        <mesh key={z} position={[0, 2.25, z]}>
          <boxGeometry args={[2.49, 2.8, 0.06]} />
          <meshStandardMaterial color="#dedede" roughness={0.5} />
        </mesh>
      ))}
      {/* logo Lopas nas portas da cabine */}
      {[-1, 1].map((s) => (
        <mesh
          key={`porta-${s}`}
          position={[s * 1.19, 1.27, 3.5]}
          rotation={[0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.85, 0.85]} />
          <meshStandardMaterial map={logoLopas()} transparent roughness={0.5} />
        </mesh>
      ))}
      {/* adesivos do logo Lopas nas laterais do reboque */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 1.252, 2.25, -2.4]}
          rotation={[0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <planeGeometry args={[2.1, 2.1]} />
          <meshStandardMaterial map={logoLopas()} transparent roughness={0.5} />
        </mesh>
      ))}
      {/* faixa inferior do reboque */}
      <mesh position={[0, 0.95, -2.4]} castShadow>
        <boxGeometry args={[2.47, 0.35, 7]} />
        <meshStandardMaterial color={metal} roughness={0.4} metalness={0.4} />
      </mesh>
      {/* portas traseiras com travessa e fecho */}
      <RoundedBox args={[2.15, 2.6, 0.08]} radius={0.03} smoothness={3} position={[0, 2.25, -5.92]}>
        <meshStandardMaterial color="#d9d9d9" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 2.25, -5.97]}>
        <boxGeometry args={[0.12, 2.6, 0.06]} />
        <meshStandardMaterial color={metal} roughness={0.35} metalness={0.65} />
      </mesh>
      {/* barra anti-embutimento e lanternas traseiras */}
      <mesh position={[0, 0.5, -6.0]} castShadow>
        <boxGeometry args={[2.2, 0.15, 0.15]} />
        <meshStandardMaterial color={metal} roughness={0.4} metalness={0.6} />
      </mesh>
      {[-1.0, 1.0].map((x) => (
        <mesh key={`lanterna-${x}`} position={[x, 0.9, -5.98]}>
          <boxGeometry args={[0.32, 0.14, 0.05]} />
          <meshStandardMaterial color="#e02020" emissive="#c02020" emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* protetores de lama do tandem */}
      {[-1, 1].map((s) => (
        <mesh key={`flap-${s}`} position={[s * 1.08, 0.32, -5.15]}>
          <boxGeometry args={[0.34, 0.5, 0.05]} />
          <meshStandardMaterial color={escuro} roughness={0.9} />
        </mesh>
      ))}
      {/* luzes marcadoras no teto do reboque */}
      {[-0.8, 0, 0.8].map((x) => (
        <mesh key={`mark-${x}`} position={[x, 3.68, 0.75]}>
          <boxGeometry args={[0.24, 0.07, 0.1]} />
          <meshStandardMaterial color="#ffb02e" emissive="#ff9a1f" emissiveIntensity={0.9} />
        </mesh>
      ))}
      {/* pernas de apoio */}
      <mesh position={[0, 0.6, 0.7]}>
        <boxGeometry args={[0.26, 1.15, 0.26]} />
        <meshStandardMaterial color={metal} roughness={0.4} metalness={0.6} />
      </mesh>
      <Eixo z={2.7} />
      <Eixo z={-3.5} largura={2.4} />
      <Eixo z={-4.6} largura={2.4} />
    </group>
  );
}

function Predio({ setTip, clearTip }: { setTip: (t: Tip) => void; clearTip: () => void }) {
  return (
    <group>
      {/* laje de piso — sob o prédio e a área de doca */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[48, 46]} />
        <meshStandardMaterial color={PISO} roughness={0.95} />
      </mesh>

      {/* paredes com captação de topo — fundos, laterais e frente com portões */}
      {[
        { pos: [0, ALT_PAREDE / 2, FUNDOS_Z] as [number, number, number], args: [LIM_X * 2 + 1.2, ALT_PAREDE, 0.6] as [number, number, number], cap: [LIM_X * 2 + 1.6, 0.28, 1] as [number, number, number] },
        ...[-1, 1].map(
          (s) =>
            ({
              pos: [s * LIM_X, ALT_PAREDE / 2, -4] as [number, number, number],
              args: [0.6, ALT_PAREDE, FRENTE_Z - FUNDOS_Z] as [number, number, number],
              cap: [1, 0.28, FRENTE_Z - FUNDOS_Z + 0.4] as [number, number, number],
            }) as const,
        ),
        ...SEG_FRONTAL.map(
          ([cx, w]) =>
            ({
              pos: [cx, ALT_PAREDE / 2, FRENTE_Z] as [number, number, number],
              args: [w, ALT_PAREDE, 0.6] as [number, number, number],
              cap: [w + 0.4, 0.28, 1] as [number, number, number],
            }) as const,
        ),
      ].map((p, i) => (
        <group key={i}>
          <mesh position={p.pos} castShadow receiveShadow>
            <boxGeometry args={p.args} />
            <meshStandardMaterial color={PAREDE} roughness={0.85} />
          </mesh>
          <mesh position={[p.pos[0], ALT_PAREDE + 0.14, p.pos[2]]} castShadow>
            <boxGeometry args={p.cap} />
            <meshStandardMaterial color="#9a9a9a" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* toldos sobre os portões de doca */}
      {PORTOES.map((gx) => (
        <mesh key={gx} position={[gx, 4.4, 9.9]} castShadow>
          <boxGeometry args={[5, 0.3, 3]} />
          <meshStandardMaterial color="#8a8a8a" roughness={0.8} />
        </mesh>
      ))}

      {/* pilares e divisões internas */}
      {PILARES.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, ALT_PAREDE / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[0.7, ALT_PAREDE, 0.7]} />
          <meshStandardMaterial color={PAREDE} roughness={0.85} />
        </mesh>
      ))}
      {[
        { pos: [-12, 1.75, 4] as [number, number, number], args: [10, 3.5, 0.6] as [number, number, number] },
        { pos: [-14.5, 1.75, 8] as [number, number, number], args: [5, 3.5, 0.6] as [number, number, number] },
      ].map((p, i) => (
        <mesh key={i} position={p.pos} castShadow receiveShadow>
          <boxGeometry args={p.args} />
          <meshStandardMaterial color={PAREDE} roughness={0.85} />
        </mesh>
      ))}

      {/* ruas de racks ao fundo */}
      {RUAS.map((rua, r) => {
        const z = -13.5 + r * 4.6;
        return (
          <group key={rua}>
            {NIVEL_Y.map((y) => (
              <mesh key={y} position={[0, y - 0.07, z]} castShadow receiveShadow>
                <boxGeometry args={[LARGURA, 0.14, 1.95]} />
                <meshStandardMaterial color={ESTRUTURA} roughness={0.55} metalness={0.35} />
              </mesh>
            ))}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * (LARGURA / 2 - 0.2), 2.85, z]} castShadow>
                <boxGeometry args={[0.3, 6.1, 0.3]} />
                <meshStandardMaterial color={ESTRUTURA} roughness={0.55} metalness={0.35} />
              </mesh>
            ))}
            {MODULOS.map((modulo, m) =>
              POSICOES.filter((p) => p.rua === rua && p.modulo === modulo).map((p) => {
                const x = (p.numero - (QTD_POS + 1) / 2) * GAP_X;
                const livre = p.ocupacao === null;
                return (
                  <mesh
                    key={p.id}
                    position={[x, NIVEL_Y[m]! + ALT_CAIXA / 2, z]}
                    castShadow={livre ? false : true}
                    receiveShadow
                    onPointerOver={(e) => {
                      e.stopPropagation();
                      setTip({ pos: p, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
                    }}
                    onPointerMove={(e) =>
                      setTip({ pos: p, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY })
                    }
                    onPointerOut={clearTip}
                  >
                    <boxGeometry args={[1.75, ALT_CAIXA, 1.7]} />
                    <meshStandardMaterial
                      color={
                        livre ? "#9a9a90" : new THREE.Color(COR[p.nivel]).multiplyScalar(p.tom)
                      }
                      transparent={livre}
                      opacity={livre ? 0.08 : 1}
                      roughness={livre ? 0.5 : 0.75}
                      emissive={livre ? "#000" : COR[p.nivel]}
                      emissiveIntensity={livre ? 0 : 0.12}
                    />
                  </mesh>
                );
              }),
            )}
          </group>
        );
      })}

      {/* doca — caminhões laranja lado a lado, carretas brancas em ângulo */}
      {[-13.5, -10, -6.5, -3].map((x) => (
        <group key={x} position={[x, 0, 15]}>
          <Caminhao cor={CAMINHAO_LARANJA} />
        </group>
      ))}
      {CARRETAS.map(([x, z]) => (
        <group key={x} position={[x, 0, z]} rotation={[0, -0.55, 0]}>
          <Carreta />
        </group>
      ))}
    </group>
  );
}

export default function Mapa3DOcupacao() {
  const [tip, setTip] = useState<Tip | null>(null);
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  /* estatísticas gerais de ocupação */
  const total = POSICOES.length;
  const ocupadas = POSICOES.filter((p) => p.ocupacao !== null).length;
  const livres = total - ocupadas;
  const pOcup = ((ocupadas / total) * 100).toFixed(1).replace(".", ",");
  const pLivre = (100 - (ocupadas / total) * 100).toFixed(1).replace(".", ",");

  const p = tip?.pos;
  return (
    <div className="relative h-full w-full">
      {montado && (
        <Canvas shadows camera={{ position: [24, 16, 22], fov: 38 }} dpr={[1, 2]}>
          <color attach="background" args={[FUNDO]} />
          <hemisphereLight args={["#e8eef2", "#8a8a7a", 0.55]} />
          <directionalLight
            position={[18, 28, 12]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-34}
            shadow-camera-right={34}
            shadow-camera-top={34}
            shadow-camera-bottom={-34}
            shadow-camera-far={90}
            shadow-bias={-0.0003}
          />
          <directionalLight position={[-14, 12, -10]} intensity={0.4} color="#dfe8e6" />
          <Predio setTip={setTip} clearTip={() => setTip(null)} />
          <OrbitControls
            autoRotate
            autoRotateSpeed={0.55}
            enablePan={false}
            target={[0, 1.5, -2]}
            minDistance={14}
            maxDistance={75}
            maxPolarAngle={Math.PI / 2.15}
          />
        </Canvas>
      )}

      {/* card de ocupação — overlay translúcido centralizado sobre a cena */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="w-64 rounded-2xl bg-[#1f2224]/90 p-5 shadow-2xl ring-1 ring-white/10">
          <p className="text-lg font-bold text-white">Ocupação do CD</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[#a0a0a0]">
            {total} endereços monitorados, do piso ao sétimo nível.
          </p>
          <div className="mt-4">
            <div className="flex items-end justify-between gap-2">
              <p className="text-[10px] uppercase text-[#a0a0a0]">Endereços ocupados</p>
              <p className="text-xl font-bold text-white">
                {ocupadas}{" "}
                <span className="text-sm font-normal italic text-[#6ea52e]">{pOcup}%</span>
              </p>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-sm bg-[#333638]">
              <div
                className="h-full rounded-sm bg-[#6ea52e]"
                style={{ width: `${(ocupadas / total) * 100}%` }}
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-end justify-between gap-2">
              <p className="text-[10px] uppercase text-[#a0a0a0]">Endereços livres</p>
              <p className="text-xl font-bold text-white">
                {livres}{" "}
                <span className="text-sm font-normal italic text-[#f48c26]">{pLivre}%</span>
              </p>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-sm bg-[#333638]">
              <div
                className="h-full rounded-sm bg-[#f48c26]"
                style={{ width: `${(livres / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip — Rua · Módulo · Posição · Ocupação */}
      {p && tip && (
        <div
          className="pointer-events-none fixed z-50 w-40 -translate-y-full rounded-lg border border-white/10 bg-black/85 px-3 py-2 text-[11px] leading-relaxed text-white shadow-xl backdrop-blur"
          style={{ left: tip.x + 14, top: tip.y - 10 }}
        >
          <p>
            <span className="text-white/50">Rua:</span> {p.rua}
          </p>
          <p>
            <span className="text-white/50">Módulo:</span> {p.modulo}
          </p>
          <p>
            <span className="text-white/50">Posição:</span>{" "}
            {String(p.numero).padStart(2, "0")}
          </p>
          <p className={cn(p.nivel === "alta" && "-mx-1 rounded bg-[#d93a3a] px-1 font-bold text-white")}>
            <span className={cn("text-white/50", p.nivel === "alta" && "text-white/80")}>
              Ocupação:
            </span>{" "}
            {p.ocupacao === null ? "livre" : `${p.ocupacao}%`}
          </p>
        </div>
      )}
    </div>
  );
}
