"use client";
import * as THREE from "three";
import Image from "next/image";
import styles from "./Icon.module.css";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import { useTheme } from "@/context";

function RotatingHeadModel({ themeMode, isClicked, onPointerDown, onPointerUp }) {
  const headGltfLight = useGLTF("/3d/head");
  const cryGltf = useGLTF("/3d/cry");
  const headGltfDark = useGLTF("/3d/sleep");

  const headGltf = themeMode === "dark" ? headGltfDark : headGltfLight;

  const modelRef = useRef();
  const targetScale = useRef(1.5);
  const scaleRef = useRef(1.5);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (modelRef.current) {
      // Flottement vertical
      modelRef.current.position.y = Math.sin(t * 1.5) * 0.15;

      // Rotation automatique autour de l'axe Y (vitesse moyenne)
      modelRef.current.rotation.y = t * 0.5;

      // Interpolation de la taille
      targetScale.current = isClicked ? 1.8 : 1.5;
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale.current, 0.05);
      modelRef.current.scale.setScalar(scaleRef.current);
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



export default function Icon({ name, src, label, onClick, position, sound, show3DEffects, volume }) {
  const is3D = src === "/3d/head";
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [click, setClicked] = useState(false);
  const soundRef = useRef(null);
  const { themeMode } = useTheme();

  // Fonction helper pour définir le volume de manière sécurisée
  const setVolumeSafely = (audioElement, vol) => {
    if (audioElement && typeof vol === 'number' && !isNaN(vol) && isFinite(vol)) {
      audioElement.volume = Math.max(0, Math.min(1, vol)); // Clamp entre 0 et 1
    }
  };

  // useEffect pour créer/charger le son quand le son change
  useEffect(() => {
    if (sound) {
      soundRef.current = new Audio(`/sounds/${sound}.mp3`);
      setVolumeSafely(soundRef.current, volume);
    }
  }, [sound, volume]);

  // useEffect séparé pour mettre à jour le volume
  useEffect(() => {
    if (soundRef.current && soundRef.current instanceof Audio) {
      setVolumeSafely(soundRef.current, volume);
    }
  }, [volume]);

  // Initialisation par défaut si pas de son défini
  useEffect(() => {
    if (!soundRef.current) {
      soundRef.current = new Audio("/sounds/crying.mp3");
      setVolumeSafely(soundRef.current, volume);
    }
  }, [volume]);

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
  };

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
      data-app={name}
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
            <FloatingHeadModel
              themeMode={themeMode}
              isClicked={click}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
            />
          </Canvas>
        </div>
      )}

      {!show3DEffects && !is3D && (
        /* Sticker wrapper — contour blanc autour de l'icône + label */
        <div style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          /* Contour blanc arrondi façon sticker */
          filter: `
          drop-shadow( 1px  0px 0 white)
          drop-shadow(-1px  0px 0 white)
          drop-shadow( 0px  1px 0 white)
          drop-shadow( 0px -1px 0 white)
          drop-shadow(0 0 4px rgba(255,255,255,0.6))
        `,
        }}>
          {/* Image de l'icône — sans fond */}
          <Image src={src} alt={name} width={name !== "Quests" ? 50 : 40} height={name !== "Quests" ? 50 : 40} />

          { /*Label style sticker — fond blanc, texte noir, même effet*/}
          <div style={{
            marginTop: "3px",
            background: "white",
            borderRadius: "6px",
            padding: "1px 6px",
            display: "inline-block",
          }}>
            <p style={{
              margin: 0,
              fontSize: 9,
              fontWeight: "700",
              color: "black",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}>
              {label}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
