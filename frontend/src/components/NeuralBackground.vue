<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type NeuralNode = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  position: THREE.Vector3
  connections: NeuralNode[]
  flashTimer: number
}

type Signal = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  start: NeuralNode
  end: NeuralNode
  progress: number
  speed: number
}

type FallbackNode = {
  id: string
  x: number
  y: number
  size: number
  color: string
}

type FallbackEdge = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

type Burst = {
  id: number
  x: number
  y: number
}

const canvasContainer = ref<HTMLDivElement | null>(null)
const bursts = ref<Burst[]>([])
let burstID = 0

const fallbackNodes: FallbackNode[] = [
  { id: 'n1', x: 14, y: 28, size: 10, color: 'var(--color-gold)' },
  { id: 'n2', x: 20, y: 54, size: 12, color: 'var(--color-mid)' },
  { id: 'n3', x: 28, y: 36, size: 8, color: 'var(--color-deep)' },
  { id: 'n4', x: 34, y: 62, size: 11, color: 'var(--color-mid)' },
  { id: 'n5', x: 44, y: 22, size: 12, color: 'var(--color-gold)' },
  { id: 'n6', x: 48, y: 48, size: 9, color: 'var(--color-mid)' },
  { id: 'n7', x: 56, y: 34, size: 10, color: 'var(--color-deep)' },
  { id: 'n8', x: 62, y: 58, size: 13, color: 'var(--color-mid)' },
  { id: 'n9', x: 70, y: 24, size: 9, color: 'var(--color-gold)' },
  { id: 'n10', x: 76, y: 46, size: 12, color: 'var(--color-mid)' },
  { id: 'n11', x: 82, y: 68, size: 10, color: 'var(--color-deep)' },
  { id: 'n12', x: 88, y: 36, size: 8, color: 'var(--color-gold)' },
]

const fallbackEdges: FallbackEdge[] = [
  { id: 'e1', x1: 14, y1: 28, x2: 28, y2: 36 },
  { id: 'e2', x1: 20, y1: 54, x2: 34, y2: 62 },
  { id: 'e3', x1: 28, y1: 36, x2: 44, y2: 22 },
  { id: 'e4', x1: 34, y1: 62, x2: 48, y2: 48 },
  { id: 'e5', x1: 44, y1: 22, x2: 56, y2: 34 },
  { id: 'e6', x1: 48, y1: 48, x2: 62, y2: 58 },
  { id: 'e7', x1: 56, y1: 34, x2: 70, y2: 24 },
  { id: 'e8', x1: 62, y1: 58, x2: 76, y2: 46 },
  { id: 'e9', x1: 70, y1: 24, x2: 88, y2: 36 },
  { id: 'e10', x1: 76, y1: 46, x2: 82, y2: 68 },
  { id: 'e11', x1: 20, y1: 54, x2: 48, y2: 48 },
  { id: 'e12', x1: 56, y1: 34, x2: 76, y2: 46 },
]

const COLORS = {
  yellow: new THREE.Color('#FFF176'),
  amber: new THREE.Color('#FFD740'),
  pink: new THREE.Color('#FF6EC7'),
  purple: new THREE.Color('#AB47BC'),
  deepPurple: new THREE.Color('#4A148C'),
  dark: new THREE.Color('#1A0030'),
  bg: new THREE.Color('#08000F'),
}

const activityLevel = 15
const nodes: NeuralNode[] = []
const signals: Signal[] = []
const clock = new THREE.Clock()

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let animationFrameId = 0
let lineSegments: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial> | null = null
let resizeHandler: (() => void) | null = null
let enabled = true

function initScene() {
  if (!canvasContainer.value) {
    return
  }

  const probe = document.createElement('canvas')
  const hasWebGL =
    !!probe.getContext('webgl2') ||
    !!probe.getContext('webgl') ||
    !!probe.getContext('experimental-webgl')
  if (!hasWebGL) {
    enabled = false
    return
  }

  try {
    scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(COLORS.bg, 0.023)

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 0, 39)

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearAlpha(0)
    canvasContainer.value.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.4
  } catch (error) {
    enabled = false
    scene = null
    camera = null
    renderer = null
    controls = null
    if (import.meta.env.DEV) {
      console.warn('NeuralBackground disabled:', error)
    }
  }
}

