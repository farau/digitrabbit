"use client";
import * as THREE from "three";
import Image from "next/image";
import styles from "./Icon.module.css";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";

function RotatingModel({ mouse, clicked }) {
  const { scene } = useGLTF("/3d/head");
  const modelRef = useRef();
  const headRef = useRef();

  useEffect(() => {
    const head = scene.getObjectByName("Head"); // ← adapte le nom ici selon ton modèle
    if (head) {
      headRef.current = head;
    }
  }, [scene]);

  useFrame(() => {
    if (modelRef.current) {
      // Zoom effect (clic)
      const targetScale = clicked ? 1.8 : 1.5;
      const currentScale = modelRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.2;
      modelRef.current.scale.set(newScale, newScale, newScale);
    }

    if (headRef.current && mouse) {
      // Rotation du regard (x: haut/bas, y: gauche/droite)
      headRef.current.rotation.y = mouse.x * 0.5; // gauche/droite
      headRef.current.rotation.x = mouse.y * 0.3; // haut/bas
    }
  });

  return <primitive object={scene} ref={modelRef} />;
}

function FloatingHeadModel({ mouse, click }) {
  const headGltf = useGLTF("/3d/head");
  const cryGltf = useGLTF("/3d/cry");

  const modelRef = useRef();
  const headRef = useRef();

  const targetScale = useRef(1.5);
  const scaleRef = useRef(1.5);

  useEffect(() => {
    const head = headGltf.scene.getObjectByName("Head") || headGltf.scene;
    headRef.current = head;
  }, [headGltf]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (modelRef.current) {
      modelRef.current.position.y = Math.sin(t * 1.5) * 0.15;

      // Interpolation de la taille
      targetScale.current = click ? 1.8 : 1.5;
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale.current, 0.05);
      modelRef.current.scale.setScalar(scaleRef.current);
    }

    // Suivre la souris
    if (headRef.current && mouse) {
      const maxY = 0.5;
      const maxX = 0.3;

      headRef.current.rotation.y += ((mouse.x * maxY) - headRef.current.rotation.y) * 0.1;
      headRef.current.rotation.x += ((mouse.y * maxX) - headRef.current.rotation.x) * 0.1;

      headRef.current.rotation.y = THREE.MathUtils.clamp(headRef.current.rotation.y, -maxY, maxY);
      headRef.current.rotation.x = THREE.MathUtils.clamp(headRef.current.rotation.x, -maxX, maxX);
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={click ? cryGltf.scene : headGltf.scene} dispose={null} />
    </group>
  );
}



export default function Icon({ name, src, label, onClick, position, sound }) {
  const is3D = src === "/3d/head";
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [click, setClicked] = useState(false);
  const soundRef = useRef("crying");
    
  useEffect(() => {
    if (sound) {
      soundRef.current = new Audio(`/sounds/${sound}.mp3`);
    }
  }, [sound]);

  // Charger et préparer le son
  if (!soundRef.current) {  
    soundRef.current = new Audio("/sounds/crying.mp3");
  }

  const handlePointerMove = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
    const y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1;
    setMouse({ x, y });
  };

  const handlePointerDown = () => {
    setClicked(true);
    soundRef.current.currentTime = 0;
    soundRef.current.play();
    if (onClick) onClick();
  };

  const handlePointerUp = () => {
    setClicked(false);
    soundRef.current.pause();
  };

  const handleClick = () => {
    if (onClick) onClick();
  }

  return (
    <div
      className={`${styles.icon} ${styles.iconHiddenOnMobile}`}
      style={{
        left: position.x,
        top: position.y,
        width: 70,
        height: 90,
        textAlign: "center",
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      {is3D ? (
        <div
          className={styles.icon}
          onMouseMove={handlePointerMove}
          style={{ width: "150px", height: "200px", position: "relative", zIndex: 1 }}
        >
          <Canvas
            camera={{ position: [1, 0, 3] }}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}>
          <ambientLight />
            <directionalLight position={[2, 2, 2]} />
            
            <FloatingHeadModel click={click} />
          <OrbitControls enableZoom={false} autoRotate={false} />
        </Canvas>

        </div>
      ) : (
        <Image src={src} alt={name} width={50} height={50} />
      )}
      <p style={{ margin: 0, fontSize: 12 }}>{label}</p>
    </div>
  );
}
