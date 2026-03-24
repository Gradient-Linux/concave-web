<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'

const canvasContainer = ref<HTMLDivElement | null>(null)

let animationFrameId = 0
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null

function onWindowResize() {
  if (!renderer || !camera) {
    return
  }
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

onMounted(() => {
  if (!canvasContainer.value) {
    return
  }

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(6, 7, 10)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearAlpha(0)
  canvasContainer.value.appendChild(renderer.domElement)

  const geometry = new THREE.PlaneGeometry(12, 12, 100, 100)
  geometry.rotateX(-Math.PI / 2)

  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const y = (x * x + z * z) * 0.12
    positions.setY(i, y)
  }
  geometry.computeVertexNormals()

  const vertexShader = `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    varying vec3 vPosition;
    void main() {
      float t = smoothstep(0.0, 4.0, vPosition.y);

      vec3 colorYellow = vec3(0.972, 0.784, 0.259);
      vec3 colorPink   = vec3(0.878, 0.251, 0.627);
      vec3 colorPurple = vec3(0.357, 0.0, 0.627);
      vec3 colorDark   = vec3(0.051, 0.031, 0.078);

      vec3 color = mix(colorYellow, colorPink, smoothstep(0.0, 0.33, t));
      color = mix(color, colorPurple, smoothstep(0.33, 0.66, t));
      color = mix(color, colorDark, smoothstep(0.66, 1.0, t));

      gl_FragColor = vec4(color, 0.86);
    }
  `

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  })

  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  const animate = () => {
    animationFrameId = window.requestAnimationFrame(animate)
    if (mesh && renderer && scene && camera) {
      mesh.rotation.y -= 0.0024
      renderer.render(scene, camera)
    }
  }

  animate()
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', onWindowResize)

  if (mesh) {
    mesh.geometry.dispose()
    mesh.material.dispose()
  }
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }

  mesh = null
  renderer = null
  scene = null
  camera = null
})
</script>

<template>
  <div ref="canvasContainer" class="gradient-bg"></div>
</template>