function buildNetwork() {
  if (!enabled || !scene) {
    return
  }

  const nodeCount = 150
  const radius = 18
  const nodeGeometry = new THREE.SphereGeometry(0.4, 16, 16)
  const linePoints: THREE.Vector3[] = []

  for (let index = 0; index < nodeCount; index += 1) {
    const u = Math.random()
    const v = Math.random()
    const theta = u * 2 * Math.PI
    const phi = Math.acos(2 * v - 1)
    const r = Math.cbrt(Math.random()) * radius

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)

    const material = new THREE.MeshBasicMaterial({
      color: COLORS.dark,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
    })

    const mesh = new THREE.Mesh(nodeGeometry, material)
    mesh.position.set(x, y, z)
    scene.add(mesh)

    nodes.push({
      mesh,
      position: mesh.position,
      connections: [],
      flashTimer: 0,
    })
  }

  for (const node of nodes) {
    const distances = nodes
      .map((other) => ({ node: other, distance: node.position.distanceTo(other.position) }))
      .filter((item) => item.distance > 0)
      .sort((left, right) => left.distance - right.distance)

    const connectionCount = Math.floor(Math.random() * 2) + 3
    for (let index = 0; index < connectionCount; index += 1) {
      const target = distances[index]?.node
      if (!target || node.connections.includes(target)) {
        continue
      }
      node.connections.push(target)
      linePoints.push(node.position.clone(), target.position.clone())
    }
  }

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints)
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x2d0050,
    transparent: true,
    opacity: 0.34,
  })
  lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial)
  scene.add(lineSegments)
}

function spawnSignal(startNode: NeuralNode) {
  if (!enabled || !scene || startNode.connections.length === 0) {
    return
  }

  const endNode = startNode.connections[Math.floor(Math.random() * startNode.connections.length)]
  const geometry = new THREE.SphereGeometry(0.25, 8, 8)
  const material = new THREE.MeshBasicMaterial({ color: COLORS.yellow })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(startNode.position)
  scene.add(mesh)

  signals.push({
    mesh,
    start: startNode,
    end: endNode,
    progress: 0,
    speed: 1.5 + Math.random() * 1.5,
  })
}

function triggerThought() {
  const centerNodes = [...nodes]
    .sort((left, right) => left.position.length() - right.position.length())
    .slice(0, 5)

  for (const node of centerNodes) {
    node.flashTimer = 1
    for (let index = 0; index < 3; index += 1) {
      spawnSignal(node)
    }
  }
}

function triggerBurst(x: number, y: number) {
  const id = burstID
  burstID += 1
  bursts.value = [...bursts.value, { id, x, y }]
  window.setTimeout(() => {
    bursts.value = bursts.value.filter((burst) => burst.id !== id)
  }, 1200)
}

function handlePointerDown(event: PointerEvent) {
  triggerThought()
  triggerBurst(event.clientX, event.clientY)
}

