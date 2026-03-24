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

const canvasContainer = ref<HTMLDivElement | null>(null)

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
let pointerHandler: (() => void) | null = null
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
  pointerHandler = () => triggerThought()
  window.addEventListener('resize', resizeHandler)
  canvasContainer.value?.addEventListener('pointerdown', pointerHandler)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(animationFrameId)

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
  if (pointerHandler) {
    canvasContainer.value?.removeEventListener('pointerdown', pointerHandler)
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
  <div ref="canvasContainer" class="neural-bg" aria-hidden="true"></div>
</template>
