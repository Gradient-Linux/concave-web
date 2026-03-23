# concave-web

`concave-web` is the browser control plane for Gradient Linux. It serves an
embedded Vue frontend, proxies authenticated API traffic to `concave serve`, and
keeps its own local browser-shell configuration in `~/.config/concave-web/config.toml`.

## Responsibilities

This repository owns:

- the `concave-web` Go wrapper process
- the embedded Vue 3 frontend
- same-origin proxying of `/api/v1/*` to `concave serve`
- browser login/session bootstrap
- role-aware navigation and action visibility
- browser terminals for containers and the admin host shell

This repository does not own:

- PAM or Unix-group auth
- Docker lifecycle logic
- suite install semantics
- machine control rules

Those remain in `concave`.

## Architecture

The runtime shape is:

```text
browser -> concave-web -> concave serve
```

`concave-web` keeps the browser same-origin against its own address and forwards:

- cookies
- normal API requests
- streaming responses
- WebSocket terminal upgrades

## Features

- login and session bootstrap against `concave serve`
- dashboard, suites, logs, workspace, doctor, and settings pages
- admin-only users and system pages
- terminal access to containers and the host through WebSocket-backed xterm surfaces
- dark and light appearance modes
- collapsible icon-first sidebar navigation
- live dashboard telemetry for CPU, per-core CPU, RAM, GPU, VRAM, workspace, and suite state
- single-binary delivery once the frontend is built and embedded

## Local config

Path:

- `~/.config/concave-web/config.toml`

Default values:

```toml
api_base_url = "http://127.0.0.1:7777"
bind_addr = "127.0.0.1"
port = 8080
```

## Development

Frontend:

```bash
cd frontend
npm ci
npm run build
```

Go wrapper:

```bash
go test ./...
go build ./...
go run . serve
```

The default upstream API is `http://127.0.0.1:7777`.

## Documentation

Start with [docs/README.md](docs/README.md).

Important docs:

- [docs/architecture.md](docs/architecture.md)
- [docs/deployment.md](docs/deployment.md)
- [docs/frontend.md](docs/frontend.md)

## Contributing

Contributor rules live in [CONTRIBUTING.md](CONTRIBUTING.md). If you change the
proxy surface, route model, or UI behavior, update docs in the same change.
