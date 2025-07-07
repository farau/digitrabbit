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

export function FloatingHeadModel({ mouse, isClicked, themeMode, onPointerDown, onPointerUp }) {
  const headGltfLight = useGLTF("/3d/head");
  const cryGltf = useGLTF("/3d/cry");
  const headGltfDark = useGLTF("/3d/sleep");

  const headGltf = themeMode === "dark" ? headGltfDark : headGltfLight;

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
      targetScale.current = isClicked ? 1.8 : 1.5;
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale.current, 0.05);
      modelRef.current.scale.setScalar(scaleRef.current);
    }

    // La tête suit la souris
    if (headRef.current && mouse && typeof mouse.x === "number" && typeof mouse.y === "number") {
      const maxY = 0.5;
      const maxX = 0.3;

      headRef.current.rotation.y += ((mouse.x * maxY) - headRef.current.rotation.y) * 0.1;
      headRef.current.rotation.x += (((-mouse.y) * maxX) - headRef.current.rotation.x) * 0.1;

      headRef.current.rotation.y = THREE.MathUtils.clamp(headRef.current.rotation.y, -maxY, maxY);
      headRef.current.rotation.x = THREE.MathUtils.clamp(headRef.current.rotation.x, -maxX, maxX);
    }


  });

  return (
    <group ref={modelRef} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <primitive
        object={cryGltf.scene}
        visible={isClicked}
        dispose={null}
      />
      <primitive
        object={headGltf.scene}
        visible={!isClicked}
        dispose={null}
      />
    </group>
  );
}



export default function Icon({ name, src, label, onClick, position, sound, themeMode, show3DEffects }) {
  const is3D = src === "/3d/head";
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [click, setClicked] = useState(false);
  const soundRef = useRef("crying");

  useEffect(() => {
    if (sound) {
      soundRef.current = new Audio(`/sounds/${sound}.mp3`);
      soundRef.current.volume = 0.4; // volume réduit
    }
  }, [sound]);

  // Charger et préparer le son
  if (!soundRef.current) {
    soundRef.current = new Audio("/sounds/crying.mp3");
    soundRef.current.volume = 0.2; // volume réduit
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

  // Garantit que si on sort du canva le clic se désactive (même si le clic reste actif)
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setClicked(false);
      if (soundRef.current && typeof soundRef.current.pause === "function") {
        soundRef.current.pause();
      }
    };

    window.addEventListener("pointerup", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, []);


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
      {show3DEffects && is3D && (
        <div
          className={styles.icon}
          onMouseMove={handlePointerMove}
          style={{ width: "150px", height: "200px", position: "relative", zIndex: 1 }}
        >
          <Canvas
            onPointerMove={handlePointerMove}
            camera={{ position: [1, 0, 3] }}>
            <ambientLight />
            <directionalLight position={[2, 2, 2]} />
            <FloatingHeadModel mouse={mouse} isClicked={click} themeMode={themeMode} onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp} />
          </Canvas>

        </div>
      )
      }

      {!show3DEffects && !is3D && (
        <Image src={src} alt={name} width={50} height={50} />
      )}

      <p style={{ margin: 0, fontSize: 8 }}>{label}</p>
    </div>
  );
}
