/**
 * KnowledgeCore3D — Premium Interactive 3D AI Knowledge Core
 * 
 * Represents intelligent knowledge retrieval for DSP Asset Management Company.
 * Built with Three.js and React Three Fiber.
 * 
 * Features:
 * - Refined fintech aesthetic: layered translucent glass, metallic geodesic structure, fine nodes
 * - Teal (#12B8A6) and cyan (#0EA5E9) illumination
 * - Dynamic state reactivity: 'idle' | 'processing' | 'answered'
 * - Controlled particle cloud and orbital rings
 * - Smooth pointer-following camera tilt with damped lerp
 * - Throttles on mobile (reduced geometry, particle count, lower DPR)
 * - Accessible: respects `prefers-reduced-motion`
 * - WebGL error boundary and graceful fallback
 */

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import KnowledgeCoreCSSFallback from './KnowledgeCoreCSSFallback';

export type AssistantCoreState = 'idle' | 'processing' | 'answered';

interface KnowledgeCore3DProps {
  state?: AssistantCoreState;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

// ─── WebGL Detection ─────────────────────────────────────────────────

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// ─── 3D Core Scene ───────────────────────────────────────────────────

interface CoreSceneProps {
  coreState: AssistantCoreState;
  isReducedMotion: boolean;
  isMobile: boolean;
}

function CoreScene({ coreState, isReducedMotion, isMobile }: CoreSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const outerLatticeRef = useRef<THREE.Mesh>(null);
  const innerIcosaRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

  const { pointer } = useThree();

  // Particle positions: 50 on mobile for high framerate, 110 on desktop
  const particleCount = isMobile ? 50 : 110;
  const [particlePositions, particleColors] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const teal = new THREE.Color('#12B8A6');
    const cyan = new THREE.Color('#38BDF8');
    const white = new THREE.Color('#FFFFFF');

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = 1.7 + (Math.sin(i * 1.8) * 0.35);

      positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const mixed = i % 4 === 0 ? white : (i % 2 === 0 ? teal : cyan);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }
    return [positions, colors];
  }, [particleCount]);

  // Frame update loop
  useFrame((state, delta) => {
    if (isReducedMotion) return;

    const t = state.clock.getElapsedTime();
    const isProcessing = coreState === 'processing';
    const isAnswered = coreState === 'answered';

    // Rotational speed modulation
    const speed = isProcessing ? 1.9 : (isAnswered ? 0.7 : 0.45);
    const pulseFactor = isProcessing ? Math.sin(t * 8) * 0.12 : Math.sin(t * 1.6) * 0.04;

    // Follow mouse pointer with smooth dampening
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed * 0.5;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        pointer.y * 0.22,
        0.06
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        -pointer.x * 0.22,
        0.06
      );
    }

    // Inner glass core: counter-rotates and gently pulses
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.x -= delta * speed * 0.7;
      innerCoreRef.current.rotation.y -= delta * speed * 0.4;
      const scale = 0.95 + pulseFactor;
      innerCoreRef.current.scale.set(scale, scale, scale);
    }

    // Inner icosahedron node cluster
    if (innerIcosaRef.current) {
      innerIcosaRef.current.rotation.y += delta * speed * 0.8;
      innerIcosaRef.current.rotation.z += delta * speed * 0.3;
    }

    // Outer geodesic wireframe lattice
    if (outerLatticeRef.current) {
      outerLatticeRef.current.rotation.y += delta * speed * 0.6;
      outerLatticeRef.current.rotation.z += delta * speed * 0.3;
      const latticeScale = 1.32 + (isProcessing ? Math.sin(t * 6) * 0.06 : Math.sin(t * 1.5) * 0.02);
      outerLatticeRef.current.scale.set(latticeScale, latticeScale, latticeScale);
    }

    // Orbital rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * speed * 0.3;
      ring1Ref.current.rotation.y += delta * speed * 0.25;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * speed * 0.35;
      ring2Ref.current.rotation.z += delta * speed * 0.2;
    }

    // Particle field rotation
    if (particlesRef.current) {
      particlesRef.current.rotation.y -= delta * (speed * 0.3);
      particlesRef.current.rotation.x += delta * (speed * 0.15);
    }

    // Point light intensity breathing
    if (pointLightRef.current) {
      pointLightRef.current.intensity = isProcessing
        ? 3.4 + Math.sin(t * 10) * 1.8
        : 2.0 + Math.sin(t * 2) * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Illuminator */}
      <pointLight ref={pointLightRef} color="#12B8A6" intensity={2.2} distance={7} decay={2} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 5, 4]} intensity={1.6} color="#E0F2FE" />
      <directionalLight position={[-4, -3, -3]} intensity={0.7} color="#0B1220" />

      {/* 1. Deep Core: Translucent Sapphire/Teal Physical Sphere */}
      <mesh ref={innerCoreRef}>
        <sphereGeometry args={[0.78, 32, 32]} />
        <meshPhysicalMaterial
          color="#0F766E"
          emissive={coreState === 'processing' ? '#14B8A6' : '#0D9488'}
          emissiveIntensity={coreState === 'processing' ? 0.9 : 0.35}
          roughness={0.15}
          metalness={0.2}
          transmission={0.6}
          thickness={1.1}
          ior={1.4}
          clearcoat={0.9}
        />
      </mesh>

      {/* 2. Inner Node Geometric Skeleton (Icosahedron) */}
      <mesh ref={innerIcosaRef}>
        <icosahedronGeometry args={[0.92, 1]} />
        <meshStandardMaterial
          color="#38BDF8"
          wireframe
          transparent
          opacity={0.35}
          emissive="#0284C7"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 3. Outer Geodesic Metal Lattice (Dodecahedron) */}
      <mesh ref={outerLatticeRef}>
        <dodecahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial
          color="#5EEAD4"
          wireframe
          transparent
          opacity={coreState === 'processing' ? 0.85 : 0.45}
          emissive="#12B8A6"
          emissiveIntensity={coreState === 'processing' ? 0.8 : 0.25}
        />
      </mesh>

      {/* 4. Restrained Orbital Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.5, 0.012, 16, 64]} />
        <meshStandardMaterial
          color="#38BDF8"
          transparent
          opacity={0.3}
          emissive="#0284C7"
          emissiveIntensity={0.3}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.65, 0.01, 16, 64]} />
        <meshStandardMaterial
          color="#12B8A6"
          transparent
          opacity={0.25}
          emissive="#14B8A6"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* 5. Orbiting Knowledge Data Nodes */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isMobile ? 0.045 : 0.06}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// ─── Error Boundary ──────────────────────────────────────────────────

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('KnowledgeCore3D WebGL context error handled gracefully:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ─── Main Component ──────────────────────────────────────────────────

export default function KnowledgeCore3D({
  state = 'idle',
  className = '',
  size = 'md',
  interactive = true,
}: KnowledgeCore3DProps) {
  const [mounted, setMounted] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWebglSupported(isWebGLAvailable());

    // Check media queries
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(motionQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener('change', motionListener);

    const mobileQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mobileQuery.matches);
    const mobileListener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mobileQuery.addEventListener('change', mobileListener);

    return () => {
      motionQuery.removeEventListener('change', motionListener);
      mobileQuery.removeEventListener('change', mobileListener);
    };
  }, []);

  if (!mounted || !webglSupported) {
    return <KnowledgeCoreCSSFallback state={state} className={className} size={size} />;
  }

  // Size dimensions
  const dimensions = {
    sm: { width: 140, height: 140 },
    md: { width: 260, height: 260 },
    lg: { width: 340, height: 340 },
  }[size];

  return (
    <div
      className={`knowledge-core-3d-container ${className}`}
      style={{
        position: 'relative',
        width: dimensions.width,
        height: dimensions.height,
        maxWidth: '100%',
        margin: '0 auto',
      }}
      aria-label={`Interactive 3D DSP Knowledge Core (${state})`}
    >
      <WebGLErrorBoundary fallback={<KnowledgeCoreCSSFallback state={state} size={size} />}>
        <Canvas
          camera={{ position: [0, 0, 3.8], fov: 46 }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          style={{ width: '100%', height: '100%', pointerEvents: interactive ? 'auto' : 'none' }}
        >
          <Suspense fallback={null}>
            <CoreScene
              coreState={state}
              isReducedMotion={isReducedMotion}
              isMobile={isMobile}
            />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
