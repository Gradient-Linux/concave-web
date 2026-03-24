# concave-web

Browser control surface for Gradient Linux, served as a local Go binary with an embedded Vue frontend.

## What it does

`concave-web` exposes the same local control plane that powers the terminal UI in a browser. It serves the compiled frontend, proxies `/api/v1/*` calls to `concave serve`, keeps browser sessions same-origin, and provides route-level views for suites, logs, workspace, environment drift, fleet state, users, and machine controls.

## Requirements

- Ubuntu 24.04 LTS
- `concave serve` running on `127.0.0.1:7777`
- Modern browser with WebSocket support

## Install

`concave-web` ships with the Gradient Linux distribution and can also be built from source. The local web shell starts with:

```bash
concave-web serve
```

The default address is:

```text
http://127.0.0.1:8080
```

## Usage

Start the browser shell and open it locally:

```bash
concave serve --addr 127.0.0.1:7777
concave-web serve
```

Then open `http://127.0.0.1:8080` in your browser and sign in with a local Gradient Linux account.

## Configuration

`concave-web` reads its local proxy settings from:

```text
~/.config/concave-web/config.toml
```

Current fields:

- `api_base_url`
- `bind_addr`
- `port`

Theme mode and sidebar collapse state are browser-local preferences stored in `localStorage`.

## Architecture

`concave-web` is a thin wrapper around the existing control plane. A Go binary embeds the built Vue 3 frontend, serves it at `/`, and reverse-proxies `/api/v1/*` to `concave serve`. The browser talks to `concave-web` only; `concave-web` talks to the local API.

## Development

### Prerequisites

Install Go 1.25 or newer, Node.js 20 or newer, and npm.

### Build

```bash
cd frontend
npm ci
npm run build
cd ..
CGO_ENABLED=0 go build -o concave-web .
```

### Test

```bash
go test ./...
```

### Repo layout

```text
concave-web/
  frontend/src/      Vue routes, stores, components, styles
  internal/proxy/    reverse proxy wiring
  internal/config/   local config loading and saving
  docs/              user and contributor docs
  main.go            binary entrypoint and embedded asset server
```

## Roadmap

The current line covers dashboard, suites, logs, workspace, doctor, environment, fleet, Gradient Lab, settings, and admin-only system and user views. Upcoming work focuses on deeper parity with the full `concave` command surface and broader multi-node operations.

## License

License terms have not been published in this repository yet.
