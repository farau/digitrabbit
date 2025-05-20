'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

export default function BackgroundEffect({ mode = 'sun' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = '' // Reset

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 5
    camera.layers.enable(1)

    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    let object, light, initialMoonOffset

    if (mode === 'sun') {
      const material = new THREE.MeshBasicMaterial({ color: 0xfff6b0 })
      object = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), material)
      object.position.set(5, 5, -5)
        scene.add(object)
        
      light = new THREE.PointLight(0xffa500, 0.1, 10)
      light.position.copy(object.position)
      scene.add(light)
        
    } else {
      const geometry = new THREE.SphereGeometry(0.25, 36, 36)
      const material = new THREE.ShaderMaterial({
        uniforms: {
          crescentCut: { value: 0.15 },
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
            if (vPosition.x < crescentCut) discard;
            gl_FragColor = vec4(moonColor, 1.0);
          }
        `,
        transparent: true,
      })

      object = new THREE.Mesh(geometry, material)
      
      // Position initiale, sera mise à jour dans animate()
      initialMoonOffset = new THREE.Vector3(2.5, 2.5, -5)
        
      scene.add(object)
        
      light = new THREE.PointLight(0xf0f0f5, 0.12, 10)
      scene.add(light)
    }

    // BLOOM composer
    const bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false
    const renderScene = new RenderPass(scene, camera)
    bloomComposer.addPass(renderScene)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, 0.4, 0.85
    )
    bloomComposer.addPass(bloomPass)

    // FINAL composer
    const finalComposer = new EffectComposer(renderer)
    finalComposer.addPass(renderScene)
    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv; void main() { vec4 base = texture2D(baseTexture, vUv); vec4 bloom = texture2D(bloomTexture, vUv); gl_FragColor = base + bloom; }`,
      }),
      'baseTexture'
    )
    finalPass.needsSwap = true
    finalComposer.addPass(finalPass)

    let animationId
    let time = 0
    const moonOffset = new THREE.Vector3(2.5, 2.5, -5)

    function animate() {
      animationId = requestAnimationFrame(animate)
      time += 0.01

      if (mode === 'sun') {
        const flicker = 1 + 0.05 * Math.sin(time * 10 + Math.random())
        object.scale.set(flicker, flicker, flicker)
        light.intensity = 2 + 0.3 * Math.sin(time * 8 + Math.random())
      } else {
        // Scintillement subtil
        const flicker = 1 + 0.01 * Math.sin(time * 5 + Math.random() * 0.5)
        object.scale.set(flicker, flicker, flicker)
        
        // Lumière plus douce, variation faible
        light.intensity = 0.12 + 0.005 * Math.sin(time * 3 + Math.random() * 0.5)
          
        // Met à jour la position de la lune en fonction de la position et rotation de la caméra
        object.position.copy(camera.position).add(initialMoonOffset.clone().applyQuaternion(camera.quaternion))
        light.position.copy(object.position)
      }

      // Bloom render (only layer 1)
      scene.traverse(obj => obj.isMesh && obj.layers.set(1))
      bloomComposer.render()

      // Scene render (only base layer)
      scene.traverse(obj => obj.isMesh && obj.layers.set(0))
      finalComposer.render()
    }

    animate()

    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      bloomComposer.setSize(window.innerWidth, window.innerHeight)
      finalComposer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      container.removeChild(renderer.domElement)

      renderer.dispose()
      bloomComposer.dispose()
      finalComposer.dispose()

      object.geometry.dispose()
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose())
      } else {
        object.material.dispose()
      }
    }
  }, [mode])

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
