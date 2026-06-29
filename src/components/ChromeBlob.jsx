import { Canvas } from "@react-three/fiber";
import { Float, Environment, MeshDistortMaterial, Icosahedron } from "@react-three/drei";
import { Suspense } from "react";

function Blob() {
  return (
    <Float speed={1.5} rotationIntensity={1.4} floatIntensity={1.8}>
      <Icosahedron args={[1.45, 24]}>
        <MeshDistortMaterial color="#cdd2dc" metalness={1} roughness={0.06}
          distort={0.38} speed={1.8} envMapIntensity={1.4} />
      </Icosahedron>
    </Float>
  );
}

export default function ChromeBlob({ className = "" }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 4.2], fov: 42 }} dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 4, 4]} intensity={2.2} />
        <Suspense fallback={null}>
          <Blob />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
