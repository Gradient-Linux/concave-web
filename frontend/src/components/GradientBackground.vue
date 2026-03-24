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
  camera.position.set(7.2, 8.2, 12.4)
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
      float t = clamp(vPosition.y / 8.64, 0.0, 1.0);

      vec3 c1 = vec3(1.0, 0.945, 0.463);
      vec3 c2 = vec3(1.0, 0.843, 0.251);
      vec3 c3 = vec3(1.0, 0.431, 0.780);
      vec3 c4 = vec3(0.671, 0.278, 0.737);
      vec3 c5 = vec3(0.290, 0.078, 0.549);
      vec3 c6 = vec3(0.102, 0.0, 0.188);

      vec3 color;

      if (t < 0.2) {
        color = mix(c1, c2, t / 0.2);
      } else if (t < 0.4) {
        color = mix(c2, c3, (t - 0.2) / 0.2);
      } else if (t < 0.6) {
        color = mix(c3, c4, (t - 0.4) / 0.2);
      } else if (t < 0.8) {
        color = mix(c4, c5, (t - 0.6) / 0.2);
      } else {
        color = mix(c5, c6, (t - 0.8) / 0.2);
      }

      gl_FragColor = vec4(color, 0.92);
    }
  `

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  })

  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = -1
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
