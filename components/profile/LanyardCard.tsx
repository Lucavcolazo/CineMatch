/* eslint-disable react/no-unknown-property */
'use client';
import { useEffect, useRef, useState } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer, Html } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  RigidBodyProps
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';
import { lanyardState } from '@/lib/store/lanyardStore';

extend({ MeshLineGeometry, MeshLineMaterial });

// Calculate level based on watched count
function calculateLevel(watchedCount: number): number {
  if (watchedCount >= 1000) return 10;
  if (watchedCount >= 900) return 9;
  if (watchedCount >= 750) return 8;
  if (watchedCount >= 600) return 7;
  if (watchedCount >= 450) return 6;
  if (watchedCount >= 300) return 5;
  if (watchedCount >= 200) return 4;
  if (watchedCount >= 100) return 3;
  if (watchedCount >= 50) return 2;
  return 1;
}

interface LanyardCardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  // User data to display on card
  displayName?: string;
  avatarIcon?: string | null;
  avatarColor?: string | null;
  avatarUrl?: string | null;
  watchedCount?: number;
}

export default function LanyardCard({
  position = [0, 0, 18],
  gravity = [0, -40, 0],
  fov = 25,
  transparent = true,
  displayName = 'Usuario',
  avatarIcon = 'User',
  avatarColor = '#6366f1',
  avatarUrl = null,
  watchedCount = 0
}: LanyardCardProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = (): void => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const level = calculateLevel(watchedCount);

  return (
    <div className="relative z-0 w-full h-full min-h-[600px] flex justify-center items-start">
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
      >
        <ambientLight intensity={0.8} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band 
            isMobile={isMobile} 
            displayName={displayName}
            avatarIcon={avatarIcon}
            avatarColor={avatarColor}
            avatarUrl={avatarUrl}
            level={level}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={1.5}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={2}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={2}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={4}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  displayName?: string;
  avatarIcon?: string | null;
  avatarColor?: string | null;
  avatarUrl?: string | null;
  level?: number;
}

function Band({ 
  maxSpeed = 50, 
  minSpeed = 0, 
  isMobile = false,
  displayName = 'Usuario',
  avatarIcon = 'User',
  avatarColor = '#6366f1',
  avatarUrl = null,
  level = 1
}: BandProps) {
  const band = useRef<any>(null);
  const fixed = useRef<any>(null);
  const j1 = useRef<any>(null);
  const j2 = useRef<any>(null);
  const j3 = useRef<any>(null);
  const card = useRef<any>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  
  // Use state to capture the initial value on mount
  const [initialHasAnimated] = useState(lanyardState.hasAnimated);

  useEffect(() => {
    // Set to true after mount so next time it skips animation
    lanyardState.hasAnimated = true;
  }, []);

  const segmentProps: any = {
    type: 'dynamic' as RigidBodyProps['type'],
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4
  };

  const { nodes, materials } = useGLTF('/lanyard/card.glb') as any;
  const texture = useTexture('/lanyard/lanyard.png');
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  // Rope joints - 3 segments (Restored original length)
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0]
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== 'boolean') {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      });
    }
    if (fixed.current) {
      [j1, j2, j3].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      // Curve updated for 4 segments (fixed, j1, j2, j3, card)
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  // Icon SVG paths for common icons
  const getIconPath = (iconName: string | null) => {
    switch (iconName) {
      case 'Heart':
        return 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
      case 'Star':
        return 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
      case 'Film':
        return 'M19.82 2H4.18A2.18 2.18 0 0 0 2 4.18v15.64A2.18 2.18 0 0 0 4.18 22h15.64A2.18 2.18 0 0 0 22 19.82V4.18A2.18 2.18 0 0 0 19.82 2zM7 2v6m0 8v6m10-20v6m0 8v6';
      case 'Ghost':
        return 'M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z';
      case 'Bot':
        return 'M12 8V4H8m8 4V4h-4m-6 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6zm4 0v2m4-2v2';
      default:
        return 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'; // User icon
    }
  };

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type={'fixed' as RigidBodyProps['type']} />
        
        <RigidBody 
          position={initialHasAnimated ? [0, 3, 0] : [0.5, 0, 0]} 
          ref={j1} 
          {...segmentProps} 
          type={'dynamic' as RigidBodyProps['type']}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody 
          position={initialHasAnimated ? [0, 2, 0] : [1, 0, 0]} 
          ref={j2} 
          {...segmentProps} 
          type={'dynamic' as RigidBodyProps['type']}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody 
          position={initialHasAnimated ? [0, 1, 0] : [1.5, 0, 0]} 
          ref={j3} 
          {...segmentProps} 
          type={'dynamic' as RigidBodyProps['type']}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        
        <RigidBody
          position={initialHasAnimated ? [0, 0, 0] : [2, 0, 0]} 
          ref={card}
          {...segmentProps}
          type={dragged ? ('kinematicPosition' as RigidBodyProps['type']) : ('dynamic' as RigidBodyProps['type'])}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={3.75} /* 1.5x larger than 2.5 */
            position={[0, -1.8, -0.05]} /* Adjusted Y position for larger scale */
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => {
              e.target.releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e: any) => {
              e.target.setPointerCapture(e.pointerId);
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
          >
            {/* Card mesh with dynamic profile color */}
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                color={avatarColor || '#6366f1'}
                clearcoat={0.5}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
            
            {/* Premium UI Overlay */}
            <Html
              transform
              position={[0, 0.35, 0.02]}
              scale={0.1}
              style={{
                width: '180px',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <div className="flex flex-col items-center text-center select-none w-full h-[280px] justify-between py-6">
                
                {/* Header Branding */}
                <div className="w-full border-b border-white/20 pb-2 mb-2">
                  <p className="text-white/90 text-xs font-medium tracking-widest uppercase" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                    Membresía
                  </p>
                  <p className="text-white font-bold text-sm tracking-wide" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                    CineMatch
                  </p>
                </div>

                {/* Main Content */}
                <div className="flex flex-col items-center justify-center flex-1 w-full gap-2">
                   {/* Avatar with white icon and transparent bg (glassy look) */}
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center relative"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                     {/* Inner ring */}
                     <div className="absolute inset-1 rounded-full border border-white/30"></div>
                     
                     {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover p-1"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3">
                        <svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="drop-shadow-md"
                        >
                          <path d={getIconPath(avatarIcon)} />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="mt-2 w-full">
                     <p className="text-white font-black text-2xl truncate w-full px-2 tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      {displayName || 'Usuario'}
                    </p>
                  </div>
                </div>

                {/* Footer / Level */}
                <div className="w-full px-4">
                  <div 
                    className="bg-black/30 backdrop-blur-md rounded-full px-4 py-2 border flex items-center justify-between shadow-sm"
                    style={{ borderColor: avatarColor ? `${avatarColor}80` : 'rgba(255,255,255,0.2)' }}
                  >
                     <span className="text-white/70 text-[10px] uppercase font-bold tracking-wider">Nivel</span>
                     <span className="text-white font-bold text-sm text-shadow-sm">{level}</span>
                  </div>
                </div>

              </div>
            </Html>
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color={avatarColor || "white"} /* Tint texture with avatar color */
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-3, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}
