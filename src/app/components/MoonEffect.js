'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

export default function MoonEffect() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    camera.position.z = 5
    camera.layers.enable(1) // enable bloom layer

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // Lune avec shader custom pour découpe croissant
    const geometry = new THREE.SphereGeometry(0.25, 36, 36) // Lune plus grosse

    const material = new THREE.ShaderMaterial({
      uniforms: {
        crescentCut: { value: 0.15 }, // Découpe un peu plus à droite, pour un croissant plus visible
        moonColor: { value: new THREE.Color(0xf0f0f5) },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float crescentCut;
        uniform vec3 moonColor;
        varying vec3 vPosition;

        void main() {
          // On crée un croissant en "découpant" une partie de la sphère sur l'axe x
          // Découpe verticale : masque les fragments dont x < crescentCut
          if (vPosition.x < crescentCut) discard;

          gl_FragColor = vec4(moonColor, 1.0);
        }
      `,
      transparent: true,
    })

    const moon = new THREE.Mesh(geometry, material)

    // Position initiale, sera mise à jour dans animate()
    const initialMoonOffset = new THREE.Vector3(2.5, 2.5, -5)

    scene.add(moon)

    // Lumière douce de la lune
    const light = new THREE.PointLight(0xf0f0f5, 0.12, 10)
    scene.add(light)

    // Bloom composer
    const bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false
    const renderScene = new RenderPass(scene, camera)
    bloomComposer.addPass(renderScene)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    )
    bloomComposer.addPass(bloomPass)

    // Final composer
    const finalComposer = new EffectComposer(renderer)
    finalComposer.addPass(renderScene)

    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
            vec4 base = texture2D(baseTexture, vUv);
            vec4 bloom = texture2D(bloomTexture, vUv);
            gl_FragColor = base + bloom;
          }
        `,
      }),
      'baseTexture'
    )
    finalPass.needsSwap = true
    finalComposer.addPass(finalPass)

    let time = 0

    function animate() {
      requestAnimationFrame(animate)

      time += 0.01

      // Scintillement subtil
      const flicker = 1 + 0.01 * Math.sin(time * 5 + Math.random() * 0.5)
      moon.scale.set(flicker, flicker, flicker)

      // Lumière plus douce, variation faible
      light.intensity = 0.12 + 0.005 * Math.sin(time * 3 + Math.random() * 0.5)

      // Met à jour la position de la lune en fonction de la position et rotation de la caméra
      moon.position.copy(camera.position).add(initialMoonOffset.clone().applyQuaternion(camera.quaternion))
      light.position.copy(moon.position)

      // Bloom sur layer 1
      scene.traverse(obj => {
        if (obj.isMesh) obj.layers.set(1)
      })
      bloomComposer.render()

      // Rendu final sur layer 0
      scene.traverse(obj => {
        if (obj.isMesh) obj.layers.set(0)
      })
      finalComposer.render()
    }

    animate()

    // Resize
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      bloomComposer.setSize(window.innerWidth, window.innerHeight)
      finalComposer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        mixBlendMode: 'screen',
      }}
    />
  )
}
