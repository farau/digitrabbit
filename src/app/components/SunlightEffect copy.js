'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

export default function SunlightEffect() {
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
    container.appendChild(renderer.domElement)

    // SUN (visible in the main scene)
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfff9c4 })
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), sunMaterial)

    // Placer le soleil dans le coin supérieur droit de la scène en 3D
    const distanceFromCamera = 5; // Distance de la caméra
    sun.position.set(distanceFromCamera, distanceFromCamera, -5); // Ajuster la position en fonction de la caméra
    scene.add(sun)

    // LIGHT (visible normalement)
    const light = new THREE.PointLight(0xfff8c0, 2, 100)
    light.position.copy(sun.position)
    scene.add(light)

    // BLOOM COMPOSER
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

    // FINAL COMPOSER
    const finalComposer = new EffectComposer(renderer)
    finalComposer.addPass(renderScene)

    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture }
        },
        vertexShader: /* glsl */`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */`
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
            vec4 base = texture2D(baseTexture, vUv);
            vec4 bloom = texture2D(bloomTexture, vUv);
            gl_FragColor = base + bloom;
          }
        `
      }),
      'baseTexture'
    )
    finalPass.needsSwap = true
    finalComposer.addPass(finalPass)

    // Animate
    function animate() {
      requestAnimationFrame(animate)

      // Render the scene with the bloom effect
      scene.traverse(obj => {
        if (obj.isMesh) {
          obj.layers.set(1)
        }
      })
      bloomComposer.render()

      // Restore all to default layer
      scene.traverse(obj => {
        if (obj.isMesh) {
          obj.layers.set(0)
        }
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
