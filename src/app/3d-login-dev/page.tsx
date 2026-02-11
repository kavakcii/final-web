"use client";

import React, { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

// =============================================
// DOME ROOF
// =============================================
function DomeRoof() {
  const ref = useRef<THREE.Mesh>(null!);
  return (
    <group position={[0, 9, 0]}>
      {/* Main dome - half sphere */}
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
        <meshStandardMaterial
          color="#1a2a3a"
          metalness={0.6}
          roughness={0.2}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Dome wireframe */}
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[8.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
        <meshStandardMaterial
          color="#c0c8d0"
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Dome rim ring */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8, 0.15, 8, 64]} />
        <meshStandardMaterial color="#d0d8e0" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Dome rim glow */}
      <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8.2, 0.05, 8, 64]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
      </mesh>
      {/* Neon FINAL text on dome */}
      <mesh position={[0, 1.5, 6.5]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[6, 1.2, 0.05]} />
        <meshStandardMaterial color="#0a1520" metalness={0.3} roughness={0.5} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// =============================================
// NEON FINAL TEXT (on dome)
// =============================================
function NeonText() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        (child as THREE.Mesh).position.y = 10.5 + Math.sin(t * 1.5 + i * 0.4) * 0.04;
      });
    }
  });

  const letters = [
    { w: 0.55, x: -2.0 }, // F
    { w: 0.35, x: -1.2 }, // I
    { w: 0.55, x: -0.5 }, // N
    { w: 0.55, x: 0.4 },  // A
    { w: 0.45, x: 1.2 },  // L
  ];

  return (
    <group ref={ref}>
      {letters.map((l, i) => (
        <mesh key={i} position={[l.x, 10.5, 6.55]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[l.w, 0.7, 0.06]} />
          <meshStandardMaterial
            color="#22d3ee"
            emissive="#06b6d4"
            emissiveIntensity={4}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// =============================================
// CURVED WING COLUMNS (both sides)
// =============================================
function WingColumns() {
  const createWing = (side: number) => {
    const elements: JSX.Element[] = [];
    // Main curved pillar
    for (let i = 0; i < 12; i++) {
      const angle = (i / 11) * Math.PI * 0.4;
      const x = side * (4 + Math.sin(angle) * 5);
      const y = i * 0.8;
      const z = Math.cos(angle) * 2;
      elements.push(
        <mesh key={`pillar-${side}-${i}`} position={[x, y, z + 2]}>
          <boxGeometry args={[0.4, 0.9, 0.4]} />
          <meshStandardMaterial color="#c8d0d8" metalness={0.7} roughness={0.15} />
        </mesh>
      );
    }
    // Outer curved column
    elements.push(
      <mesh key={`outer-${side}`} position={[side * 7.5, 4.5, 3]}>
        <cylinderGeometry args={[0.5, 0.7, 9, 16]} />
        <meshStandardMaterial color="#d0d8e0" metalness={0.8} roughness={0.1} />
      </mesh>
    );
    // Inner tall column
    elements.push(
      <mesh key={`inner-${side}`} position={[side * 4.5, 4.5, 3.5]}>
        <cylinderGeometry args={[0.4, 0.5, 9, 16]} />
        <meshStandardMaterial color="#c8d0d8" metalness={0.8} roughness={0.1} />
      </mesh>
    );
    // Curved balcony platform
    elements.push(
      <mesh key={`balcony-${side}`} position={[side * 6, 5, 3]}>
        <boxGeometry args={[4, 0.15, 3]} />
        <meshStandardMaterial color="#b0b8c0" metalness={0.6} roughness={0.2} />
      </mesh>
    );
    // Balcony railing
    elements.push(
      <mesh key={`railing-${side}`} position={[side * 6, 5.5, 4.5]}>
        <boxGeometry args={[4, 0.05, 0.05]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} />
      </mesh>
    );
    // Glass panel on wing
    elements.push(
      <mesh key={`glass-${side}`} position={[side * 6, 4, 4.55]}>
        <boxGeometry args={[3.5, 4.5, 0.05]} />
        <meshStandardMaterial color="#1a3040" metalness={0.3} roughness={0.1} transparent opacity={0.3} />
      </mesh>
    );
    // Neon edge on wing
    elements.push(
      <mesh key={`neon-${side}`} position={[side * 6, 6.3, 4.55]}>
        <boxGeometry args={[3.8, 0.04, 0.04]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} />
      </mesh>
    );
    return elements;
  };

  return (
    <group>
      {createWing(-1)}
      {createWing(1)}
    </group>
  );
}

// =============================================
// MAIN BUILDING BODY
// =============================================
function BuildingBody() {
  return (
    <group>
      {/* Center structure */}
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[10, 9, 7]} />
        <meshStandardMaterial color="#1a2030" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Front face */}
      <mesh position={[0, 4.5, 3.51]}>
        <boxGeometry args={[10, 9, 0.05]} />
        <meshStandardMaterial color="#202838" metalness={0.6} roughness={0.15} />
      </mesh>
      {/* Glass sections on front */}
      <mesh position={[-3, 5.5, 3.55]}>
        <boxGeometry args={[2, 4, 0.05]} />
        <meshStandardMaterial color="#0a2030" metalness={0.2} roughness={0.1} transparent opacity={0.4} />
      </mesh>
      <mesh position={[3, 5.5, 3.55]}>
        <boxGeometry args={[2, 4, 0.05]} />
        <meshStandardMaterial color="#0a2030" metalness={0.2} roughness={0.1} transparent opacity={0.4} />
      </mesh>
      {/* Interior glow visible through entrance */}
      <mesh position={[0, 3, 1]}>
        <boxGeometry args={[4, 5, 3]} />
        <meshStandardMaterial color="#0c1825" metalness={0.3} roughness={0.5} transparent opacity={0.3} />
      </mesh>
      {/* Entrance arch frame */}
      <mesh position={[0, 5.5, 3.6]}>
        <boxGeometry args={[4.5, 0.3, 0.2]} />
        <meshStandardMaterial color="#c0c8d0" metalness={0.8} roughness={0.1} />
      </mesh>
      {/* FINAL text above entrance */}
      <mesh position={[0, 5, 3.65]}>
        <boxGeometry args={[3, 0.8, 0.05]} />
        <meshStandardMaterial color="#0a1520" transparent opacity={0.7} />
      </mesh>
      {/* Horizontal glow lines on building */}
      {[2, 4, 6, 8].map((y) => (
        <mesh key={y} position={[0, y, 3.58]}>
          <boxGeometry args={[10.2, 0.03, 0.03]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================
// ENTRANCE NEON TEXT
// =============================================
function EntranceText() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      const glow = 3 + Math.sin(t * 2) * 1;
      ref.current.children.forEach((child: any) => {
        if (child.material) child.material.emissiveIntensity = glow;
      });
    }
  });

  const letters = [
    { w: 0.4, x: -1.1 },
    { w: 0.25, x: -0.55 },
    { w: 0.4, x: -0.1 },
    { w: 0.4, x: 0.4 },
    { w: 0.35, x: 0.95 },
  ];

  return (
    <group ref={ref}>
      {letters.map((l, i) => (
        <mesh key={i} position={[l.x, 5, 3.7]}>
          <boxGeometry args={[l.w, 0.5, 0.04]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={3} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================
// CENTER STAIRS
// =============================================
function CenterStairs() {
  const steps: JSX.Element[] = [];
  const stepCount = 8;

  for (let i = 0; i < stepCount; i++) {
    const width = 4.5 - i * 0.15;
    steps.push(
      <mesh key={`step-${i}`} position={[0, i * 0.3 + 0.15, 5 + i * 0.5]}>
        <boxGeometry args={[width, 0.3, 0.5]} />
        <meshStandardMaterial color="#1a2535" metalness={0.6} roughness={0.2} />
      </mesh>
    );
    // Step edge glow
    steps.push(
      <mesh key={`glow-${i}`} position={[0, i * 0.3 + 0.31, 5 + i * 0.5 - 0.24]}>
        <boxGeometry args={[width, 0.02, 0.02]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
      </mesh>
    );
  }

  // Side rails
  [-1, 1].forEach((side) => {
    steps.push(
      <mesh key={`rail-${side}`} position={[side * 2.3, 1.8, 7]} rotation={[-Math.atan2(stepCount * 0.3, stepCount * 0.5), 0, 0]}>
        <boxGeometry args={[0.06, 0.06, stepCount * 0.6]} />
        <meshStandardMaterial color="#c0c8d0" metalness={0.8} roughness={0.1} />
      </mesh>
    );
    // Rail posts
    for (let i = 0; i < stepCount; i += 2) {
      steps.push(
        <mesh key={`post-${side}-${i}`} position={[side * 2.3, i * 0.15 + 0.6, 5 + i * 0.5]}>
          <cylinderGeometry args={[0.025, 0.025, 0.8, 8]} />
          <meshStandardMaterial color="#b0b8c0" metalness={0.7} roughness={0.2} />
        </mesh>
      );
    }
  });

  return <group>{steps}</group>;
}

// =============================================
// SIDE STAIRS (going up on both wings)
// =============================================
function SideStairs() {
  const makeStairs = (side: number) => {
    const elements: JSX.Element[] = [];
    const stepCount = 10;
    for (let i = 0; i < stepCount; i++) {
      elements.push(
        <mesh key={`side-step-${side}-${i}`} position={[side * 5.5, i * 0.35 + 0.15, 4.5 + i * 0.35]}>
          <boxGeometry args={[2.5, 0.25, 0.35]} />
          <meshStandardMaterial color="#1a2535" metalness={0.6} roughness={0.2} />
        </mesh>
      );
      // Neon edge
      elements.push(
        <mesh key={`side-glow-${side}-${i}`} position={[side * 5.5, i * 0.35 + 0.28, 4.5 + i * 0.35 - 0.16]}>
          <boxGeometry args={[2.5, 0.015, 0.015]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} transparent opacity={0.7} />
        </mesh>
      );
    }
    return elements;
  };

  return (
    <group>
      {makeStairs(-1)}
      {makeStairs(1)}
    </group>
  );
}

// =============================================
// SLIDING DOORS
// =============================================
function SlidingDoors({ isOpen }: { isOpen: boolean }) {
  const leftDoor = useRef<THREE.Mesh>(null!);
  const rightDoor = useRef<THREE.Mesh>(null!);
  const openAmount = useRef(0);

  useFrame(() => {
    openAmount.current = THREE.MathUtils.lerp(openAmount.current, isOpen ? 1 : 0, 0.025);
    const offset = openAmount.current * 1.3;
    if (leftDoor.current) leftDoor.current.position.x = -0.8 - offset;
    if (rightDoor.current) rightDoor.current.position.x = 0.8 + offset;
  });

  return (
    <group position={[0, 2.8, 3.6]}>
      <mesh ref={leftDoor} position={[-0.8, 0, 0]}>
        <boxGeometry args={[1.5, 5.2, 0.06]} />
        <meshStandardMaterial color="#0c1825" metalness={0.3} roughness={0.1} transparent opacity={0.5} />
      </mesh>
      <mesh ref={rightDoor} position={[0.8, 0, 0]}>
        <boxGeometry args={[1.5, 5.2, 0.06]} />
        <meshStandardMaterial color="#0c1825" metalness={0.3} roughness={0.1} transparent opacity={0.5} />
      </mesh>
      {/* Door frame glow */}
      <mesh position={[0, 2.65, 0.05]}>
        <boxGeometry args={[3.5, 0.05, 0.05]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={isOpen ? 4 : 1.5} />
      </mesh>
      {/* Sensor */}
      <mesh position={[0, 5.5, 0.1]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={isOpen ? "#22c55e" : "#ef4444"}
          emissive={isOpen ? "#22c55e" : "#ef4444"}
          emissiveIntensity={4}
        />
      </mesh>
    </group>
  );
}

// =============================================
// FOUNTAINS
// =============================================
function Fountains() {
  const leftRef = useRef<THREE.Group>(null!);
  const rightRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Animate water particles
    [leftRef, rightRef].forEach((ref) => {
      if (ref.current) {
        ref.current.children.forEach((child: any, i: number) => {
          if (child.userData?.isWater) {
            child.position.y = 0.5 + Math.abs(Math.sin(t * 3 + i * 0.5)) * 1.2;
            child.scale.setScalar(0.8 + Math.sin(t * 2 + i) * 0.2);
          }
        });
      }
    });
  });

  const createFountain = (side: number, ref: React.RefObject<THREE.Group>) => (
    <group ref={ref as any} position={[side * 10, 0, 9]}>
      {/* Basin */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.8, 2, 0.6, 32]} />
        <meshStandardMaterial color="#1a2535" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Water surface */}
      <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.7, 32]} />
        <meshStandardMaterial color="#0c4a6e" metalness={0.3} roughness={0.1} transparent opacity={0.6} />
      </mesh>
      {/* Basin rim glow */}
      <mesh position={[0, 0.61, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.03, 8, 32]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
      </mesh>
      {/* Center column */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1.2, 16]} />
        <meshStandardMaterial color="#c0c8d0" metalness={0.8} roughness={0.1} />
      </mesh>
      {/* Water particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.5, 1, Math.sin(angle) * 0.5]}
            userData={{ isWater: true }}
          >
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={2} transparent opacity={0.7} />
          </mesh>
        );
      })}
      {/* Fountain light */}
      <pointLight position={[0, 1.5, 0]} intensity={3} color="#22d3ee" distance={6} />
    </group>
  );

  return (
    <group>
      {createFountain(-1, leftRef)}
      {createFountain(1, rightRef)}
    </group>
  );
}

// =============================================
// GROUND & PLAZA
// =============================================
function GroundPlaza() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 12]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#0a0e18" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Center path glow lines */}
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 0.01, 16]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.03, 22]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} transparent opacity={0.4} />
        </mesh>
      ))}
      {/* Ground dots */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[0, 0.02, 8 + i * 1.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.04, 12]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================
// STREET LAMPS
// =============================================
function StreetLamps() {
  return (
    <group>
      {[-1, 1].map((side) =>
        [0, 1, 2].map((i) => (
          <group key={`${side}-${i}`} position={[side * 14, 0, 8 + i * 8]}>
            <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.04, 0.07, 6, 8]} />
              <meshStandardMaterial color="#c0c8d0" metalness={0.8} roughness={0.15} />
            </mesh>
            <mesh position={[0, 6, 0]}>
              <boxGeometry args={[0.3, 0.6, 0.3]} />
              <meshStandardMaterial color="#e0e8f0" metalness={0.6} roughness={0.2} />
            </mesh>
            <mesh position={[0, 5.65, 0]}>
              <boxGeometry args={[0.35, 0.04, 0.35]} />
              <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
            </mesh>
            <pointLight position={[0, 5.5, 0]} intensity={8} color="#e0e8f0" distance={15} />
          </group>
        ))
      )}
    </group>
  );
}

