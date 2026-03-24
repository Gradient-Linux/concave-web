# concave serve API

`concave-web` talks to the local `concave serve` API over same-origin requests. The upstream API is intended for local use on `127.0.0.1:7777`. Browser access goes through the `concave-web` proxy, but the endpoint shapes below are the `concave serve` contract.

## Conventions

- Base path: `/api/v1`
- Auth: session cookie from `POST /api/v1/auth/login`
- TUI token mode: send `X-Concave-Client: tui` on login or refresh to receive a JSON token
- Jobs: long-running mutations return `202 Accepted` with `{ "job_id": "..." }`
- Streaming:
  - Server-sent events: `/api/v1/metrics/stream`
  - WebSockets: logs and terminals

## Auth

### `POST /api/v1/auth/login`

- Minimum role: public
- Request body:

```json
{
  "username": "alice",
  "password": "secret"
}
```

- Response shape:

```json
{
  "username": "alice",
  "role": "operator",
  "expires_at": "2026-03-25T12:00:00Z"
}
```

- TUI response adds `token` when `X-Concave-Client: tui` is present.
- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"secret"}'
```

### `POST /api/v1/auth/logout`

- Minimum role: authenticated session
- Request body: none
- Response shape:

```json
{
  "status": "logged out"
}
```

- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/auth/logout --cookie "concave_session=..."
```

### `POST /api/v1/auth/refresh`

