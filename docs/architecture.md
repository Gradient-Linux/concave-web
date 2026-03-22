# concave-web architecture

`concave-web` is a browser control plane, not a second backend. The repository is
split into two layers:

- a small Go wrapper server
- an embedded Vue single-page application

## Responsibilities

This repository owns:

- serving the built frontend from a single Go binary
- proxying `/api/v1/*` to `concave serve`
- preserving cookies, SSE, and WebSocket behavior across the proxy boundary
- rendering the browser UI for login, suites, logs, workspace, doctor, users, system, and settings

This repository does not own:

- PAM authentication logic
- Unix group resolution
- machine lifecycle enforcement
- Docker orchestration logic

Those live in `concave`.

## Request flow

```text
browser
  -> concave-web
      -> embedded Vue app for document routes
      -> reverse proxy for /api/v1/*
          -> concave serve
```

Key properties:

- browser sessions remain same-origin through the Go proxy
- the browser trusts cookie-backed auth from `concave serve`
- terminal sessions use WebSocket upgrade pass-through
- route guards in the frontend are based on role metadata returned by the API

## Repository layout

- `main.go`: process entrypoint and embedded file serving
- `http.go`: SPA fallback and settings endpoint
- `internal/config/`: local proxy config at `~/.config/concave-web/config.toml`
- `internal/proxy/`: reverse proxy setup for API, cookies, SSE, and WebSockets
- `frontend/src/router/`: role-aware route declarations and guards
- `frontend/src/stores/`: Pinia auth bootstrap and shared store state
- `frontend/src/components/terminal/`: xterm-based browser terminal surface
- `frontend/src/views/`: page-level route components

## Frontend architecture

The frontend is a Vue 3 + TypeScript + Vite app using:

- Vue Router for role-aware navigation
- Pinia for auth/bootstrap state
- xterm plus fit addon for browser terminals

The root app chooses between:

- a public login route
- an authenticated shell wrapped in the shared layout component

## Role-aware navigation

The route layer applies a minimum role to each protected page:

- viewer: dashboard, suites, logs, workspace, doctor, settings
- admin: users, system

The frontend does not invent its own security model. It consumes the role returned
by the authenticated backend and only uses that data to hide or block UI paths.

## Terminal surfaces

Two terminal experiences are present in the browser UI:

- container terminal surfaces for suite and logs workflows
- admin-only host terminal from the system page

All terminal transport uses WebSockets proxied through `concave-web` to
`concave serve`.
