export type Role = 'viewer' | 'developer' | 'operator' | 'admin'

export type LabEnvStatus =
  | 'pending'
  | 'running'
  | 'expiring'
  | 'archiving'
  | 'archived'
  | 'failed'

export interface LabEnv {
  id: string
  driver: string
  owner: string
  image: string
  display_name?: string
  status: LabEnvStatus
  container_id?: string
  jupyter_url?: string
  token?: string
  gpus: number
  cpu_request?: string
  mem_request?: string
  hot_tier_path: string
  cold_tier_path: string
  archive_ref?: string
  created_at: string
  expires_at: string
  archived_at?: string
  last_error?: string
}

export interface LabStorage {
  hot_tier: string
  cold_tier: string
}

export interface LabEnvsResponse {
  envs: LabEnv[]
  storage: LabStorage
  drivers: string[]
  active: string
}

export interface Session {
  username: string
  role: Role
  expires_at: string
}

export interface ContainerInfo {
  name: string
  image: string
  role: string
  status: string
  current?: string
  previous?: string
}

export interface PortMapping {
  host: number
  container: number
  description?: string
}

export interface SuiteSummary {
  name: string
  installed: boolean
  state: string
  current?: string
  previous?: string
  ports: PortMapping[]
  containers: ContainerInfo[]
  gpu_required: boolean
  error?: string
  compose_exists: boolean
}

export interface EnvironmentPackageDiff {
  name: string
  baseline: string
  current: string
  tier: number | string
  reason: string
}

export interface EnvironmentDriftReport {
  group: string
  user?: string
  timestamp: string
  diffs: EnvironmentPackageDiff[]
  clean: boolean
}

export interface EnvironmentStatusResponse {
  available?: boolean
  message?: string
  running?: boolean
  last_scan?: string
  group_reports?: EnvironmentDriftReport[]
  snapshot_count?: number
  socket_path?: string
}

export interface EnvironmentDiffResponse {
  available?: boolean
  message?: string
  reports?: EnvironmentDriftReport[]
}

export interface FleetNodeInfo {
  available?: boolean
  message?: string
  hostname?: string
  machine_id?: string
  gradient_version?: string
  visibility?: string
  installed_suites?: string[]
  resolver_running?: boolean
  last_seen?: string
  address?: string
}

export interface FleetStatusResponse {
  available?: boolean
  message?: string
  count?: number
  peers?: FleetNodeInfo[]
}

export interface FleetPeersResponse {
  available?: boolean
  message?: string
  peers?: FleetNodeInfo[]
}

export interface TeamSummary {
  name?: string
  preset?: string
  users?: number | string | Array<unknown>
  user_count?: number
  cpu_quota?: string
  ram_quota?: string
  gpu?: string
  description?: string
  [key: string]: unknown
}

export interface TeamsResponse {
  available?: boolean
  message?: string
  teams?: TeamSummary[]
}

export interface SuitesResponse {
  suites: SuiteSummary[]
}

export interface JobSnapshot {
  id: string
  name: string
  status: string
  lines: string[]
  result?: Record<string, unknown>
  error?: string
  started_at: string
  completed_at?: string
}

export interface WorkspacePayload {
  root: string
  total: number
  free: number
  used: number
  usages: Record<string, number>
}

export interface CheckItem {
  name: string
  status: string
  detail: string
  recovery?: string
}

export interface CheckResponse {
  checks: CheckItem[]
}

export interface SystemService {
  name: string
  status: string
  user?: string
}

export interface SystemInfo {
  hostname: string
  uptime: string
  kernel: string
  os: string
  concave: string
  docker: string
  services: SystemService[]
}

export interface ActivityContainer {
  name: string
  suite: string
  status: string
  cpu_percent?: number
  memory_mib?: number
}

export interface UserActivity {
  username: string
  role: Role
  containers: ActivityContainer[]
  gpu_memory_mib: number
  last_active?: string
}

export interface UsersActivityResponse {
  users: UserActivity[]
}

export interface MetricsPayload {
  workspace: WorkspacePayload | { error: string }
  suites: SuiteSummary[]
  cpu: {
    overall?: number
    cores?: Array<{
      name: string
      utilization: number
    }>
    error?: string
  }
  gpu: {
    devices?: Array<{
      name: string
      utilization: number
      memory_used: number
      memory_total: number
    }>
    error?: string
  }
  memory: {
    used?: number
    total?: number
    swap_used?: number
    swap_total?: number
    error?: string
  }
  timestamp: string
}

export interface WebSettings {
  api_base_url: string
  bind_addr: string
  port: number
}