- Minimum role: authenticated session
- Request body: none
- Response shape: same as login, with a renewed expiry and optional `token` for TUI clients
- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/auth/refresh --cookie "concave_session=..."
```

### `GET /api/v1/auth/me`

- Minimum role: authenticated session
- Request body: none
- Response shape:

```json
{
  "username": "alice",
  "role": "viewer",
  "expires_at": "2026-03-25T12:00:00Z"
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/auth/me --cookie "concave_session=..."
```

## Health and jobs

### `GET /api/v1/health`

- Minimum role: public
- Request body: none
- Response shape:

```json
{
  "status": "ok",
  "version": "dev",
  "timestamp": "2026-03-25T12:00:00Z"
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/health
```

### `GET /api/v1/jobs/{id}`

- Minimum role: viewer
- Request body: none
- Response shape:

```json
{
  "id": "job-123",
  "name": "install:boosting",
  "status": "running",
  "lines": ["pulling python:3.12-slim"],
  "result": {},
  "started_at": "2026-03-25T12:00:00Z"
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/jobs/job-123 --cookie "concave_session=..."
```

### `GET /api/v1/metrics/stream`

- Minimum role: viewer
- Request body: none
- Response shape: SSE event named `metrics`
- Payload shape:

```json
{
  "workspace": {},
  "suites": [],
  "gpu": {},
  "cpu": {},
  "memory": {},
  "timestamp": "2026-03-25T12:00:00Z"
}
```

- Example:

```bash
curl -N http://127.0.0.1:7777/api/v1/metrics/stream --cookie "concave_session=..."
```

## Suites

### `GET /api/v1/suites`

- Minimum role: viewer
- Request body: none
- Response shape:

```json
{
  "suites": [
    {
      "name": "boosting",
      "installed": true,
      "state": "running",
      "current": "python:3.12-slim",
      "previous": "",
      "ports": [],
      "containers": [],
      "gpu_required": false,
      "compose_exists": true
    }
  ]
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/suites --cookie "concave_session=..."
```

### `GET /api/v1/suites/{suite}`

- Minimum role: viewer
- Request body: none
- Response shape: one `SuiteSummary`
- Example:

```bash
curl http://127.0.0.1:7777/api/v1/suites/boosting --cookie "concave_session=..."
```

### `GET /api/v1/suites/{suite}/changelog`

- Minimum role: viewer
- Request body: none
- Response shape:

```json
{
  "suite": "boosting",
  "changes": [
    {
      "container": "gradient-boost-core",
      "from": "python:3.12-slim",
      "to": "python:3.12-slim"
    }
  ]
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/suites/boosting/changelog --cookie "concave_session=..."
```

### `GET /api/v1/suites/{suite}/lab`

- Minimum role: developer
- Request body: none
- Response shape:

```json
{
  "url": "http://localhost:8888/lab?token=..."
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/suites/boosting/lab --cookie "concave_session=..."
```

### `POST /api/v1/suites/{suite}/install`

- Minimum role: operator
- Request body: empty object for standard suites
- Forge request body:

```json
{
  "forge_components": ["boosting-lab", "flow-grafana"]
}
```

- Response shape:

```json
{
  "job_id": "job-123"
}
```

- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/suites/boosting/install \
  -H 'Content-Type: application/json' \
  -d '{}' \
  --cookie "concave_session=..."
```

### `POST /api/v1/suites/{suite}/remove`

- Minimum role: operator
- Request body: empty object
- Response shape: `{ "job_id": "..." }`
- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/suites/boosting/remove \
  -H 'Content-Type: application/json' \
  -d '{}' \
  --cookie "concave_session=..."
```

### `POST /api/v1/suites/{suite}/start`

- Minimum role: operator
- Request body: empty object
- Response shape: `{ "job_id": "..." }`
- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/suites/boosting/start \
  -H 'Content-Type: application/json' \
  -d '{}' \
  --cookie "concave_session=..."
```

### `POST /api/v1/suites/{suite}/stop`

- Minimum role: operator
- Request body: empty object
- Response shape: `{ "job_id": "..." }`
- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/suites/boosting/stop \
  -H 'Content-Type: application/json' \
  -d '{}' \
  --cookie "concave_session=..."
```

### `POST /api/v1/suites/{suite}/update`

- Minimum role: operator
- Request body: empty object
- Response shape: `{ "job_id": "..." }`
- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/suites/boosting/update \
  -H 'Content-Type: application/json' \
  -d '{}' \
  --cookie "concave_session=..."
```

### `POST /api/v1/suites/{suite}/rollback`

- Minimum role: operator
- Request body: empty object
- Response shape: `{ "job_id": "..." }`
- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/suites/boosting/rollback \
  -H 'Content-Type: application/json' \
  -d '{}' \
  --cookie "concave_session=..."
```

### `GET /api/v1/suites/{suite}/logs?container={container}`

- Minimum role: viewer
- Transport: WebSocket
- Request body: none
- Event shape:

```json
{
  "type": "line",
  "line": "container log line"
}
```

- Example:

```text
ws://127.0.0.1:7777/api/v1/suites/boosting/logs?container=gradient-boost-lab
```

## Workspace

### `GET /api/v1/workspace`

- Minimum role: viewer
- Request body: none
- Response shape:

```json
{
  "root": "/home/alice/gradient",
  "total": 1000000000,
  "free": 700000000,
  "used": 300000000,
  "usages": {
    "notebooks": 1024
  }
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/workspace --cookie "concave_session=..."
```

### `POST /api/v1/workspace/backup`

- Minimum role: operator
- Request body: empty object
- Response shape: `{ "job_id": "..." }`
- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/workspace/backup \
  -H 'Content-Type: application/json' \
  -d '{}' \
  --cookie "concave_session=..."
```

### `POST /api/v1/workspace/prune`

- Minimum role: operator
- Request body: empty object
- Response shape: `{ "job_id": "..." }`
- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/workspace/prune \
  -H 'Content-Type: application/json' \
  -d '{}' \
  --cookie "concave_session=..."
```

### `POST /api/v1/workspace/clean`

- Minimum role: operator
- Request body: empty object
- Response shape: `{ "job_id": "..." }`
- Behavior: deprecated alias of `/api/v1/workspace/prune`
- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/workspace/clean \
  -H 'Content-Type: application/json' \
  -d '{}' \
  --cookie "concave_session=..."
```

## Doctor and check

### `GET /api/v1/check`

- Minimum role: viewer
- Request body: none
- Response shape:

```json
{
  "checks": [
    {
      "name": "Docker",
      "status": "pass",
      "detail": "running"
    }
  ]
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/check --cookie "concave_session=..."
```

### `GET /api/v1/doctor`

- Minimum role: viewer
- Request body: none
- Response shape: same as `/api/v1/check`
- Behavior: deprecated alias retained for compatibility
- Example:

```bash
curl http://127.0.0.1:7777/api/v1/doctor --cookie "concave_session=..."
```

## Environment

### `GET /api/v1/env/status`

- Minimum role: viewer
- Request body: none
- Response shape when available:

```json
{
  "running": true,
  "last_scan": "2026-03-25T12:00:00Z",
  "group_reports": [],
  "snapshot_count": 4,
  "socket_path": "/run/gradient/resolver.sock"
}
```

- Response shape when unavailable:

```json
{
  "available": false,
  "message": "resolver not configured"
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/env/status --cookie "concave_session=..."
```

### `GET /api/v1/env/diff`

- Minimum role: viewer
- Query string: optional `group`
- Request body: none
- Response shape:

```json
{
  "reports": [
    {
      "group": "research",
      "timestamp": "2026-03-25T12:00:00Z",
      "diffs": [],
      "clean": true
    }
  ]
}
```

- Example:

```bash
curl 'http://127.0.0.1:7777/api/v1/env/diff?group=research' --cookie "concave_session=..."
```

## Fleet

### `GET /api/v1/node/status`

- Minimum role: viewer
- Request body: none
- Response shape when available:

```json
{
  "hostname": "node-1",
  "machine_id": "abc123",
  "gradient_version": "dev",
  "visibility": "public",
  "installed_suites": ["boosting"],
  "resolver_running": false,
  "last_seen": "2026-03-25T12:00:00Z",
  "address": "192.168.1.10"
}
```

- Response shape when unavailable:

```json
{
  "available": false,
  "message": "mesh not configured"
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/node/status --cookie "concave_session=..."
```

### `GET /api/v1/fleet/status`

- Minimum role: viewer
- Request body: none
- Response shape:

```json
{
  "count": 1,
  "peers": []
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/fleet/status --cookie "concave_session=..."
```

### `GET /api/v1/fleet/peers`

- Minimum role: viewer
- Request body: none
- Response shape: same as `/api/v1/fleet/status`
- Example:

```bash
curl http://127.0.0.1:7777/api/v1/fleet/peers --cookie "concave_session=..."
```

## Teams

### `GET /api/v1/teams`

- Minimum role: viewer
- Request body: none
- Current response shape:

```json
{
  "available": false,
  "message": "team management is not yet implemented — available in Gradient Linux Maxima after concave-resolver and compute engine are configured",
  "teams": []
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/teams --cookie "concave_session=..."
```

## Users

### `GET /api/v1/system/users`

- Minimum role: admin
- Request body: none
- Response shape:

```json
{
  "users": [
    {
      "username": "alice",
      "role": "admin"
    }
  ]
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/system/users --cookie "concave_session=..."
```

### `GET /api/v1/users/activity`

- Minimum role: admin
- Request body: none
- Response shape:

```json
{
  "users": [
    {
      "username": "alice",
      "role": "admin",
      "containers": [],
      "gpu_memory_mib": 0,
      "last_active": "2026-03-25T12:00:00Z"
    }
  ]
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/users/activity --cookie "concave_session=..."
```

## System

### `GET /api/v1/system/info`

- Minimum role: viewer
- Request body: none
- Response shape:

```json
{
  "hostname": "node-1",
  "uptime": "2 hours 10 minutes",
  "kernel": "6.8.0-xx-generic",
  "os": "Ubuntu 24.04 LTS",
  "concave": "dev",
  "docker": "26.1.0",
  "services": [
    {
      "name": "concave-serve",
      "status": "active",
      "user": "gradient-svc"
    }
  ]
}
```

- Example:

```bash
curl http://127.0.0.1:7777/api/v1/system/info --cookie "concave_session=..."
```

### `POST /api/v1/system/reboot`

- Minimum role: admin
- Request body:

```json
{
  "confirm": true
}
```

- Response shape:

```json
{
  "status": "reboot initiated"
}
```

- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/system/reboot \
  -H 'Content-Type: application/json' \
  -d '{"confirm":true}' \
  --cookie "concave_session=..."
```

### `POST /api/v1/system/shutdown`

- Minimum role: admin
- Request body: `{ "confirm": true }`
- Response shape:

```json
{
  "status": "shutdown initiated"
}
```

- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/system/shutdown \
  -H 'Content-Type: application/json' \
  -d '{"confirm":true}' \
  --cookie "concave_session=..."
```

### `POST /api/v1/system/restart-docker`

- Minimum role: admin
- Request body: `{ "confirm": true }`
- Response shape:

```json
{
  "status": "restart-docker initiated"
}
```

- Example:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/system/restart-docker \
  -H 'Content-Type: application/json' \
  -d '{"confirm":true}' \
  --cookie "concave_session=..."
```

### `GET /api/v1/terminal/host`

- Minimum role: admin
- Transport: WebSocket
- Request body: none
- Event shape:

```json
{
  "type": "data",
  "data": "shell output"
}
```

- Example:

```text
ws://127.0.0.1:7777/api/v1/terminal/host
```

## Terminals

### `GET /api/v1/terminal/container/{suite}/{container}`

- Minimum role: developer
- Transport: WebSocket
- Request body: none
- Event shape:

```json
{
  "type": "data",
  "data": "shell output"
}
```

- Example:

```text
ws://127.0.0.1:7777/api/v1/terminal/container/boosting/gradient-boost-core
```
