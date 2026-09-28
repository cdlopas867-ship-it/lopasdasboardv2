import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

/* Visualizador 3D do produto — imagem da peça em um plano rotacionável
   com moldura e iluminação, usando a textura do asset já importado. */

function ProdutoMesh({ imagem }: { imagem: string }) {
  const texture = useTexture(imagem);
  texture.colorSpace = THREE.SRGBColorSpace;

  const img = texture.image as HTMLImageElement | undefined;
  const aspect =
    img && img.width && img.height ? img.width / img.height : 4 / 3;
  const w = 4;
  const h = w / aspect;

  return (
    <group>
      {/* Moldura */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[w + 0.22, h + 0.22]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      {/* Imagem do produto */}
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} roughness={0.4} metalness={0.05} />
      </mesh>
    </group>
  );
}

export default function Modelo3DProduto({
  imagem,
  nome,
}: {
  imagem: string;
  nome: string;
}) {
  return (
    <div className="relative h-60 w-full overflow-hidden rounded-xl bg-gradient-to-b from-secondary/50 to-secondary/20 sm:h-72">
      <Canvas camera={{ position: [0, 0, 5], fov: 40 }} dpr={[1, 2]}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 3, 5]} intensity={1.3} />
        <directionalLight position={[-3, -2, 2]} intensity={0.3} />
        <Suspense fallback={null}>
          <ProdutoMesh imagem={imagem} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.7}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
        />
      </Canvas>
      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
        Arraste para girar · {nome}
      </span>
    </div>
  );
}