function animate() {
  if (!enabled) {
    return
  }
  animationFrameId = window.requestAnimationFrame(animate)
  const delta = clock.getDelta()

  controls?.update()

  const fireChance = (activityLevel / 100) * 0.1
  if (Math.random() < fireChance && nodes.length > 0) {
    spawnSignal(nodes[Math.floor(Math.random() * nodes.length)])
  }

  for (const node of nodes) {
    if (node.flashTimer > 0) {
      node.flashTimer = Math.max(0, node.flashTimer - delta * 0.8)
      node.mesh.material.color.copy(COLORS.dark).lerp(COLORS.pink, node.flashTimer)
      node.mesh.scale.setScalar(1 + node.flashTimer * 0.5)
    } else {
      node.mesh.material.color.copy(COLORS.dark)
      node.mesh.scale.setScalar(1)
    }
  }

  for (let index = signals.length - 1; index >= 0; index -= 1) {
    const signal = signals[index]
    signal.progress += signal.speed * delta

    if (signal.progress >= 1) {
      scene?.remove(signal.mesh)
      signal.mesh.geometry.dispose()
      signal.mesh.material.dispose()
      signals.splice(index, 1)
      signal.end.flashTimer = 1
      if (Math.random() < 0.6) {
        spawnSignal(signal.end)
      }
      continue
    }

    signal.mesh.position.copy(signal.start.position).lerp(signal.end.position, signal.progress)
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

function handleResize() {
  if (!renderer || !camera) {
    return
  }
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

onMounted(() => {
  initScene()
  if (!enabled) {
    return
  }
  buildNetwork()
  animate()

  resizeHandler = () => handleResize()
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(animationFrameId)

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }

  for (const signal of signals) {
    scene?.remove(signal.mesh)
    signal.mesh.geometry.dispose()
    signal.mesh.material.dispose()
  }

  for (const node of nodes) {
    scene?.remove(node.mesh)
    node.mesh.geometry.dispose()
    node.mesh.material.dispose()
  }
  nodes.splice(0, nodes.length)
  signals.splice(0, signals.length)

  if (lineSegments) {
    scene?.remove(lineSegments)
    lineSegments.geometry.dispose()
    lineSegments.material.dispose()
  }

  controls?.dispose()

  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }

  lineSegments = null
  controls = null
  renderer = null
  camera = null
  scene = null
})
</script>

<template>
  <div ref="canvasContainer" class="neural-bg" aria-hidden="true" @pointerdown="handlePointerDown">
    <div class="neural-bg__fallback">
      <svg class="neural-bg__wires" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line
          v-for="edge in fallbackEdges"
          :key="edge.id"
          :x1="edge.x1"
          :y1="edge.y1"
          :x2="edge.x2"
          :y2="edge.y2"
        />
      </svg>
      <span
        v-for="node in fallbackNodes"
        :key="node.id"
        class="neural-bg__node"
        :style="{
          left: `${node.x}%`,
          top: `${node.y}%`,
          width: `${node.size}px`,
          height: `${node.size}px`,
          '--node-color': node.color,
        }"
      />
      <span
        v-for="burst in bursts"
        :key="burst.id"
        class="neural-bg__burst"
        :style="{
          left: `${burst.x}px`,
          top: `${burst.y}px`,
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.neural-bg__fallback {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.neural-bg__fallback::before,
.neural-bg__fallback::after {
  content: '';
  position: absolute;
  inset: -12%;
  pointer-events: none;
}

.neural-bg__fallback::before {
  background:
    radial-gradient(circle at 18% 30%, rgba(245, 200, 66, 0.18), transparent 18%),
    radial-gradient(circle at 38% 70%, rgba(214, 60, 160, 0.18), transparent 20%),
    radial-gradient(circle at 66% 32%, rgba(91, 0, 160, 0.22), transparent 24%),
    radial-gradient(circle at 84% 62%, rgba(214, 60, 160, 0.16), transparent 18%);
  filter: blur(24px);
  opacity: 0.95;
}

.neural-bg__fallback::after {
  background: radial-gradient(circle at 50% 50%, rgba(12, 8, 24, 0), rgba(12, 8, 24, 0.52) 78%);
}

.neural-bg__wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.52;
}

.neural-bg__wires line {
  stroke: rgba(214, 60, 160, 0.22);
  stroke-width: 0.18;
}

.neural-bg__node {
  position: absolute;
  display: block;
  margin-left: calc(var(--node-size, 0px) / -2);
  margin-top: calc(var(--node-size, 0px) / -2);
  border-radius: 999px;
  background: var(--node-color);
  box-shadow: 0 0 18px color-mix(in srgb, var(--node-color) 64%, transparent);
  transform: translate(-50%, -50%);
  opacity: 0.8;
  animation: neuralPulse 4.6s ease-in-out infinite;
}

.neural-bg__burst {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(245, 200, 66, 0.6);
  box-shadow:
    0 0 0 1px rgba(245, 200, 66, 0.22),
    0 0 28px rgba(245, 200, 66, 0.28);
  animation: neuralBurst 1.2s ease-out forwards;
}

@keyframes neuralPulse {
  0%,
  100% {
    opacity: 0.42;
    transform: translate(-50%, -50%) scale(0.92);
  }
  50% {
    opacity: 0.92;
    transform: translate(-50%, -50%) scale(1.16);
  }
}

@keyframes neuralBurst {
  0% {
    opacity: 0.95;
    transform: translate(-50%, -50%) scale(0.25);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(10);
  }
}
</style>