// =============================================
// DUST PARTICLES
// =============================================
function DustParticles() {
  const ref = useRef<THREE.Points>(null!);
  const count = 300;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 12;
      pos[i * 3 + 2] = Math.random() * 30;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#22d3ee" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

// =============================================
// CAMERA CONTROLLER
// =============================================
function CameraController({ onDoorReached }: { onDoorReached: (v: boolean) => void }) {
  const { camera } = useThree();
  const progress = useRef(0);
  const startPos = useMemo(() => new THREE.Vector3(0, 4, 32), []);
  const endPos = useMemo(() => new THREE.Vector3(0, 3.2, 8), []);
  const lookTarget = useMemo(() => new THREE.Vector3(0, 4, 0), []);

  useFrame((state, delta) => {
    progress.current = Math.min(progress.current + delta * 0.055, 1);
    const t = 1 - Math.pow(1 - progress.current, 3);
    camera.position.lerpVectors(startPos, endPos, t);
    const time = state.clock.getElapsedTime();
    camera.position.x += Math.sin(time * 0.4) * 0.06 * (1 - t);
    camera.position.y += Math.sin(time * 0.6) * 0.04 * (1 - t);
    camera.lookAt(lookTarget);
    onDoorReached(progress.current > 0.72);
  });

  return null;
}

// =============================================
// FULL SCENE
// =============================================
function Scene({ onDoorReached }: { onDoorReached: (v: boolean) => void }) {
  const [doorOpen, setDoorOpen] = useState(false);

  const handleDoorReached = (reached: boolean) => {
    setDoorOpen(reached);
    onDoorReached(reached);
  };

  return (
    <Canvas
      camera={{ position: [0, 4, 32], fov: 50 }}
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#020510"]} />
      <fog attach="fog" args={["#020510", 18, 50]} />

      <ambientLight intensity={0.12} />
      <directionalLight position={[5, 12, 8]} intensity={0.5} color="#c4d5f0" />
      <pointLight position={[0, 6, 5]} intensity={20} color="#22d3ee" distance={15} />
      <pointLight position={[0, 3, 10]} intensity={8} color="#67e8f9" distance={12} />
      <spotLight position={[0, 15, 5]} angle={0.3} penumbra={0.6} intensity={30} color="#22d3ee" />

      <Suspense fallback={null}>
        <BuildingBody />
        <DomeRoof />
        <NeonText />
        <WingColumns />
        <CenterStairs />
        <SideStairs />
        <SlidingDoors isOpen={doorOpen} />
        <EntranceText />
        <Fountains />
        <GroundPlaza />
        <StreetLamps />
        <DustParticles />
        <Stars radius={80} depth={60} count={2500} factor={3} saturation={0.1} fade speed={0.3} />
      </Suspense>

      <CameraController onDoorReached={handleDoorReached} />
    </Canvas>
  );
}

// =============================================
// LOGIN FORM
// =============================================
function LoginForm({ visible }: { visible: boolean }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, color: "#fff", fontSize: 14,
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.3s, box-shadow 0.3s",
  };

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 20, pointerEvents: visible ? "auto" : "none",
      opacity: visible ? 1 : 0, transition: "opacity 1.2s ease",
    }}>
      <div style={{
        width: 380, padding: 40, borderRadius: 24,
        background: "rgba(5, 10, 25, 0.8)",
        backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(34, 211, 238, 0.15)",
        boxShadow: "0 0 80px rgba(34, 211, 238, 0.08), 0 30px 60px rgba(0,0,0,0.5)",
        transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.9)",
        transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease",
        opacity: visible ? 1 : 0,
      }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -1 }}>
            Fin<span style={{ background: "linear-gradient(135deg, #06b6d4, #22d3ee, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          </h1>
        </div>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 28 }}>
          {isLogin ? "Tekrar hoşgeldiniz" : "Yeni hesap oluşturun"}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "rgba(34,211,238,0.5)"; e.target.style.boxShadow = "0 0 20px rgba(34,211,238,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "rgba(34,211,238,0.5)"; e.target.style.boxShadow = "0 0 20px rgba(34,211,238,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          {!isLogin && (
            <div style={{ marginBottom: 14 }}>
              <input type="password" placeholder="Şifre tekrar" required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "rgba(34,211,238,0.5)"; e.target.style.boxShadow = "0 0 20px rgba(34,211,238,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          )}

          <button type="submit" disabled={isLoading} style={{
            width: "100%", padding: 14, marginTop: 8,
            background: "linear-gradient(135deg, #0891b2, #06b6d4, #22d3ee)",
            border: "none", borderRadius: 14, color: "#fff",
            fontSize: 15, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "transform 0.3s, box-shadow 0.3s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(34,211,238,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {isLoading ? <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : (isLogin ? "Giriş Yap" : "Kayıt Ol")}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "22px 0", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, letterSpacing: 1 }}>VEYA</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Google", "GitHub"].map((name) => (
            <button key={name} style={{
              flex: 1, padding: 12, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14,
              color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
              transition: "all 0.3s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            >{name}</button>
          ))}
        </div>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 22 }}>
          {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
          <button onClick={() => setIsLogin(!isLogin)} style={{
            background: "none", border: "none", color: "#22d3ee",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{isLogin ? "Kayıt Ol" : "Giriş Yap"}</button>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: rgba(255,255,255,0.3) !important; }`}</style>
    </div>
  );
}

// =============================================
// MAIN
// =============================================
export default function ThreeDLoginDev() {
  const [showForm, setShowForm] = useState(false);
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "#020510" }}>
      <Scene onDoorReached={setShowForm} />
      <LoginForm visible={showForm} />
      {!showForm && (
        <button onClick={() => setShowForm(true)} style={{
          position: "absolute", bottom: 30, right: 30, zIndex: 30,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, color: "rgba(255,255,255,0.5)", padding: "10px 20px",
          fontSize: 13, cursor: "pointer", backdropFilter: "blur(10px)",
        }}>Atla →</button>
      )}
    </div>
  );
}
